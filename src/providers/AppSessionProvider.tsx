import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  fetchMyProfile,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword,
} from '../features/auth/api';
import type { SignInFormValues, SignUpFormValues } from '../features/auth/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import type { ProfileRecord } from '../lib/supabase/types';

const GUEST_MODE_STORAGE_KEY = 'eventure.guest-mode';

type SessionMode = 'initializing' | 'unauthenticated' | 'guest' | 'authenticated';

type AppSessionContextValue = {
  mode: SessionMode;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isSupabaseConfigured: boolean;
  session: Session | null;
  profile: ProfileRecord | null;
  errorMessage: string | null;
  continueAsGuest: () => Promise<void>;
  clearError: () => void;
  signIn: (values: SignInFormValues) => Promise<void>;
  signUp: (values: SignUpFormValues) => Promise<void>;
  signOut: () => Promise<void>;
};

type AppSessionProviderProps = {
  children: React.ReactNode;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

async function persistGuestMode(enabled: boolean) {
  if (enabled) {
    await AsyncStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
    return;
  }

  await AsyncStorage.removeItem(GUEST_MODE_STORAGE_KEY);
}

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  const [mode, setMode] = useState<SessionMode>('initializing');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncFromSession(nextSession: Session | null) {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      if (!isSupabaseConfigured || !supabase) {
        const hasGuestMode = await AsyncStorage.getItem(GUEST_MODE_STORAGE_KEY);
        if (isMounted) {
          setProfile(null);
          setMode(hasGuestMode ? 'guest' : 'unauthenticated');
        }
        return;
      }

      if (!nextSession?.user) {
        const hasGuestMode = await AsyncStorage.getItem(GUEST_MODE_STORAGE_KEY);
        if (isMounted) {
          setProfile(null);
          setMode(hasGuestMode ? 'guest' : 'unauthenticated');
        }
        return;
      }

      const { data, error } = await fetchMyProfile(nextSession.user.id);

      if (!isMounted) {
        return;
      }

      if (error) {
        setProfile(null);
        setMode('authenticated');
        setErrorMessage(error.message);
        return;
      }

      if (!data) {
        setProfile(null);
        setMode('authenticated');
        setErrorMessage('Your account is missing some setup details. Please sign out and sign back in.');
        return;
      }

      if (data.is_suspended) {
        await signOutCurrentUser();
        await persistGuestMode(false);

        if (isMounted) {
          setProfile(null);
          setMode('unauthenticated');
          setErrorMessage('This account is suspended.');
        }
        return;
      }

      await persistGuestMode(false);
      setProfile(data);
      setMode('authenticated');
      setErrorMessage(null);
    }

    async function initialize() {
      const guestMode = await AsyncStorage.getItem(GUEST_MODE_STORAGE_KEY);

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setMode(guestMode ? 'guest' : 'unauthenticated');
        }
        return;
      }

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      await syncFromSession(initialSession);
    }

    void initialize();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncFromSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      mode,
      isInitializing: mode === 'initializing',
      isAuthenticated: mode === 'authenticated',
      isGuest: mode === 'guest',
      isSupabaseConfigured,
      session,
      profile,
      errorMessage,
      continueAsGuest: async () => {
        await persistGuestMode(true);
        setProfile(null);
        setErrorMessage(null);
        setMode('guest');
      },
      clearError: () => setErrorMessage(null),
      signIn: async (values) => {
        setErrorMessage(null);
        await persistGuestMode(false);
        const { error } = await signInWithPassword(values);

        if (error) {
          throw error;
        }
      },
      signUp: async (values) => {
        setErrorMessage(null);
        await persistGuestMode(false);
        const { error } = await signUpWithPassword(values);

        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        await persistGuestMode(false);
        setProfile(null);
        setErrorMessage(null);

        if (!supabase) {
          setMode('unauthenticated');
          return;
        }

        const { error } = await signOutCurrentUser();

        if (error) {
          throw error;
        }
      },
    }),
    [errorMessage, mode, profile, session],
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }

  return context;
}

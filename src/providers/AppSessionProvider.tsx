import { createContext, useContext, useMemo, useState } from 'react';

type SessionMode = 'unauthenticated' | 'guest' | 'authenticated';

type AppSessionContextValue = {
  mode: SessionMode;
  isAuthenticated: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  completePlaceholderAuth: () => void;
  signOut: () => void;
};

type AppSessionProviderProps = {
  children: React.ReactNode;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  const [mode, setMode] = useState<SessionMode>('unauthenticated');

  const value = useMemo<AppSessionContextValue>(
    () => ({
      mode,
      isAuthenticated: mode === 'authenticated',
      isGuest: mode === 'guest',
      continueAsGuest: () => setMode('guest'),
      completePlaceholderAuth: () => setMode('authenticated'),
      signOut: () => setMode('unauthenticated'),
    }),
    [mode],
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

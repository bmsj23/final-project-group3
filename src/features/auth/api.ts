import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';
import type { ProfileRecord } from '../../lib/supabase/types';
import type { SignInFormValues, SignUpFormValues } from './types';

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Sign in is not available right now. Please try again later.');
  }

  return supabase;
}

export async function signInWithPassword(values: SignInFormValues) {
  const client = getSupabaseClient();

  return client.auth.signInWithPassword({
    email: values.email.trim(),
    password: values.password,
  });
}

export async function signUpWithPassword(values: SignUpFormValues) {
  const client = getSupabaseClient();

  return client.auth.signUp({
    email: values.email.trim(),
    password: values.password,
    options: {
      data: {
        full_name: values.fullName.trim(),
      },
    },
  });
}

export async function signOutCurrentUser() {
  const client = getSupabaseClient();
  return client.auth.signOut();
}

export async function fetchMyProfile(userId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<ProfileRecord>();

  return { data, error };
}

export function assertActiveProfile(profile: ProfileRecord | null, session: Session | null) {
  if (!session?.user) {
    return null;
  }

  if (!profile) {
    throw new Error('Your account is missing some setup details. Please sign out and sign back in.');
  }

  if (profile.is_suspended) {
    throw new Error('This account is suspended.');
  }

  return profile;
}

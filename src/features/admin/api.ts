import { supabase } from '../../lib/supabase/client';
import type { EventRecord, ProfileRecord } from '../../lib/supabase/types';
import type { EventStatus } from '../events/types';
import type { AdminUserSummary } from './types';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Admin tools are not available right now. Please try again later.');
  }

  return supabase;
}

function mapAdminUser(record: ProfileRecord): AdminUserSummary {
  return {
    id: record.id,
    email: record.email,
    fullName: record.full_name,
    role: record.role,
    isSuspended: record.is_suspended,
    createdAt: record.created_at,
  };
}

export async function fetchAdminUsers() {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return {
    data: data?.map(mapAdminUser) ?? [],
    error,
  };
}

export async function updateUserRoleByAdmin(userId: string, role: 'admin' | 'user') {
  const client = requireSupabase();

  return client
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single<ProfileRecord>();
}

export async function setUserSuspensionByAdmin(userId: string, isSuspended: boolean) {
  const client = requireSupabase();

  return client
    .from('profiles')
    .update({ is_suspended: isSuspended })
    .eq('id', userId)
    .select('*')
    .single<ProfileRecord>();
}

export async function deleteUserByAdmin(userId: string) {
  const client = requireSupabase();
  return client.from('profiles').delete().eq('id', userId);
}

export async function fetchModerationEvents() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    data: data ?? [],
    error,
  };
}

export async function updateEventStatusByAdmin(eventId: string, status: EventStatus) {
  const client = requireSupabase();
  return client
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .select('*')
    .single<EventRecord>();
}

export async function deleteEventByAdmin(eventId: string) {
  const client = requireSupabase();
  return client.from('events').delete().eq('id', eventId);
}

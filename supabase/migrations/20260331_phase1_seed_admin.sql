-- Run this after creating the auth user for the admin account in the Supabase dashboard.
-- Replace the placeholder UUID and email before applying.

insert into public.profiles (id, email, full_name, role)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'Platform Admin',
  'admin'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  updated_at = timezone('utc', now());

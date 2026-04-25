-- Phase 5 foundation: allow admin-managed profile deletes (except self-delete).

drop policy if exists "Admins delete any profile" on public.profiles;
create policy "Admins delete any profile"
on public.profiles
for delete
to authenticated
using (public.is_admin() and auth.uid() <> id);

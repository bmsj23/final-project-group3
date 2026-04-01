-- Phase 2 follow-up: owner-readable events plus event-images storage bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Events are readable when public" on public.events;
create policy "Events are readable when public or owned"
on public.events
for select
using (not is_flagged or auth.uid() = organizer_id or public.is_admin());

drop policy if exists "Authenticated users upload event images" on storage.objects;
create policy "Authenticated users upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners delete event images" on storage.objects;
create policy "Owners delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

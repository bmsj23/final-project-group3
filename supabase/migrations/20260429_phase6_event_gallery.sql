create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint event_images_url_not_blank check (length(trim(image_url)) > 0)
);

create index if not exists idx_event_images_event_id on public.event_images (event_id);
create unique index if not exists idx_event_images_event_order on public.event_images (event_id, display_order);

alter table public.event_images enable row level security;

drop policy if exists "Event images are readable for visible events" on public.event_images;
create policy "Event images are readable for visible events"
on public.event_images
for select
using (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and (not events.is_flagged or events.organizer_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Organizers create images for own events" on public.event_images;
create policy "Organizers create images for own events"
on public.event_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and (events.organizer_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Organizers update images for own events" on public.event_images;
create policy "Organizers update images for own events"
on public.event_images
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and (events.organizer_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and (events.organizer_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Organizers delete images for own events" on public.event_images;
create policy "Organizers delete images for own events"
on public.event_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and (events.organizer_id = auth.uid() or public.is_admin())
  )
);

-- Phase 2 foundation: categories, events, public read access, and owner/admin RLS.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'event_status'
  ) then
    create type public.event_status as enum ('upcoming', 'ongoing', 'completed', 'cancelled');
  end if;
end $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_name text not null,
  display_order integer not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  date_time timestamptz not null,
  location text not null,
  capacity integer not null,
  category_id uuid not null references public.categories (id),
  cover_image_url text,
  tags text[] not null default '{}',
  registration_deadline timestamptz not null,
  status public.event_status not null default 'upcoming',
  is_flagged boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_title_not_blank check (length(trim(title)) > 0),
  constraint events_description_not_blank check (length(trim(description)) > 0),
  constraint events_location_not_blank check (length(trim(location)) > 0),
  constraint events_capacity_positive check (capacity > 0),
  constraint events_deadline_before_event check (registration_deadline < date_time)
);

drop trigger if exists events_set_updated_at on public.events;

create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

create index if not exists idx_events_category_id on public.events (category_id);
create index if not exists idx_events_date_time on public.events (date_time);
create index if not exists idx_events_status on public.events (status);
create index if not exists idx_events_organizer_id on public.events (organizer_id);

alter table public.categories enable row level security;
alter table public.events enable row level security;

drop policy if exists "Categories are readable by everyone" on public.categories;
create policy "Categories are readable by everyone"
on public.categories
for select
using (true);

drop policy if exists "Events are readable when public" on public.events;
create policy "Events are readable when public"
on public.events
for select
using (not is_flagged or public.is_admin());

drop policy if exists "Authenticated users create own events" on public.events;
create policy "Authenticated users create own events"
on public.events
for insert
to authenticated
with check (auth.uid() = organizer_id);

drop policy if exists "Organizers update own events" on public.events;
create policy "Organizers update own events"
on public.events
for update
to authenticated
using (auth.uid() = organizer_id or public.is_admin())
with check (auth.uid() = organizer_id or public.is_admin());

drop policy if exists "Organizers delete own events" on public.events;
create policy "Organizers delete own events"
on public.events
for delete
to authenticated
using (auth.uid() = organizer_id or public.is_admin());

insert into public.categories (name, icon_name, display_order)
values
  ('Academic', 'school', 1),
  ('Social', 'users', 2),
  ('Sports', 'trophy', 3),
  ('Music', 'music', 4),
  ('Community', 'heart', 5)
on conflict (name) do update
set
  icon_name = excluded.icon_name,
  display_order = excluded.display_order;

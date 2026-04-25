-- Phase 3 foundation: persisted event favorites.

create table if not exists public.event_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint event_favorites_user_event_unique unique (user_id, event_id)
);

create index if not exists idx_event_favorites_user_id on public.event_favorites (user_id);
create index if not exists idx_event_favorites_event_id on public.event_favorites (event_id);
create index if not exists idx_event_favorites_created_at on public.event_favorites (created_at desc);

alter table public.event_favorites enable row level security;

drop policy if exists "Users read own favorites" on public.event_favorites;
create policy "Users read own favorites"
on public.event_favorites
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users create own favorites" on public.event_favorites;
create policy "Users create own favorites"
on public.event_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own favorites" on public.event_favorites;
create policy "Users delete own favorites"
on public.event_favorites
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

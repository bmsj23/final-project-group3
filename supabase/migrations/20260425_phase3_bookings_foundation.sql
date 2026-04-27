-- Phase 3 foundation: bookings schema, RLS, and booking RPCs.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'booking_status'
  ) then
    create type public.booking_status as enum ('confirmed', 'cancelled', 'completed');
  end if;
end $$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  ticket_count integer not null,
  status public.booking_status not null default 'confirmed',
  qr_payload text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_ticket_count_positive check (ticket_count > 0)
);

drop trigger if exists bookings_set_updated_at on public.bookings;

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute procedure public.set_updated_at();

create unique index if not exists idx_bookings_user_event_confirmed_unique
on public.bookings (user_id, event_id)
where status = 'confirmed';

create index if not exists idx_bookings_user_status
on public.bookings (user_id, status, created_at desc);

create index if not exists idx_bookings_event_status
on public.bookings (event_id, status, created_at desc);

alter table public.bookings enable row level security;

drop policy if exists "Users read own bookings" on public.bookings;
create policy "Users read own bookings"
on public.bookings
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
  or exists (
    select 1
    from public.events
    where events.id = bookings.event_id
      and events.organizer_id = auth.uid()
  )
);

drop policy if exists "Users create own bookings" on public.bookings;
create policy "Users create own bookings"
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own bookings" on public.bookings;
create policy "Users update own bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own bookings" on public.bookings;
create policy "Users delete own bookings"
on public.bookings
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.register_for_event(p_event_id uuid, p_ticket_count integer)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_event public.events%rowtype;
  v_confirmed_tickets integer;
  v_booking public.bookings%rowtype;
  v_booking_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_event_id is null then
    raise exception 'Event id is required.' using errcode = '22023';
  end if;

  if p_ticket_count is null or p_ticket_count <= 0 then
    raise exception 'Ticket count must be greater than zero.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = v_user_id
      and is_suspended = true
  ) then
    raise exception 'Suspended users cannot register for events.' using errcode = '42501';
  end if;

  select *
  into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  if v_event.is_flagged then
    raise exception 'This event is not available for registration.' using errcode = '22023';
  end if;

  if v_event.status <> 'upcoming' then
    raise exception 'This event is not open for registration.' using errcode = '22023';
  end if;

  if v_now > v_event.registration_deadline then
    raise exception 'Registration deadline has passed.' using errcode = '22023';
  end if;

  if v_now >= v_event.date_time then
    raise exception 'This event has already started.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.bookings
    where user_id = v_user_id
      and event_id = p_event_id
      and status = 'confirmed'
  ) then
    raise exception 'You already have an active booking for this event.' using errcode = '23505';
  end if;

  select coalesce(sum(ticket_count), 0)::integer
  into v_confirmed_tickets
  from public.bookings
  where event_id = p_event_id
    and status = 'confirmed';

  if v_confirmed_tickets + p_ticket_count > v_event.capacity then
    raise exception 'Not enough remaining slots for this event.' using errcode = '22023';
  end if;

  insert into public.bookings (id, user_id, event_id, ticket_count, status, qr_payload)
  values (
    v_booking_id,
    v_user_id,
    p_event_id,
    p_ticket_count,
    'confirmed',
    format('booking:%s|event:%s|user:%s', v_booking_id, p_event_id, v_user_id)
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

create or replace function public.update_booking_tickets(p_booking_id uuid, p_ticket_count integer)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
  v_other_confirmed_tickets integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_booking_id is null then
    raise exception 'Booking id is required.' using errcode = '22023';
  end if;

  if p_ticket_count is null or p_ticket_count <= 0 then
    raise exception 'Ticket count must be greater than zero.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = v_user_id
      and is_suspended = true
  ) then
    raise exception 'Suspended users cannot update bookings.' using errcode = '42501';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.' using errcode = 'P0002';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'You can only update your own booking.' using errcode = '42501';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception 'Only confirmed bookings can be updated.' using errcode = '22023';
  end if;

  select *
  into v_event
  from public.events
  where id = v_booking.event_id
  for update;

  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  if v_event.is_flagged then
    raise exception 'This event is not available for booking updates.' using errcode = '22023';
  end if;

  if v_event.status <> 'upcoming' then
    raise exception 'Bookings cannot be updated for this event status.' using errcode = '22023';
  end if;

  if v_now > v_event.registration_deadline then
    raise exception 'Registration deadline has passed.' using errcode = '22023';
  end if;

  if v_now >= v_event.date_time then
    raise exception 'This event has already started.' using errcode = '22023';
  end if;

  select coalesce(sum(ticket_count), 0)::integer
  into v_other_confirmed_tickets
  from public.bookings
  where event_id = v_booking.event_id
    and status = 'confirmed'
    and id <> v_booking.id;

  if v_other_confirmed_tickets + p_ticket_count > v_event.capacity then
    raise exception 'Not enough remaining slots for this ticket change.' using errcode = '22023';
  end if;

  update public.bookings
  set ticket_count = p_ticket_count
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_booking public.bookings%rowtype;
  v_event public.events%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_booking_id is null then
    raise exception 'Booking id is required.' using errcode = '22023';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.' using errcode = 'P0002';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'You can only cancel your own booking.' using errcode = '42501';
  end if;

  if v_booking.status = 'cancelled' then
    return v_booking;
  end if;

  if v_booking.status = 'completed' then
    raise exception 'Completed bookings cannot be cancelled.' using errcode = '22023';
  end if;

  select *
  into v_event
  from public.events
  where id = v_booking.event_id
  for update;

  if found then
    if v_now >= v_event.date_time or v_event.status = 'completed' then
      raise exception 'Bookings cannot be cancelled after the event starts.' using errcode = '22023';
    end if;
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

create or replace function public.fetch_my_bookings()
returns table (
  booking_id uuid,
  event_id uuid,
  user_id uuid,
  ticket_count integer,
  status public.booking_status,
  computed_status public.booking_status,
  qr_payload text,
  booking_created_at timestamptz,
  booking_updated_at timestamptz,
  event_title text,
  event_location text,
  event_date_time timestamptz,
  event_registration_deadline timestamptz,
  event_capacity integer,
  event_cover_image_url text,
  event_status public.event_status,
  organizer_id uuid,
  organizer_name text,
  organizer_avatar_url text,
  confirmed_tickets integer,
  remaining_slots integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  return query
  select
    b.id as booking_id,
    b.event_id,
    b.user_id,
    b.ticket_count,
    b.status,
    case
      when b.status = 'cancelled' or e.status = 'cancelled' then 'cancelled'::public.booking_status
      when b.status = 'completed' or e.status = 'completed' or e.date_time <= timezone('utc', now()) then 'completed'::public.booking_status
      else 'confirmed'::public.booking_status
    end as computed_status,
    b.qr_payload,
    b.created_at as booking_created_at,
    b.updated_at as booking_updated_at,
    e.title as event_title,
    e.location as event_location,
    e.date_time as event_date_time,
    e.registration_deadline as event_registration_deadline,
    e.capacity as event_capacity,
    e.cover_image_url as event_cover_image_url,
    e.status as event_status,
    e.organizer_id,
    organizer.full_name as organizer_name,
    organizer.avatar_url as organizer_avatar_url,
    coalesce(event_capacity.confirmed_tickets, 0) as confirmed_tickets,
    greatest(e.capacity - coalesce(event_capacity.confirmed_tickets, 0), 0) as remaining_slots
  from public.bookings b
  join public.events e
    on e.id = b.event_id
  left join public.profiles organizer
    on organizer.id = e.organizer_id
  left join lateral (
    select coalesce(sum(ticket_count), 0)::integer as confirmed_tickets
    from public.bookings
    where event_id = b.event_id
      and status = 'confirmed'
  ) event_capacity on true
  where b.user_id = v_user_id
  order by b.created_at desc;
end;
$$;

create or replace function public.fetch_event_remaining_slots(p_event_ids uuid[])
returns table (
  event_id uuid,
  confirmed_tickets integer,
  remaining_slots integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    return;
  end if;

  return query
  select
    e.id as event_id,
    coalesce(sum(b.ticket_count) filter (where b.status = 'confirmed'), 0)::integer as confirmed_tickets,
    greatest(
      e.capacity - coalesce(sum(b.ticket_count) filter (where b.status = 'confirmed'), 0)::integer,
      0
    ) as remaining_slots
  from public.events e
  left join public.bookings b
    on b.event_id = e.id
  where e.id = any(p_event_ids)
  group by e.id, e.capacity;
end;
$$;

revoke all on function public.register_for_event(uuid, integer) from public;
revoke all on function public.update_booking_tickets(uuid, integer) from public;
revoke all on function public.cancel_booking(uuid) from public;
revoke all on function public.fetch_my_bookings() from public;
revoke all on function public.fetch_event_remaining_slots(uuid[]) from public;

grant execute on function public.register_for_event(uuid, integer) to authenticated;
grant execute on function public.update_booking_tickets(uuid, integer) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.fetch_my_bookings() to authenticated;
grant execute on function public.fetch_event_remaining_slots(uuid[]) to anon, authenticated;

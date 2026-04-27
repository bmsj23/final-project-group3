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
    select coalesce(sum(event_bookings.ticket_count), 0)::integer as confirmed_tickets
    from public.bookings event_bookings
    where event_bookings.event_id = b.event_id
      and event_bookings.status = 'confirmed'
  ) event_capacity on true
  where b.user_id = v_user_id
  order by b.created_at desc;
end;
$$;

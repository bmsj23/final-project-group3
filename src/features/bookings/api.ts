import { supabase } from '../../lib/supabase/client';
import type { BookingRecord, FetchMyBookingsRow } from '../../lib/supabase/types';
import type { BookingHistoryItem, BookingSummary } from './types';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Booking features are not available right now. Please try again later.');
  }

  return supabase;
}

function mapBookingSummary(record: BookingRecord): BookingSummary {
  return {
    id: record.id,
    eventId: record.event_id,
    ticketCount: record.ticket_count,
    status: record.status,
  };
}

function mapBookingHistoryItem(record: FetchMyBookingsRow): BookingHistoryItem {
  return {
    id: record.booking_id,
    eventId: record.event_id,
    ticketCount: record.ticket_count,
    status: record.status,
    computedStatus: record.computed_status,
    qrPayload: record.qr_payload,
    createdAt: record.booking_created_at,
    updatedAt: record.booking_updated_at,
    eventTitle: record.event_title,
    eventLocation: record.event_location,
    eventDateTime: record.event_date_time,
    eventRegistrationDeadline: record.event_registration_deadline,
    eventStatus: record.event_status,
    eventCapacity: record.event_capacity,
    eventCoverImageUrl: record.event_cover_image_url,
    organizerId: record.organizer_id,
    organizerName: record.organizer_name,
    organizerAvatarUrl: record.organizer_avatar_url,
    confirmedTickets: record.confirmed_tickets,
    remainingSlots: record.remaining_slots,
  };
}

export async function registerForEvent(eventId: string, ticketCount: number) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('register_for_event', {
    p_event_id: eventId,
    p_ticket_count: ticketCount,
  });

  return {
    data: data ? mapBookingSummary(data) : null,
    error,
  };
}

export async function updateBookingTickets(bookingId: string, ticketCount: number) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('update_booking_tickets', {
    p_booking_id: bookingId,
    p_ticket_count: ticketCount,
  });

  return {
    data: data ? mapBookingSummary(data) : null,
    error,
  };
}

export async function cancelBooking(bookingId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('cancel_booking', {
    p_booking_id: bookingId,
  });

  return {
    data: data ? mapBookingSummary(data) : null,
    error,
  };
}

export async function fetchMyBookingForEvent(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('bookings')
    .select('id, user_id, event_id, ticket_count, status, qr_payload, created_at, updated_at')
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .maybeSingle<BookingRecord>();

  return {
    data: data ? mapBookingSummary(data) : null,
    error,
  };
}

export async function fetchMyBookings() {
  const client = requireSupabase();
  const { data, error } = await client.rpc('fetch_my_bookings');

  if (error) {
    const message = error.message ?? error.details ?? 'Unable to load your registrations.';
    return { data: [] as ReturnType<typeof mapBookingHistoryItem>[], error: new Error(message) };
  }

  return {
    data: (data ?? []).map(mapBookingHistoryItem),
    error: null,
  };
}

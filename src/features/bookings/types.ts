export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export type BookingSummary = {
  id: string;
  eventId: string;
  ticketCount: number;
  status: BookingStatus;
};

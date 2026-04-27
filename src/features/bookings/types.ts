export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export type BookingSummary = {
  id: string;
  eventId: string;
  ticketCount: number;
  status: BookingStatus;
};

export type BookingHistoryItem = BookingSummary & {
  computedStatus: BookingStatus;
  qrPayload: string;
  createdAt: string;
  updatedAt: string;
  eventTitle: string;
  eventLocation: string;
  eventDateTime: string;
  eventRegistrationDeadline: string;
  eventStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  eventCapacity: number;
  eventCoverImageUrl: string | null;
  organizerId: string;
  organizerName: string | null;
  organizerAvatarUrl: string | null;
  confirmedTickets: number;
  remainingSlots: number;
};

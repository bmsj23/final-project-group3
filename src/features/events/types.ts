export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type EventSummary = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  capacity: number;
  remainingSlots: number;
  status: EventStatus;
};

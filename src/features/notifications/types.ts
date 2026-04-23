export type NotificationType =
  | 'booking_confirmation'
  | 'event_update'
  | 'event_reminder'
  | 'event_registration';

export type NotificationSummary = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  eventId?: string;
  eventTitle?: string;
  eventLocation?: string;
  eventStartsAt?: string;
  capacity?: number;
  remainingSlots?: number;
  registeredCount?: number;
};

export type NotificationType = 'booking_confirmation' | 'event_update' | 'event_reminder';

export type NotificationSummary = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
};

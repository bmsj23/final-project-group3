import { fetchMyCreatedEvents } from '../events/api';
import type { NotificationSummary } from './types';

function getNotificationTitle(eventTitle: string, registeredCount: number) {
  if (registeredCount <= 0) {
    return `Registration updates enabled for ${eventTitle}`;
  }

  if (registeredCount === 1) {
    return `New attendee for ${eventTitle}`;
  }

  return `${registeredCount} attendees registered for ${eventTitle}`;
}

function getNotificationBody(
  eventTitle: string,
  capacity: number,
  remainingSlots: number,
  registeredCount: number,
) {
  if (registeredCount <= 0) {
    return `You'll receive a notification here once someone registers for ${eventTitle}. Current capacity is ${remainingSlots} of ${capacity} slots available.`;
  }

  if (registeredCount === 1) {
    return `A user has registered for your event. You now have ${remainingSlots} of ${capacity} slots remaining.`;
  }

  return `${registeredCount} users have registered for your event. You now have ${remainingSlots} of ${capacity} slots remaining.`;
}

export async function fetchOrganizerNotifications(organizerId: string) {
  const { data, error } = await fetchMyCreatedEvents(organizerId);

  if (error) {
    return {
      data: [] as NotificationSummary[],
      error,
    };
  }

  const notifications = data
    .map((event) => {
      const registeredCount = Math.max(event.capacity - event.remainingSlots, 0);

      return {
        id: `event-${event.id}`,
        title: getNotificationTitle(event.title, registeredCount),
        body: getNotificationBody(event.title, event.capacity, event.remainingSlots, registeredCount),
        type: registeredCount > 0 ? 'event_registration' : 'event_update',
        isRead: false,
        createdAt: event.startsAt,
        eventId: event.id,
        eventTitle: event.title,
        eventLocation: event.location,
        eventStartsAt: event.startsAt,
        capacity: event.capacity,
        remainingSlots: event.remainingSlots,
        registeredCount,
      } satisfies NotificationSummary;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    data: notifications,
    error: null,
  };
}

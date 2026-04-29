import type { EventDetail, EventFormValues } from './types';

export function createEmptyEventFormValues(): EventFormValues {
  return {
    title: '',
    description: '',
    location: '',
    dateTime: '',
    registrationDeadline: '',
    capacity: 0,
    category: '',
    tags: [],
    coverImageUrl: null,
    imageUrls: [],
  };
}

export function mapEventDetailToFormValues(event: EventDetail): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    dateTime: event.startsAt,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    category: event.categoryId,
    tags: event.tags,
    coverImageUrl: event.coverImageUrl,
    imageUrls: event.imageUrls,
  };
}

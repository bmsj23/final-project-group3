import type { EventFormErrors, EventFormValues } from './types';

export function hasPositiveCapacity(capacity: number) {
  return capacity > 0;
}

export function isFutureIsoDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > Date.now();
}

export function isRegistrationDeadlineBeforeEvent(deadline: string, eventDateTime: string) {
  const deadlineDate = new Date(deadline);
  const eventDate = new Date(eventDateTime);

  return (
    Number.isFinite(deadlineDate.getTime()) &&
    Number.isFinite(eventDate.getTime()) &&
    deadlineDate.getTime() <= eventDate.getTime()
  );
}

export function normalizeEventTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

export function validateEventForm(values: EventFormValues) {
  const errors: EventFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!values.location.trim()) {
    errors.location = 'Location is required.';
  }

  if (!values.category) {
    errors.category = 'Category is required.';
  }

  if (!hasPositiveCapacity(values.capacity)) {
    errors.capacity = 'Capacity must be greater than zero.';
  }

  if (!isFutureIsoDate(values.dateTime)) {
    errors.dateTime = 'Event date must be in the future.';
  }

  if (!isFutureIsoDate(values.registrationDeadline)) {
    errors.registrationDeadline = 'Registration deadline must be in the future.';
  } else if (!isRegistrationDeadlineBeforeEvent(values.registrationDeadline, values.dateTime)) {
    errors.registrationDeadline = 'Registration deadline cannot be after the event date and time.';
  }

  return errors;
}

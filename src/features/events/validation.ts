export function hasPositiveCapacity(capacity: number) {
  return capacity > 0;
}

export function isFutureIsoDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > Date.now();
}

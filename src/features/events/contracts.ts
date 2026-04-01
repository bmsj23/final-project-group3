export const EVENT_IMAGES_BUCKET = 'event-images';
export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_MAX_SIZE_LABEL = '5 MB';
export const EVENT_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

const EVENT_IMAGE_MIME_BY_EXTENSION: Record<string, (typeof EVENT_IMAGE_ALLOWED_MIME_TYPES)[number]> = {
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function isAllowedEventImageMimeType(mimeType: string) {
  return EVENT_IMAGE_ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof EVENT_IMAGE_ALLOWED_MIME_TYPES)[number],
  );
}

export function inferEventImageMimeType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.split('?')[0]?.toLowerCase() ?? '';
  const extension = normalized.split('.').at(-1);

  if (!extension) {
    return null;
  }

  return EVENT_IMAGE_MIME_BY_EXTENSION[extension] ?? null;
}

import { supabase, supabaseConfig } from '../../lib/supabase/client';
import type {
  CategoryRecord,
  EventFavoriteRecord,
  EventRecord,
  EventRemainingSlotsRow,
  ProfileRecord,
} from '../../lib/supabase/types';
import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MAX_SIZE_LABEL,
  EVENT_IMAGES_BUCKET,
  isAllowedEventImageMimeType,
} from './contracts';
import { normalizeEventTags } from './validation';
import type {
  EventCategorySummary,
  EventDetail,
  EventFormValues,
  EventImageAsset,
  EventImageUploadResult,
  EventStatus,
  EventSummary,
} from './types';

type EventRecordWithCategory = EventRecord & {
  categories: Pick<CategoryRecord, 'name'> | Array<Pick<CategoryRecord, 'name'>> | null;
  organizer: Pick<ProfileRecord, 'full_name' | 'avatar_url'> | Array<Pick<ProfileRecord, 'full_name' | 'avatar_url'>> | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('This feature is not available right now. Please try again later.');
  }

  return supabase;
}

async function fetchRemainingSlotsByEventIds(eventIds: string[]) {
  const client = requireSupabase();
  const uniqueIds = Array.from(new Set(eventIds));

  if (uniqueIds.length === 0) {
    return {
      data: new Map<string, number>(),
      error: null,
    };
  }

  const { data, error } = await client.rpc('fetch_event_remaining_slots', {
    p_event_ids: uniqueIds,
  });

  const remainingSlotsByEventId = new Map<string, number>();
  const rows: EventRemainingSlotsRow[] = data ?? [];

  for (const row of rows) {
    remainingSlotsByEventId.set(row.event_id, row.remaining_slots);
  }

  return {
    data: remainingSlotsByEventId,
    error,
  };
}

function mapEvent(record: EventRecord, remainingSlots?: number): EventSummary {
  return {
    id: record.id,
    organizerId: record.organizer_id,
    title: record.title,
    location: record.location,
    startsAt: record.date_time,
    capacity: record.capacity,
    remainingSlots: remainingSlots ?? record.capacity,
    status: record.status,
    categoryId: record.category_id,
    coverImageUrl: record.cover_image_url,
  };
}

function mapEventDetail(record: EventRecordWithCategory, remainingSlots?: number): EventDetail {
  const category = Array.isArray(record.categories) ? record.categories[0] : record.categories;
  const organizer = Array.isArray(record.organizer) ? record.organizer[0] : record.organizer;

  return {
    ...mapEvent(record, remainingSlots),
    description: record.description,
    registrationDeadline: record.registration_deadline,
    tags: record.tags,
    categoryName: category?.name ?? null,
    organizerName: organizer?.full_name ?? null,
    organizerAvatarUrl: organizer?.avatar_url ?? null,
    isFlagged: record.is_flagged,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapCategory(record: CategoryRecord): EventCategorySummary {
  return {
    id: record.id,
    name: record.name,
    iconName: record.icon_name,
    displayOrder: record.display_order,
  };
}

function buildEventPayload(values: EventFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    date_time: values.dateTime,
    registration_deadline: values.registrationDeadline,
    capacity: values.capacity,
    category_id: values.category,
    cover_image_url: values.coverImageUrl ?? null,
    tags: normalizeEventTags(values.tags),
  };
}

function sanitizeFileName(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  return sanitized || 'cover.jpg';
}

function getFileExtension(fileName: string) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? 'jpg' : 'jpg';
}

function getPublicImagePath(publicUrl: string | null) {
  if (!publicUrl || !supabaseConfig.url) {
    return null;
  }

  const normalizedUrl = publicUrl.split('?')[0];
  const prefix = `${supabaseConfig.url}/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`;

  if (!normalizedUrl.startsWith(prefix)) {
    return null;
  }

  return decodeURIComponent(normalizedUrl.slice(prefix.length));
}

export async function fetchCategories() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  return {
    data: data?.map(mapCategory) ?? [],
    error,
  };
}

export async function fetchUpcomingEvents() {
  const client = requireSupabase();
  const nowIso = new Date().toISOString();

  const { data, error } = await client
    .from('events')
    .select('*')
    .gte('date_time', nowIso)
    .order('date_time', { ascending: true })
    .limit(20);

  const records = data ?? [];
  const { data: remainingSlotsByEventId, error: remainingSlotsError } = await fetchRemainingSlotsByEventIds(
    records.map((record) => record.id),
  );

  return {
    data: records.map((record) => mapEvent(record, remainingSlotsByEventId.get(record.id))),
    error: error ?? remainingSlotsError,
  };
}

export async function fetchMyCreatedEvents(organizerId: string) {
  const client = requireSupabase();

  const { data, error } = await client
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('date_time', { ascending: true });

  const records = data ?? [];
  const { data: remainingSlotsByEventId, error: remainingSlotsError } = await fetchRemainingSlotsByEventIds(
    records.map((record) => record.id),
  );

  return {
    data: records.map((record) => mapEvent(record, remainingSlotsByEventId.get(record.id))),
    error: error ?? remainingSlotsError,
  };
}

export async function fetchMyFavoriteEventIds(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('event_favorites')
    .select('event_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: data?.map((record) => record.event_id) ?? [],
    error,
  };
}

export async function addFavoriteEvent(userId: string, eventId: string) {
  const client = requireSupabase();
  return client
    .from('event_favorites')
    .insert({
      user_id: userId,
      event_id: eventId,
    })
    .select('id, user_id, event_id, created_at')
    .single<EventFavoriteRecord>();
}

export async function removeFavoriteEvent(userId: string, eventId: string) {
  const client = requireSupabase();
  return client
    .from('event_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
}

export async function fetchEventsByIds(eventIds: string[]) {
  const client = requireSupabase();

  if (eventIds.length === 0) {
    return { data: [] as EventSummary[], error: null };
  }

  const { data, error } = await client
    .from('events')
    .select('*')
    .in('id', eventIds);

  const order = new Map(eventIds.map((id, index) => [id, index]));
  const orderedEvents = (data ?? []).sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  const { data: remainingSlotsByEventId, error: remainingSlotsError } = await fetchRemainingSlotsByEventIds(
    orderedEvents.map((record) => record.id),
  );

  return {
    data: orderedEvents.map((record) => mapEvent(record, remainingSlotsByEventId.get(record.id))),
    error: error ?? remainingSlotsError,
  };
}

export async function fetchMyFavoritedEvents(userId: string) {
  const { data: favoriteIds, error } = await fetchMyFavoriteEventIds(userId);

  if (error) {
    return {
      data: [] as EventSummary[],
      error,
    };
  }

  return fetchEventsByIds(favoriteIds);
}

export async function fetchEventById(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('events')
    .select(
      `
        id,
        organizer_id,
        title,
        description,
        date_time,
        location,
        capacity,
        category_id,
        cover_image_url,
        tags,
        registration_deadline,
        status,
        is_flagged,
        created_at,
        updated_at,
        categories (
          name
        ),
        organizer:profiles!events_organizer_id_fkey (
          full_name,
          avatar_url
        )
      `,
    )
    .eq('id', eventId)
    .maybeSingle<EventRecordWithCategory>();

  const { data: remainingSlotsByEventId, error: remainingSlotsError } = await fetchRemainingSlotsByEventIds(
    data ? [data.id] : [],
  );

  return {
    data: data ? mapEventDetail(data, remainingSlotsByEventId.get(data.id)) : null,
    error: error ?? remainingSlotsError,
  };
}

export async function createEvent(organizerId: string, values: EventFormValues) {
  const client = requireSupabase();
  const payload = buildEventPayload(values);

  const { data, error } = await client
    .from('events')
    .insert({
      ...payload,
      organizer_id: organizerId,
    })
    .select('*')
    .single<EventRecord>();

  return {
    data,
    error,
  };
}

export async function updateOwnEvent(eventId: string, values: EventFormValues) {
  const client = requireSupabase();
  const payload = buildEventPayload(values);

  const { data, error } = await client
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .select('*')
    .single<EventRecord>();

  return {
    data,
    error,
  };
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  const client = requireSupabase();
  return client
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .select('*')
    .single<EventRecord>();
}

export async function deleteOwnEvent(eventId: string) {
  const client = requireSupabase();
  return client.from('events').delete().eq('id', eventId);
}

export async function cancelOwnEvent(eventId: string) {
  const client = requireSupabase();
  return client.from('events').update({ status: 'cancelled' }).eq('id', eventId);
}

export async function uploadEventImage(organizerId: string, asset: EventImageAsset) {
  const client = requireSupabase();

  if (!isAllowedEventImageMimeType(asset.mimeType)) {
    return {
      data: null,
      error: new Error('Only JPG, PNG, WEBP, or HEIC images can be uploaded.'),
    };
  }

  const response = await fetch(asset.uri);

  if (!response.ok) {
    return {
      data: null,
      error: new Error('Unable to read the selected image before upload.'),
    };
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > EVENT_IMAGE_MAX_BYTES) {
    return {
      data: null,
      error: new Error(`Cover images must be ${EVENT_IMAGE_MAX_SIZE_LABEL} or smaller.`),
    };
  }

  const safeFileName = sanitizeFileName(asset.fileName || `cover.${getFileExtension(asset.fileName)}`);
  const path = `${organizerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName}`;

  const { error } = await client.storage.from(EVENT_IMAGES_BUCKET).upload(path, arrayBuffer, {
    contentType: asset.mimeType,
    upsert: false,
  });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const { data } = client.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);

  return {
    data: {
      path,
      publicUrl: data.publicUrl,
    } satisfies EventImageUploadResult,
    error: null,
  };
}

export async function deleteEventImage(path: string) {
  const client = requireSupabase();
  const { error } = await client.storage.from(EVENT_IMAGES_BUCKET).remove([path]);

  return { error };
}

export async function deleteEventImageFromPublicUrl(publicUrl: string | null) {
  const path = getPublicImagePath(publicUrl);

  if (!path) {
    return { error: null };
  }

  return deleteEventImage(path);
}

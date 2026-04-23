import { supabase, supabaseConfig } from '../../lib/supabase/client';
import type { ProfileRecord } from '../../lib/supabase/types';
import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MAX_SIZE_LABEL,
  EVENT_IMAGES_BUCKET,
  inferEventImageMimeType,
  isAllowedEventImageMimeType,
} from '../events/contracts';
import type { EventImageAsset, EventImageUploadResult } from '../events/types';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Profile updates are not available right now. Please try again later.');
  }

  return supabase;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function getFileExtension(fileName: string | null | undefined) {
  return fileName?.split('.').at(-1)?.toLowerCase() ?? 'jpg';
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

export async function updateMyProfile(
  userId: string,
  values: { fullName: string; bio: string | null; avatarUrl: string | null },
) {
  const client = requireSupabase();

  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: values.fullName.trim(),
      bio: values.bio,
      avatar_url: values.avatarUrl,
    })
    .eq('id', userId)
    .select('*')
    .single<ProfileRecord>();

  return { data, error };
}

export async function uploadProfileImage(userId: string, asset: EventImageAsset) {
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
      error: new Error(`Profile photos must be ${EVENT_IMAGE_MAX_SIZE_LABEL} or smaller.`),
    };
  }

  const safeFileName = sanitizeFileName(asset.fileName || `avatar.${getFileExtension(asset.fileName)}`);
  const path = `${userId}/avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName}`;

  const { error } = await client.storage.from(EVENT_IMAGES_BUCKET).upload(path, arrayBuffer, {
    contentType: asset.mimeType,
    upsert: false,
  });

  if (error) {
    return { data: null, error };
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

export async function deleteProfileImageFromPublicUrl(publicUrl: string | null) {
  const path = getPublicImagePath(publicUrl);

  if (!path) {
    return { error: null };
  }

  const client = requireSupabase();
  const { error } = await client.storage.from(EVENT_IMAGES_BUCKET).remove([path]);

  return { error };
}

export function inferProfileImageMimeType(value: string | null | undefined) {
  return inferEventImageMimeType(value);
}

export async function updateMyAuthEmail(email: string) {
  const client = requireSupabase();
  return client.auth.updateUser({ email: email.trim() });
}

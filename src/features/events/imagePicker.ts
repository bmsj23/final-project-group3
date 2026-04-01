import * as ImagePicker from 'expo-image-picker';

import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MAX_SIZE_LABEL,
  inferEventImageMimeType,
  isAllowedEventImageMimeType,
} from './contracts';
import type { EventImageAsset } from './types';

const FILE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function buildFallbackFileName(mimeType: string) {
  const extension = FILE_EXTENSION_BY_MIME_TYPE[mimeType] ?? 'jpg';
  return `cover-${Date.now()}.${extension}`;
}

export async function pickEventImageAsset() {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    return {
      data: null,
      error: new Error('Photo library permission is required to choose a cover image.'),
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [16, 9],
    mediaTypes: 'images',
    quality: 0.8,
    selectionLimit: 1,
  });

  if (result.canceled) {
    return {
      data: null,
      error: null,
    };
  }

  const asset = result.assets[0];

  if (!asset) {
    return {
      data: null,
      error: new Error('No image was returned by the picker.'),
    };
  }

  const mimeType =
    asset.mimeType ?? inferEventImageMimeType(asset.fileName) ?? inferEventImageMimeType(asset.uri);

  if (!mimeType || !isAllowedEventImageMimeType(mimeType)) {
    return {
      data: null,
      error: new Error('Only JPG, PNG, WEBP, or HEIC images can be used as cover images.'),
    };
  }

  if (asset.fileSize && asset.fileSize > EVENT_IMAGE_MAX_BYTES) {
    return {
      data: null,
      error: new Error(`Cover images must be ${EVENT_IMAGE_MAX_SIZE_LABEL} or smaller.`),
    };
  }

  return {
    data: {
      fileName: asset.fileName ?? buildFallbackFileName(mimeType),
      fileSize: asset.fileSize ?? null,
      mimeType,
      uri: asset.uri,
    } satisfies EventImageAsset,
    error: null,
  };
}

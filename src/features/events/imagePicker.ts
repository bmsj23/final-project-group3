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
      error: new Error('Photo library permission is required to choose cover images.'),
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    allowsMultipleSelection: true,
    mediaTypes: 'images',
    quality: 0.8,
    selectionLimit: 0,
  });

  if (result.canceled) {
    return {
      data: null,
      error: null,
    };
  }

  const assets = result.assets;

  if (!assets || assets.length === 0) {
    return {
      data: null,
      error: new Error('No images were returned by the picker.'),
    };
  }

  const processedAssets: EventImageAsset[] = [];
  const errors: string[] = [];

  for (const asset of assets) {
    const mimeType =
      asset.mimeType ?? inferEventImageMimeType(asset.fileName) ?? inferEventImageMimeType(asset.uri);

    if (!mimeType || !isAllowedEventImageMimeType(mimeType)) {
      errors.push(`${asset.fileName || 'One image'}: Only JPG, PNG, WEBP, or HEIC are allowed.`);
      continue;
    }

    if (asset.fileSize && asset.fileSize > EVENT_IMAGE_MAX_BYTES) {
      errors.push(`${asset.fileName || 'One image'}: Must be ${EVENT_IMAGE_MAX_SIZE_LABEL} or smaller.`);
      continue;
    }

    processedAssets.push({
      fileName: asset.fileName ?? buildFallbackFileName(mimeType),
      fileSize: asset.fileSize ?? null,
      mimeType,
      uri: asset.uri,
    } satisfies EventImageAsset);
  }

  if (processedAssets.length === 0) {
    return {
      data: null,
      error: new Error(errors.join(' ') || 'No valid images were selected.'),
    };
  }

  return {
    data: processedAssets,
    error: errors.length > 0 ? new Error(`Loaded ${processedAssets.length} image(s). Issues: ${errors.join(' ')}`) : null,
  };
}

import type { EventImageAsset } from '../../events/types';

export type EditProfileFormState = {
  fullName: string;
  bio: string;
};

export function getAvatarInitial(fullName: string, fallbackName?: string | null) {
  return (fullName.trim().slice(0, 1) || fallbackName?.slice(0, 1) || 'U').toUpperCase();
}

export function hasProfileChanges(
  form: EditProfileFormState,
  baseline: EditProfileFormState,
  selectedImage: EventImageAsset | null,
  shouldRemoveAvatar: boolean,
) {
  return (
    form.fullName.trim() !== baseline.fullName.trim() ||
    form.bio.trim() !== baseline.bio.trim() ||
    Boolean(selectedImage) ||
    shouldRemoveAvatar
  );
}

export function formatMemberSince(value: string | undefined) {
  if (!value) {
    return 'Recently';
  }

  return new Date(value).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

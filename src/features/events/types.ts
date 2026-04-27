export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  dateTime: string;
  registrationDeadline: string;
  capacity: number;
  category: string;
  tags: string[];
  coverImageUrl?: string | null;
};

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

export type EventSummary = {
  id: string;
  organizerId: string;
  title: string;
  location: string;
  startsAt: string;
  capacity: number;
  remainingSlots: number;
  status: EventStatus;
  categoryId: string;
  coverImageUrl: string | null;
};

export type EventDetail = EventSummary & {
  description: string;
  registrationDeadline: string;
  tags: string[];
  categoryName: string | null;
  organizerName: string | null;
  organizerAvatarUrl: string | null;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventCategorySummary = {
  id: string;
  name: string;
  iconName: string;
  displayOrder: number;
};

export type EventImageAsset = {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
};

export type EventImageUploadResult = {
  path: string;
  publicUrl: string;
};

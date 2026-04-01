import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTextField } from '../../../components/ui/IconTextField';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { EVENT_IMAGE_MAX_SIZE_LABEL } from '../contracts';
import { formatDateTimeInput, parseDateTimeInput, tagsFromInput, tagsToInput } from '../formatters';
import { pickEventImageAsset } from '../imagePicker';
import type {
  EventCategorySummary,
  EventFormErrors,
  EventFormValues,
  EventImageAsset,
} from '../types';
import { validateEventForm } from '../validation';
import { CategoryPill } from './CategoryPill';

export type EventFormSubmission = {
  values: EventFormValues;
  selectedImage: EventImageAsset | null;
  originalCoverImageUrl: string | null;
  coverImageChanged: boolean;
};

type EventFormProps = {
  resetKey: string;
  initialValues: EventFormValues;
  categories: EventCategorySummary[];
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (submission: EventFormSubmission) => Promise<void>;
};

function buildCapacityInput(value: number) {
  return value > 0 ? String(value) : '';
}

export function EventForm({
  resetKey,
  initialValues,
  categories,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues);
  const [capacityInput, setCapacityInput] = useState(buildCapacityInput(initialValues.capacity));
  const [dateTimeInput, setDateTimeInput] = useState(formatDateTimeInput(initialValues.dateTime));
  const [registrationDeadlineInput, setRegistrationDeadlineInput] = useState(
    formatDateTimeInput(initialValues.registrationDeadline),
  );
  const [tagsInput, setTagsInput] = useState(tagsToInput(initialValues.tags));
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [selectedImage, setSelectedImage] = useState<EventImageAsset | null>(null);
  const [removeExistingCoverImage, setRemoveExistingCoverImage] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setCapacityInput(buildCapacityInput(initialValues.capacity));
    setDateTimeInput(formatDateTimeInput(initialValues.dateTime));
    setRegistrationDeadlineInput(formatDateTimeInput(initialValues.registrationDeadline));
    setTagsInput(tagsToInput(initialValues.tags));
    setErrors({});
    setSelectedImage(null);
    setRemoveExistingCoverImage(false);
  }, [resetKey, initialValues]);

  const previewUri = selectedImage?.uri ?? (removeExistingCoverImage ? null : initialValues.coverImageUrl ?? null);

  function clearFieldError(field: keyof EventFormValues) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function updateValue<Key extends keyof EventFormValues>(key: Key, value: EventFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    clearFieldError(key);
  }

  async function handlePickImage() {
    clearFieldError('coverImageUrl');
    const { data, error } = await pickEventImageAsset();

    if (error) {
      setErrors((current) => ({
        ...current,
        coverImageUrl: error.message,
      }));
      return;
    }

    if (!data) {
      return;
    }

    setSelectedImage(data);
    setRemoveExistingCoverImage(false);
  }

  function handleRemoveImage() {
    if (selectedImage) {
      setSelectedImage(null);
      clearFieldError('coverImageUrl');
      return;
    }

    if (!initialValues.coverImageUrl) {
      return;
    }

    setRemoveExistingCoverImage((current) => !current);
    clearFieldError('coverImageUrl');
  }

  async function handleSubmit() {
    const parsedCapacity = Number.parseInt(capacityInput.trim(), 10);
    const nextValues: EventFormValues = {
      ...values,
      capacity: Number.isFinite(parsedCapacity) ? parsedCapacity : 0,
      coverImageUrl: removeExistingCoverImage ? null : initialValues.coverImageUrl ?? null,
      dateTime: parseDateTimeInput(dateTimeInput),
      registrationDeadline: parseDateTimeInput(registrationDeadlineInput),
      tags: tagsFromInput(tagsInput),
    };

    const validationErrors = validateEventForm(nextValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit({
      values: nextValues,
      selectedImage,
      originalCoverImageUrl: initialValues.coverImageUrl ?? null,
      coverImageChanged: Boolean(selectedImage) || removeExistingCoverImage,
    });
  }

  return (
    <View style={styles.form}>
      <View style={styles.coverSection}>
        <Pressable accessibilityRole="button" onPress={() => void handlePickImage()} style={styles.coverDropzone}>
          {previewUri ? (
            <Image contentFit="cover" source={{ uri: previewUri }} style={styles.coverImage} transition={150} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons color={colors.primary} name="add" size={22} />
              <Text style={styles.coverPlaceholderTitle}>Add Cover Photos</Text>
              <Text style={styles.coverPlaceholderBody}>Images up to {EVENT_IMAGE_MAX_SIZE_LABEL}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.thumbnailRow}>
          {[0, 1, 2, 3].map((slot) => (
            <View key={slot} style={styles.thumbnailSlot}>
              <Ionicons color={colors.primary} name="add" size={18} />
            </View>
          ))}
        </View>

        {previewUri || initialValues.coverImageUrl ? (
          <PrimaryButton
            disabled={isSubmitting}
            label={
              selectedImage
                ? 'Undo Image Change'
                : removeExistingCoverImage
                  ? 'Restore Image'
                  : 'Remove / Replace Image'
            }
            onPress={selectedImage || initialValues.coverImageUrl ? handleRemoveImage : () => void handlePickImage()}
            variant="secondary"
          />
        ) : null}
        {errors.coverImageUrl ? <Text style={styles.errorText}>{errors.coverImageUrl}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>

        <IconTextField
          error={errors.title}
          label="Event Name*"
          onChangeText={(value) => updateValue('title', value)}
          placeholder="Type your event name"
          value={values.title}
        />

        <IconTextField
          editable={false}
          hint="Choose one category below."
          label="Event Type*"
          placeholder=""
          value={values.category ? categories.find((category) => category.id === values.category)?.name ?? '' : ''}
        />
        <View style={styles.categoryRow}>
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              onPress={() => updateValue('category', category.id)}
              selected={values.category === category.id}
            />
          ))}
        </View>
        {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

        <IconTextField
          error={errors.dateTime}
          hint="Use YYYY-MM-DD HH:MM in your local time."
          label="Select Date and Time*"
          leadingIcon="calendar-outline"
          onChangeText={(value) => {
            setDateTimeInput(value);
            clearFieldError('dateTime');
          }}
          placeholder="Choose event date"
          value={dateTimeInput}
        />

        <IconTextField
          error={errors.registrationDeadline}
          hint="Must be earlier than the event date."
          label="Registration Deadline*"
          leadingIcon="time-outline"
          onChangeText={(value) => {
            setRegistrationDeadlineInput(value);
            clearFieldError('registrationDeadline');
          }}
          placeholder="Choose deadline"
          value={registrationDeadlineInput}
        />

        <IconTextField
          error={errors.location}
          label="Location*"
          leadingIcon="location-outline"
          onChangeText={(value) => updateValue('location', value)}
          placeholder="Type your venue"
          value={values.location}
        />

        <IconTextField
          error={errors.capacity}
          keyboardType="number-pad"
          label="Capacity*"
          leadingIcon="people-outline"
          onChangeText={(value) => {
            setCapacityInput(value);
            clearFieldError('capacity');
          }}
          placeholder="How many attendees?"
          value={capacityInput}
        />

        <IconTextField
          hint="Separate tags with commas."
          label="Tags"
          onChangeText={setTagsInput}
          placeholder="music, students, workshop"
          value={tagsInput}
        />

        <IconTextField
          error={errors.description}
          label="Event Description*"
          multiline
          onChangeText={(value) => updateValue('description', value)}
          placeholder="Type your event description..."
          style={styles.textAreaInput}
          textAlignVertical="top"
          value={values.description}
        />
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardTitle}>We could not save this event</Text>
          <Text style={styles.errorCardBody}>{errorMessage}</Text>
        </View>
      ) : null}

      <PrimaryButton disabled={isSubmitting} label={submitLabel} onPress={() => void handleSubmit()} variant="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xl,
  },
  coverSection: {
    gap: spacing.md,
  },
  coverDropzone: {
    backgroundColor: colors.bgCard,
    borderColor: '#BFDBFE',
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    minHeight: 212,
    overflow: 'hidden',
  },
  coverImage: {
    height: 212,
    width: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    height: 212,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  coverPlaceholderTitle: {
    ...typography.button1,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  coverPlaceholderBody: {
    ...typography.caption2,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbnailSlot: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flex: 1,
    height: 54,
    justifyContent: 'center',
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    gap: spacing.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.sm,
    rowGap: spacing.sm,
  },
  textAreaInput: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  errorText: {
    ...typography.caption2,
    color: colors.error,
  },
  errorCard: {
    backgroundColor: colors.bgCard,
    borderColor: colors.error,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  errorCardTitle: {
    ...typography.button1,
    color: colors.error,
  },
  errorCardBody: {
    ...typography.body2,
    color: colors.textMuted,
  },
});

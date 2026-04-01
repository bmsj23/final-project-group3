import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AccessNotice } from '../../../components/ui/AccessNotice';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import {
  deleteEventImage,
  deleteEventImageFromPublicUrl,
  fetchCategories,
  fetchEventById,
  updateOwnEvent,
  uploadEventImage,
} from '../api';
import { EventForm, type EventFormSubmission } from '../components/EventForm';
import { mapEventDetailToFormValues } from '../form';
import type { EventCategorySummary, EventDetail } from '../types';

type EditEventScreenProps = NativeStackScreenProps<AppStackParamList, 'EditEvent'>;

export function EditEventScreen({ navigation, route }: EditEventScreenProps) {
  const { isAuthenticated, isGuest, profile, signOut } = useAppSession();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [categories, setCategories] = useState<EventCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenErrorMessage, setScreenErrorMessage] = useState<string | null>(null);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);

  const loadEditorData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [{ data: nextEvent, error: eventError }, { data: nextCategories, error: categoriesError }] =
        await Promise.all([fetchEventById(route.params.eventId), fetchCategories()]);

      if (eventError) {
        throw eventError;
      }

      if (categoriesError) {
        throw categoriesError;
      }

      if (!nextEvent) {
        throw new Error('Event not found. It may have been deleted or you may not have access to it.');
      }

      setEvent(nextEvent);
      setCategories(nextCategories);
      setScreenErrorMessage(null);
    } catch (error) {
      setScreenErrorMessage(error instanceof Error ? error.message : 'Unable to load this event for editing.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.eventId]);

  useEffect(() => {
    void loadEditorData();
  }, [loadEditorData]);

  const handleSubmit = useCallback(
    async ({ coverImageChanged, originalCoverImageUrl, selectedImage, values }: EventFormSubmission) => {
      if (!profile || !event) {
        setSubmissionErrorMessage('This event is no longer available for editing.');
        return;
      }

      if (profile.id !== event.organizerId) {
        setSubmissionErrorMessage('Only the event owner can update this event.');
        return;
      }

      setIsSubmitting(true);
      setSubmissionErrorMessage(null);

      let uploadedImagePath: string | null = null;
      let nextCoverImageUrl = values.coverImageUrl ?? null;

      try {
        if (selectedImage) {
          const { data, error } = await uploadEventImage(profile.id, selectedImage);

          if (error || !data) {
            throw error ?? new Error('Cover image upload failed.');
          }

          uploadedImagePath = data.path;
          nextCoverImageUrl = data.publicUrl;
        }

        const { error } = await updateOwnEvent(event.id, {
          ...values,
          coverImageUrl: nextCoverImageUrl,
        });

        if (error) {
          if (uploadedImagePath) {
            await deleteEventImage(uploadedImagePath);
          }

          throw error;
        }

        if (coverImageChanged && originalCoverImageUrl && originalCoverImageUrl !== nextCoverImageUrl) {
          await deleteEventImageFromPublicUrl(originalCoverImageUrl);
        }

        navigation.replace('EventDetail', { eventId: event.id });
      } catch (error) {
        setSubmissionErrorMessage(error instanceof Error ? error.message : 'Unable to update the event right now.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [event, navigation, profile],
  );

  if (!isAuthenticated || isGuest) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <Text style={styles.description}>Editing an event requires the organizer account that created it.</Text>
        <AccessNotice
          body="Sign in with the organizer account before editing or deleting event records."
          title="Edit Event is unavailable in guest mode"
        />
        <View style={styles.actions}>
          <PrimaryButton label="Return to Sign In" onPress={() => void signOut()} />
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <Text style={styles.description}>Your account still needs a little setup before you can edit events.</Text>
        <AccessNotice
          body="Please sign out, sign back in, and try again."
          title="Account setup required"
        />
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading this event...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (screenErrorMessage) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Unable to load this event</Text>
          <Text style={styles.stateText}>{screenErrorMessage}</Text>
          <PrimaryButton label="Try Again" onPress={() => void loadEditorData()} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  if (!event) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Event unavailable</Text>
          <Text style={styles.stateText}>This event could not be found.</Text>
          <PrimaryButton label="Back to Details" onPress={() => navigation.replace('EventDetail', { eventId: route.params.eventId })} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  if (profile.id !== event.organizerId) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Edit Event</Text>
        <Text style={styles.description}>Only the organizer who created this event can edit or delete it.</Text>
        <AccessNotice
          body="Open an event you own from My Events to edit its details."
          title="You do not own this event"
        />
        <View style={styles.actions}>
          <PrimaryButton label="Back to Event Details" onPress={() => navigation.replace('EventDetail', { eventId: event.id })} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer keyboardAvoiding scroll>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={colors.softDark} name="chevron-back" size={22} />
        </Pressable>
      </View>
      <Text style={styles.eyebrow}>Organizer Tools</Text>
      <Text style={styles.title}>Edit Event</Text>
      <Text style={styles.description}>Update the event details, schedule, and cover image in one place.</Text>

      <EventForm
        categories={categories}
        errorMessage={submissionErrorMessage}
        initialValues={mapEventDetailToFormValues(event)}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        resetKey={`${event.id}:${event.updatedAt}`}
        submitLabel={isSubmitting ? 'Saving Changes...' : 'Save Changes'}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginBottom: spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});

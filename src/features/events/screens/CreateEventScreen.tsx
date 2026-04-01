import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AccessNotice } from '../../../components/ui/AccessNotice';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { AppStackParamList } from '../../../navigation/types';
import { createEvent, deleteEventImage, fetchCategories, uploadEventImage } from '../api';
import { EventForm, type EventFormSubmission } from '../components/EventForm';
import { createEmptyEventFormValues } from '../form';
import type { EventCategorySummary } from '../types';

type CreateEventScreenProps = NativeStackScreenProps<AppStackParamList, 'CreateEvent'>;

const INITIAL_VALUES = createEmptyEventFormValues();

export function CreateEventScreen({ navigation }: CreateEventScreenProps) {
  const { isAuthenticated, isGuest, profile, signOut } = useAppSession();
  const [categories, setCategories] = useState<EventCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenErrorMessage, setScreenErrorMessage] = useState<string | null>(null);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await fetchCategories();

      if (error) {
        throw error;
      }

      setCategories(data);
      setScreenErrorMessage(null);
    } catch (error) {
      setScreenErrorMessage(error instanceof Error ? error.message : 'Unable to load categories right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSubmit = useCallback(
    async ({ selectedImage, values }: EventFormSubmission) => {
      if (!profile) {
        setSubmissionErrorMessage('Your account still needs a little setup before you can create events.');
        return;
      }

      setIsSubmitting(true);
      setSubmissionErrorMessage(null);

      let uploadedImagePath: string | null = null;
      let coverImageUrl = values.coverImageUrl ?? null;

      try {
        if (selectedImage) {
          const { data, error } = await uploadEventImage(profile.id, selectedImage);

          if (error || !data) {
            throw error ?? new Error('Cover image upload failed.');
          }

          uploadedImagePath = data.path;
          coverImageUrl = data.publicUrl;
        }

        const { data, error } = await createEvent(profile.id, {
          ...values,
          coverImageUrl,
        });

        if (error || !data) {
          if (uploadedImagePath) {
            await deleteEventImage(uploadedImagePath);
          }

          throw error ?? new Error('Unable to create the event right now.');
        }

        navigation.reset({
          index: 1,
          routes: [
            { name: 'Tabs', params: { screen: 'MyEvents' } },
            { name: 'EventDetail', params: { eventId: data.id } },
          ],
        });
      } catch (error) {
        setSubmissionErrorMessage(error instanceof Error ? error.message : 'Unable to create the event right now.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigation, profile],
  );

  if (!isAuthenticated || isGuest) {
    return (
      <ScreenContainer keyboardAvoiding scroll>
        <Text style={styles.eyebrow}>Organizer Tools</Text>
        <Text style={styles.title}>Create Event</Text>
        <Text style={styles.description}>Guests can browse public events, but creating an event requires a signed-in account.</Text>

        <AccessNotice
          body="Sign in before creating events, uploading cover images, or managing organizer-only actions."
          title="Create Event is unavailable in guest mode"
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
        <Text style={styles.title}>Create Event</Text>
        <Text style={styles.description}>Your account still needs a little setup before you can publish events.</Text>
        <AccessNotice
          body="Please sign out, sign back in, and try again."
          title="Account setup required"
        />
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
      <Text style={styles.title}>Create New Event</Text>
      <Text style={styles.description}>Add the event details, choose a cover image, and publish it for attendees.</Text>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Preparing event categories...</Text>
        </View>
      ) : screenErrorMessage ? (
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Unable to load categories</Text>
          <Text style={styles.stateText}>{screenErrorMessage}</Text>
          <PrimaryButton label="Try Again" onPress={() => void loadCategories()} variant="secondary" />
        </View>
      ) : (
        <EventForm
          categories={categories}
          errorMessage={submissionErrorMessage}
          initialValues={INITIAL_VALUES}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          resetKey="create-event"
          submitLabel={isSubmitting ? 'Creating Event...' : 'Create Event'}
        />
      )}
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

import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { EmptyStateCard } from '../../../components/ui/EmptyStateCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { deleteEventImageFromPublicUrl, deleteOwnEvent, fetchEventById } from '../api';
import { formatEventDateTime, formatEventStatus } from '../formatters';
import type { EventDetail } from '../types';

type EventDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

export function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const { profile } = useAppSession();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await fetchEventById(route.params.eventId);

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Event not found. It may have been removed or you may no longer have access to it.');
      }

      setEvent(data);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load the event details.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.eventId]);

  useFocusEffect(
    useCallback(() => {
      void loadEvent();
    }, [loadEvent]),
  );

  const isOwner = profile?.id === event?.organizerId;

  const detailRows = useMemo(
    () =>
      event
        ? [
            { icon: 'location-outline', label: event.location },
            { icon: 'calendar-outline', label: formatEventDateTime(event.startsAt) },
            { icon: 'time-outline', label: `Register until ${formatEventDateTime(event.registrationDeadline)}` },
          ]
        : [],
    [event],
  );

  const handleDelete = useCallback(async () => {
    if (!event || !profile || profile.id !== event.organizerId) {
      Alert.alert('Delete blocked', 'Only the event owner can delete this event.');
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await deleteOwnEvent(event.id);

      if (error) {
        throw error;
      }

      if (event.coverImageUrl) {
        await deleteEventImageFromPublicUrl(event.coverImageUrl);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'MyEvents' } }],
      });
    } catch (error) {
      Alert.alert('Unable to delete event', error instanceof Error ? error.message : 'Please try again.');
      setIsDeleting(false);
    }
  }, [event, navigation, profile]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete event?',
      'This will remove the event record and its public organizer view.',
      [
        { style: 'cancel', text: 'Cancel' },
        { style: 'destructive', text: 'Delete', onPress: () => void handleDelete() },
      ],
    );
  }, [handleDelete]);

  const toggleSaved = useCallback(() => {
    setIsSaved((current) => !current);
  }, []);

  return (
    <ScreenContainer noPadding>
      <StatusBar style="light" />
      {isLoading ? (
        <View style={styles.stateWrap}>
          <EmptyStateCard body="Loading the event details." icon="hourglass-outline" title="Loading event" />
        </View>
      ) : errorMessage || !event ? (
        <View style={styles.stateWrap}>
          <EmptyStateCard body={errorMessage ?? 'This event is unavailable.'} icon="cloud-offline-outline" title="Unable to load event" />
        </View>
      ) : (
        <View style={styles.screen}>
          <View style={styles.heroWrap}>
            <Image
              contentFit="cover"
              source={event.coverImageUrl ? { uri: event.coverImageUrl } : undefined}
              style={styles.heroImage}
              transition={200}
            />
            <View style={styles.overlayControls}>
              <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.circleButton}>
                <Ionicons color={colors.textLight} name="chevron-back" size={22} />
              </Pressable>
              <Pressable
                accessibilityLabel={isSaved ? 'Remove event from favorites' : 'Save event to favorites'}
                accessibilityRole="button"
                onPress={toggleSaved}
                style={styles.circleButton}
              >
                <Ionicons color={isSaved ? colors.error : colors.textLight} name={isSaved ? 'heart' : 'heart-outline'} size={18} />
              </Pressable>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.grabber} />

            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.status}>{formatEventStatus(event.status)}</Text>
              </View>
              <View style={styles.priceChip}>
                <Text style={styles.priceText}>FREE</Text>
              </View>
            </View>

            <View style={styles.metaList}>
              {detailRows.map((row) => (
                <View key={row.label} style={styles.metaRow}>
                  <Ionicons color={colors.primary} name={row.icon as keyof typeof Ionicons.glyphMap} size={16} />
                  <Text style={styles.metaText}>{row.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Ionicons color={colors.primaryDeep} name="person" size={20} />
              </View>
              <View style={styles.organizerCopy}>
                <Text style={styles.organizerName}>Event Organizer</Text>
                <Text style={styles.organizerRole}>{isOwner ? 'You created this event' : 'Hosted by an Eventure organizer'}</Text>
              </View>
            </View>

            {isOwner && !event.coverImageUrl ? (
              <View style={styles.ownerImageNotice}>
                <View style={styles.ownerImageNoticeCopy}>
                  <Text style={styles.ownerImageNoticeTitle}>Add a cover image</Text>
                  <Text style={styles.ownerImageNoticeBody}>
                    This event is already live, but it still needs a visual so it looks polished in the feed.
                  </Text>
                </View>
                <PrimaryButton
                  label="Add Cover Image"
                  onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
                  variant="secondary"
                />
              </View>
            ) : null}

            <View style={styles.descriptionBlock}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

            {event.tags.length > 0 ? (
              <View style={styles.tagRow}>
                {event.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={isSaved ? 'Remove event from saved list' : 'Save event'}
                accessibilityRole="button"
                onPress={toggleSaved}
                style={[styles.bookmarkButton, isSaved ? styles.bookmarkButtonActive : null]}
              >
                <Ionicons color={isSaved ? colors.primary : colors.softDark} name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} />
              </Pressable>
              {isOwner ? (
                <View style={styles.ownerActionStack}>
                  <PrimaryButton
                    label={event.coverImageUrl ? 'Edit Event' : 'Edit Event & Image'}
                    onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
                    variant="dark"
                  />
                  <PrimaryButton disabled={isDeleting} label={isDeleting ? 'Deleting...' : 'Delete Event'} onPress={confirmDelete} variant="danger" />
                </View>
              ) : (
                <PrimaryButton label="BOOKING SOON" onPress={() => {}} variant="dark" />
              )}
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
  },
  screen: {
    flex: 1,
  },
  heroWrap: {
    height: 320,
  },
  heroImage: {
    backgroundColor: '#CBD5E1',
    height: '100%',
    width: '100%',
  },
  overlayControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xxl,
    position: 'absolute',
    right: 0,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.lg,
    marginTop: -36,
    minHeight: 420,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    height: 5,
    width: 44,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  status: {
    ...typography.body2,
    color: colors.textMuted,
  },
  priceChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  priceText: {
    ...typography.caption3,
    color: colors.primaryDeep,
  },
  metaList: {
    gap: spacing.sm,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaText: {
    ...typography.body2,
    color: colors.softDark,
    flex: 1,
  },
  organizerCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  organizerAvatar: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  organizerCopy: {
    flex: 1,
    gap: 2,
  },
  organizerName: {
    ...typography.button1,
    color: colors.text,
  },
  organizerRole: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  ownerImageNotice: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DBEAFE',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  ownerImageNoticeCopy: {
    gap: spacing.xs,
  },
  ownerImageNoticeTitle: {
    ...typography.button1,
    color: colors.text,
  },
  ownerImageNoticeBody: {
    ...typography.body2,
    color: colors.textMuted,
  },
  descriptionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
  },
  description: {
    ...typography.body2,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagPill: {
    backgroundColor: colors.bgInfo,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.caption3,
    color: colors.primaryDeep,
  },
  actionRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bookmarkButton: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  bookmarkButtonActive: {
    backgroundColor: colors.bgInfo,
    borderColor: '#93C5FD',
  },
  ownerActionStack: {
    flex: 1,
    gap: spacing.sm,
  },
});

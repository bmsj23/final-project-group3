import { useFocusEffect } from '@react-navigation/native';
import type { AppTabScreenProps } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccessNotice } from '../../../components/ui/AccessNotice';
import { DarkHero } from '../../../components/ui/DarkHero';
import { EmptyStateCard } from '../../../components/ui/EmptyStateCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { fetchMyCreatedEvents } from '../../events/api';
import { EventListCard } from '../../events/components/EventListCard';
import type { EventSummary } from '../../events/types';

type MyEventsScreenProps = AppTabScreenProps<'MyEvents'>;

export function MyEventsScreen({ navigation }: MyEventsScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const loadMyEvents = useCallback(
    async (isRefresh = false) => {
      if (!profile) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { data, error } = await fetchMyCreatedEvents(profile.id);

        if (error) throw error;

        setEvents(data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load your created events.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasFetched.current && !isGuest && profile) {
        hasFetched.current = true;
        void loadMyEvents();
      }
    }, [isGuest, loadMyEvents, profile]),
  );

  if (isGuest) {
    return (
      <ScreenContainer scroll contentContainerStyle={styles.simpleContent}>
        <Text style={styles.simpleTitle}>My Events</Text>
        <Text style={styles.simpleBody}>Sign in to create and manage your organizer events.</Text>
        <AccessNotice
          body="Guests can browse public screens, but organizer actions are only available to signed-in accounts."
          title="Organizer actions require sign-in"
        />
        <PrimaryButton label="Return to Sign In" onPress={() => void signOut()} variant="dark" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer bg={colors.bgDark} noPadding>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              onRefresh={() => void loadMyEvents(true)}
              refreshing={isRefreshing}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <DarkHero
            eyebrow="Organizer"
            title="Manage your events"
            subtitle="Create, review, and update the events you publish."
            rightSlot={<Ionicons color="#93C5FD" name="calendar" size={24} />}
            bottomSlot={
              <PrimaryButton
                label="Create New Event"
                onPress={() => navigation.navigate('CreateEvent')}
                variant="primary"
              />
            }
          />

          <View style={styles.body}>
            <SectionHeader title="Published Events" />

            {!profile ? (
              <EmptyStateCard
                body="Your account still needs a little setup before your organizer events can appear here."
                icon="person-circle-outline"
                title="Account setup required"
              />
            ) : errorMessage ? (
              <EmptyStateCard
                body={errorMessage}
                icon="cloud-offline-outline"
                title="Unable to load your events"
              />
            ) : isLoading ? (
              <EmptyStateCard
                body="Loading the events you created."
                icon="hourglass-outline"
                title="Loading your events"
              />
            ) : events.length === 0 ? (
              <EmptyStateCard
                body="Create your first event to populate this organizer dashboard."
                icon="add-circle-outline"
                title="No created events yet"
              />
            ) : (
              <View style={styles.list}>
                {events.map((event) => (
                  <EventListCard
                    key={event.id}
                    event={event}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  body: {
    backgroundColor: colors.background,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  simpleContent: {
    gap: spacing.lg,
  },
  simpleTitle: {
    ...typography.h4,
    color: colors.text,
  },
  simpleBody: {
    ...typography.body1,
    color: colors.textMuted,
  },
});

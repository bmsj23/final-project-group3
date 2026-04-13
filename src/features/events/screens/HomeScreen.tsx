import { useFocusEffect } from '@react-navigation/native';
import type { AppTabScreenProps } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { DarkHero } from '../../../components/ui/DarkHero';
import { EmptyStateCard } from '../../../components/ui/EmptyStateCard';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { fetchCategories, fetchUpcomingEvents } from '../api';
import { CategoryPill } from '../components/CategoryPill';
import { EventListCard } from '../components/EventListCard';
import { filterEventsByQuery } from '../formatters';
import type { EventCategorySummary, EventSummary } from '../types';

type HomeScreenProps = AppTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { profile } = useAppSession();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<EventCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Prevent re-fetching every time the tab is focused.
  const hasFetched = useRef(false);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [{ data: nextEvents, error: eventsError }, { data: nextCategories, error: categoriesError }] =
        await Promise.all([fetchUpcomingEvents(), fetchCategories()]);

      if (eventsError) throw eventsError;
      if (categoriesError) throw categoriesError;

      setEvents(nextEvents);
      setCategories(nextCategories);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load the home feed.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetched.current) {
        hasFetched.current = true;
        void loadFeed();
      }
    }, [loadFeed]),
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const filteredEvents = useMemo(() => filterEventsByQuery(events, query, categoryNameById), [categoryNameById, events, query]);
  const featuredEvents = events.slice(0, 4);
  const listEvents = events.slice(0, 8);
  const topCategories = categories.slice(0, 5);
  const isSearching = query.trim().length > 0;

  return (
    <ScreenContainer bg={colors.bgDark} noPadding>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
        <View style={styles.screen}>
          <LinearGradient
            colors={[colors.gradient.blackLinear.start, colors.gradient.blackLinear.end]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.topShell}
          />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            refreshControl={
              <RefreshControl
                onRefresh={() => void loadFeed(true)}
                refreshing={isRefreshing}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <DarkHero
              avatarInitials={profile?.full_name?.slice(0, 1) ?? undefined}
              avatarUri={profile?.avatar_url ?? null}
              eyebrow={profile?.full_name ? 'Hi Welcome' : 'Explore Events'}
              title={profile?.full_name ?? 'Eventure'}
              rightSlot={
                <View style={styles.locationBlock}>
                  <Text style={styles.locationLabel}>Current location</Text>
                  <Text style={styles.locationValue}>Manila, PH</Text>
                </View>
              }
              bottomSlot={
                <View style={styles.searchBar}>
                  <Ionicons color="#94A3B8" name="search" size={18} />
                  <TextInput
                    autoCorrect={false}
                    onChangeText={setQuery}
                    placeholder="Search events, venues, categories…"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="search"
                    style={styles.searchInput}
                    value={query}
                  />
                  {query ? (
                    <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.searchActionButton}>
                      <Ionicons color={colors.textLight} name="close" size={16} />
                    </Pressable>
                  ) : null}
                </View>
              }
            />

            <View style={styles.body}>
              {errorMessage ? (
                <EmptyStateCard
                  body={errorMessage}
                  icon="cloud-offline-outline"
                  title="Unable to load events"
                />
              ) : isLoading ? (
                <EmptyStateCard
                  body="Loading the latest events for your feed."
                  icon="hourglass-outline"
                  title="Loading events"
                />
              ) : isSearching ? (
                <>
                  <SectionHeader title="Search Results" />
                  {filteredEvents.length === 0 ? (
                    <EmptyStateCard
                      body="Try another keyword or clear the search field to browse everything again."
                      icon="search-outline"
                      title="No matching events"
                    />
                  ) : (
                    <View style={styles.list}>
                      {filteredEvents.map((event) => (
                        <EventListCard
                          key={event.id}
                          categoryName={categoryNameById.get(event.categoryId)}
                          event={event}
                          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : featuredEvents.length === 0 ? (
                <EmptyStateCard
                  body="Create your first event or check back later."
                  icon="calendar-outline"
                  title="No upcoming events yet"
                />
              ) : (
                <>
                  <SectionHeader
                    actionLabel="VIEW ALL"
                    onPressAction={() => navigation.navigate('Explore')}
                    title="Popular Events"
                  />

                  <ScrollView
                    alwaysBounceHorizontal={false}
                    bounces={false}
                    horizontal
                    overScrollMode="never"
                    showsHorizontalScrollIndicator={false}
                    style={styles.fullBleedScroll}
                  >
                    <View style={styles.featuredRow}>
                      {featuredEvents.map((event) => (
                        <EventListCard
                          key={event.id}
                          categoryName={categoryNameById.get(event.categoryId)}
                          event={event}
                          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                          variant="featured"
                        />
                      ))}
                    </View>
                  </ScrollView>

                  <SectionHeader
                    actionLabel="VIEW ALL"
                    onPressAction={() => navigation.navigate('Explore')}
                    title="Choose By Category"
                  />

                  <ScrollView
                    alwaysBounceHorizontal={false}
                    bounces={false}
                    horizontal
                    overScrollMode="never"
                    showsHorizontalScrollIndicator={false}
                    style={styles.fullBleedScroll}
                  >
                    <View style={styles.categoryRow}>
                      {topCategories.map((category, index) => (
                        <CategoryPill
                          key={category.id}
                          icon={category.iconName}
                          label={category.name}
                          onPress={() => navigation.navigate('Explore')}
                          selected={index === 0}
                        />
                      ))}
                    </View>
                  </ScrollView>

                  <SectionHeader title="Upcoming Events" />

                  <View style={styles.list}>
                    {listEvents.map((event) => (
                      <EventListCard
                        key={event.id}
                        categoryName={categoryNameById.get(event.categoryId)}
                        event={event}
                        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  topShell: {
    height: layout.refreshShellHeight,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  locationBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  locationLabel: {
    ...typography.caption5,
    color: '#CBD5E1',
  },
  locationValue: {
    ...typography.caption3,
    color: '#93C5FD',
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    ...typography.body2,
    color: '#CBD5E1',
    flex: 1,
    marginLeft: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  searchActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  body: {
    backgroundColor: '#F8FAFC',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl,
  },
  // Escape the body's horizontal padding so cards scroll edge-to-edge.
  fullBleedScroll: {
    marginHorizontal: -layout.screenPaddingH,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingLeft: layout.screenPaddingH,
    paddingRight: layout.screenPaddingH,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingLeft: layout.screenPaddingH,
    paddingRight: layout.screenPaddingH,
  },
  list: {
    gap: spacing.md,
  },
});

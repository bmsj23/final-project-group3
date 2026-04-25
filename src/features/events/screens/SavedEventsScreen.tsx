import { useFocusEffect } from '@react-navigation/native';
import type { AppTabScreenProps } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSession } from '../../../providers/AppSessionProvider';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { fetchEventsByIds, fetchMyFavoritedEvents } from '../api';
import { formatEventDateTime, formatEventStatus } from '../formatters';
import type { EventSummary } from '../types';
import { useEventFavorites } from '../FavoritesProvider';

type SavedEventsScreenProps = AppTabScreenProps<'Saved'>;

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  upcoming: { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  ongoing: { text: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  completed: { text: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  cancelled: { text: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

function SavedEventCard({
  event,
  onPress,
  onToggleFavorite,
}: {
  event: EventSummary;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const statusStyle = STATUS_COLORS[event.status] ?? STATUS_COLORS.upcoming;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cardImageWrap}>
        {event.coverImageUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: event.coverImageUrl }}
            style={styles.cardImage}
            transition={150}
          />
        ) : (
          <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.cardImageFallback}>
            <Ionicons color="rgba(255,255,255,0.35)" name="heart" size={30} />
          </LinearGradient>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {formatEventStatus(event.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {event.title}
          </Text>
          <Pressable
            accessibilityLabel="Remove from saved"
            onPress={(pressEvent) => {
              pressEvent.stopPropagation();
              onToggleFavorite();
            }}
            style={({ pressed }) => [styles.favoriteBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons color="#EF4444" name="heart" size={18} />
          </Pressable>
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons color="#94A3B8" name="calendar-outline" size={13} />
          <Text style={styles.cardMetaText}>{formatEventDateTime(event.startsAt)}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons color="#94A3B8" name="location-outline" size={13} />
          <Text numberOfLines={1} style={styles.cardMetaText}>{event.location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function SavedEventsScreen({ navigation }: SavedEventsScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const { favoriteIds, refreshFavorites, toggleFavorite } = useEventFavorites();
  const [cachedEvents, setCachedEvents] = useState<Record<string, EventSummary>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const mergeCachedEvents = useCallback((events: EventSummary[]) => {
    setCachedEvents((previous) => {
      const next = { ...previous };
      for (const event of events) {
        next[event.id] = event;
      }
      return next;
    });
  }, []);

  const savedEvents = useMemo(
    () => favoriteIds.map((id) => cachedEvents[id]).filter((event): event is EventSummary => Boolean(event)),
    [cachedEvents, favoriteIds],
  );

  const loadSavedEvents = useCallback(async (forceRefresh = false) => {
    if (isGuest || !profile?.id) {
      setCachedEvents({});
      setErrorMessage(null);
      setIsLoading(false);
      setIsRefreshing(false);
      hasFetchedRef.current = false;
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      await refreshFavorites();
      const { data, error } = await fetchMyFavoritedEvents(profile.id);
      if (error) {
        throw error;
      }
      mergeCachedEvents(data);
      hasFetchedRef.current = true;
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load saved events.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuest, mergeCachedEvents, profile?.id, refreshFavorites]);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedRef.current) {
        void loadSavedEvents();
      }
    }, [loadSavedEvents]),
  );

  useFocusEffect(
    useCallback(() => {
      if (isGuest || !profile?.id) {
        return;
      }

      const missingIds = favoriteIds.filter((id) => !cachedEvents[id]);
      if (missingIds.length === 0) {
        return;
      }

      let isActive = true;
      void (async () => {
        const { data, error } = await fetchEventsByIds(missingIds);
        if (!isActive || error) {
          return;
        }
        mergeCachedEvents(data);
      })();

      return () => {
        isActive = false;
      };
    }, [cachedEvents, favoriteIds, isGuest, mergeCachedEvents, profile?.id]),
  );

  const handleToggleFavorite = useCallback(async (eventId: string) => {
    try {
      await toggleFavorite(eventId);
      setErrorMessage(null);
    } catch (error) {
      Alert.alert('Unable to update favorites', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [toggleFavorite]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#060D1F', '#0F1E3D', '#0A1628']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orbBlue} pointerEvents="none" />
        <View style={styles.orbPurple} pointerEvents="none" />

        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Ionicons color="#FB7185" name="heart" size={40} />
          </View>
          <Text style={styles.guestTitle}>Saved Events</Text>
          <Text style={styles.guestSub}>
            Sign in to save events and access your favorites across devices.
          </Text>
          <Pressable
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['#FF3CAC', '#784BA0', '#2B86C5']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.guestBtnGrad}
            >
              <Text style={styles.guestBtnText}>Sign In</Text>
              <Ionicons color="#fff" name="arrow-forward" size={16} />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#070B2A', '#2B0A3C', '#230F47']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbBlue} pointerEvents="none" />
      <View style={styles.orbPurple} pointerEvents="none" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            onRefresh={() => void loadSavedEvents(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Personal Collection</Text>
              <Text style={styles.heroTitle}>Saved Events</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipCount}>{savedEvents.length}</Text>
              <Text style={styles.heroChipLabel}>saved</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodySheet}>
          <View style={styles.bodyHandle} />
          <View style={styles.bodyHeader}>
            <SectionHeader title="Favorites" />
          </View>

          {errorMessage ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Couldn't load saved events</Text>
              <Text style={styles.emptySub}>{errorMessage}</Text>
              <Pressable
                onPress={() => void loadSavedEvents(true)}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Loading saved events…</Text>
              <Text style={styles.emptySub}>Fetching your favorites.</Text>
            </View>
          ) : savedEvents.length === 0 ? (
            <View style={styles.emptyWrap}>
              <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.emptyIllustration}>
                <Ionicons color="rgba(255,255,255,0.7)" name="heart-outline" size={38} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No saved events yet</Text>
              <Text style={styles.emptySub}>
                Tap the heart icon on any event to save it here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {savedEvents.map((event) => (
                <SavedEventCard
                  event={event}
                  key={event.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  onToggleFavorite={() => void handleToggleFavorite(event.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F' },
  scroll: { flexGrow: 1 },

  orbBlue: {
    position: 'absolute', top: -90, right: -70,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#4F46E5', opacity: 0.16,
  },
  orbPurple: {
    position: 'absolute', top: 140, left: -90,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#EC4899', opacity: 0.12,
  },

  guestContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.md,
  },
  guestIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,113,133,0.14)',
    borderRadius: radius.full,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  guestTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#F1F5F9',
  },
  guestSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  guestBtn: { borderRadius: radius.full, overflow: 'hidden' },
  guestBtnGrad: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  guestBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },

  hero: {
    paddingTop: 56,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 32,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    fontFamily: 'Inter_500Medium', fontSize: 12,
    color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 32,
    color: '#F1F5F9', letterSpacing: -0.8,
  },
  heroChip: {
    backgroundColor: 'rgba(251,113,133,0.16)',
    borderWidth: 1, borderColor: 'rgba(251,113,133,0.4)',
    borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 9,
    alignItems: 'center',
  },
  heroChipCount: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FB7185' },
  heroChipLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 10, color: '#CBD5E1',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  bodySheet: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingTop: 16, paddingBottom: 100,
    minHeight: 500,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 18,
  },
  bodyHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20,
  },
  bodyHeader: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.md,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.3)',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardImageWrap: { position: 'relative', height: 130 },
  cardImage: { width: '100%', height: '100%' },
  cardImageFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardBody: { padding: spacing.md, gap: spacing.xxs },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#312E81',
    lineHeight: 24,
  },
  favoriteBtn: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  cardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  cardMetaText: {
    color: '#94A3B8',
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },

  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl,
  },
  emptyIllustration: {
    alignItems: 'center',
    borderRadius: 22,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySub: {
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minHeight: 40,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },

  buttonPressed: {
    opacity: 0.85,
  },
});

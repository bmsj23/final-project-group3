import { useFocusEffect } from '@react-navigation/native';
import type { AppTabScreenProps } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { layout } from '../../../theme/layout';
import { fetchMyCreatedEvents } from '../../events/api';
import { formatEventDateTime, formatEventStatus } from '../../events/formatters';
import type { EventSummary } from '../../events/types';

type MyEventsScreenProps = AppTabScreenProps<'MyEvents'>;

// Status badge color map
const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  upcoming:  { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  ongoing:   { text: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  completed: { text: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  cancelled: { text: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
};

function EventCard({
  event,
  index,
  onPress,
}: {
  event: EventSummary;
  index: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const statusStyle = STATUS_COLORS[event.status] ?? STATUS_COLORS.upcoming;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
        onPress={onPress}
      >
        {/* Cover image */}
        <View style={styles.cardImageWrap}>
          {event.coverImageUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: event.coverImageUrl }}
              style={styles.cardImage}
              transition={150}
            />
          ) : (
            <View style={styles.cardImageFallback}>
              <Ionicons name="calendar" size={32} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          {/* Status badge overlay */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {formatEventStatus(event.status)}
            </Text>
          </View>
        </View>

        {/* Card content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.cardMetaRow}>
              <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
              <Text style={styles.cardMetaText}>{formatEventDateTime(event.startsAt)}</Text>
            </View>
            <View style={styles.cardMetaRow}>
              <Ionicons name="location-outline" size={13} color="#94A3B8" />
              <Text style={styles.cardMetaText} numberOfLines={1}>{event.location}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.spotsRow}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={styles.spotsText}>{event.remainingSlots} / {event.capacity} slots</Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function MyEventsScreen({ navigation }: MyEventsScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Entrance animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const fabAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(fabAnim,  { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
    ]).start();
  }, []);

  const loadMyEvents = useCallback(
    async (isRefresh = false) => {
      if (!profile) return;
      if (isRefresh) setIsRefreshing(true);
      else           setIsLoading(true);
      try {
        const { data, error } = await fetchMyCreatedEvents(profile.id);
        if (error) throw error;
        setEvents(data);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to load your events.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isGuest && profile) {
        if (!hasFetched.current) {
          hasFetched.current = true;
          void loadMyEvents();
        } else {
          void loadMyEvents(true);
        }
      }
    }, [isGuest, loadMyEvents, profile]),
  );

  // ── GUEST STATE ────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="dark" />

        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="calendar" size={40} color="#60A5FA" />
          </View>
          <Text style={styles.guestTitle}>My Events</Text>
          <Text style={styles.guestSub}>
            Sign in to create and manage your campus events as an organizer.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.85 }]}
            onPress={() => void signOut()}
          >
            <View style={styles.guestBtnSurface}>
              <Text style={styles.guestBtnText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── AUTHENTICATED STATE ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              hasFetched.current = false;
              void loadMyEvents(true);
            }}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── HERO ── */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-20,0] }) }],
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Organizer Dashboard</Text>
              <Text style={styles.heroTitle}>My Events</Text>
            </View>
            {/* Stats chip */}
            <View style={styles.heroChip}>
              <Text style={styles.heroChipCount}>{events.length}</Text>
              <Text style={styles.heroChipLabel}>total</Text>
            </View>
          </View>

          {/* Mini stat row */}
          <View style={styles.heroStats}>
            {[
              { label: 'Upcoming', value: events.filter(e => e.status === 'upcoming').length,  color: '#60A5FA' },
              { label: 'Ongoing',  value: events.filter(e => e.status === 'ongoing').length,   color: '#34D399' },
              { label: 'Done',     value: events.filter(e => e.status === 'completed').length, color: '#94A3B8' },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.heroStatItem, i < arr.length - 1 && styles.heroStatBorder]}>
                <Text style={[styles.heroStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── WHITE BODY ── */}
        <View style={styles.body}>
          <View style={styles.bodyHandle} />

          {/* Section header */}
          <View style={styles.bodyHeader}>
            <Text style={styles.bodyTitle}>Published Events</Text>
            <Pressable
              style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <View style={styles.createBtnSurface}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createBtnText}>New</Text>
              </View>
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Loading your events…</Text>
              <Text style={styles.emptySub}>Hang tight while we fetch your published events.</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name="cloud-offline-outline" size={28} color="#EF4444" />
              </View>
              <Text style={styles.emptyTitle}>Couldn't load events</Text>
              <Text style={styles.emptySub}>{errorMessage}</Text>
              <Pressable
                style={styles.retryBtn}
                onPress={() => {
                  hasFetched.current = false;
                  void loadMyEvents();
                }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySub}>
                Tap the button below to create your first campus event and start getting attendees.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyCreateBtn, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <View style={styles.emptyCreateSurface}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.emptyCreateText}>Create Your First Event</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {events.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating Action Button ── */}
      {!isLoading && (
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ scale: fabAnim }],
              opacity: fabAnim,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create new event"
            style={({ pressed }) => [styles.fabBtn, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <View style={styles.fabSurface}>
              <Ionicons name="add" size={26} color="#fff" />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4FF' },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    marginTop: spacing.md,
    marginHorizontal: layout.screenPaddingH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  heroEyebrow: {
    fontFamily: 'Inter_500Medium', fontSize: 12,
    color: '#C7DAF8', letterSpacing: 0.5, marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 30,
    color: '#FFFFFF', letterSpacing: -0.6,
  },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 9,
    alignItems: 'center',
  },
  heroChipCount: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' },
  heroChipLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#D6E4FA', textTransform: 'uppercase', letterSpacing: 0.5 },

  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.xl, paddingVertical: 14,
  },
  heroStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  heroStatValue: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  heroStatLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#D6E4FA', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Body sheet
  body: {
    flex: 1,
    marginTop: spacing.lg,
    backgroundColor: '#F8FBFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 16, paddingBottom: 100,
    minHeight: 500,
    borderTopWidth: 1,
    borderTopColor: '#DDE7F6',
  },
  bodyHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 20,
  },
  bodyHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, marginBottom: 16,
  },
  bodyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#0F172A' },
  createBtn: {
    borderRadius: radius.full,
  },
  createBtnSurface: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 42, gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDark,
  },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },

  // Event card
  list: { paddingHorizontal: layout.screenPaddingH, gap: spacing.md },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: '#D7E3F4',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageWrap: { position: 'relative', height: 130 },
  cardImage: { width: '100%', height: '100%' },
  cardImageFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A63BC' },
  statusBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardBody: { padding: spacing.md, gap: 8 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#0F172A', lineHeight: 24 },
  cardMeta: { gap: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  spotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotsText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center',
  },

  // Empty states
  emptyWrap: { alignItems: 'center', paddingHorizontal: layout.screenPaddingH, paddingTop: 40, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#E8F1FF', alignItems: 'center', justifyContent: 'center',
  },
  emptyIllustration: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    backgroundColor: colors.primaryDark,
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#0F172A', textAlign: 'center' },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: '#EFF6FF', borderRadius: radius.full,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  emptyCreateBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: 8, width: '100%' },
  emptyCreateSurface: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 52, gap: spacing.xs,
    backgroundColor: colors.primaryDark,
  },
  emptyCreateText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' },

  // Guest
  guestContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH, gap: 16,
  },
  guestIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#E8F1FF',
    borderWidth: 1, borderColor: '#CDE0FB',
    alignItems: 'center', justifyContent: 'center',
  },
  guestTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, color: '#0F172A', letterSpacing: -0.5 },
  guestSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22 },
  guestBtn: { borderRadius: radius.md, overflow: 'hidden', width: '100%', marginTop: 8 },
  guestBtnSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: spacing.xs,
    backgroundColor: colors.primaryDark,
  },
  guestBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtn: { borderRadius: 32 },
  fabSurface: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
});

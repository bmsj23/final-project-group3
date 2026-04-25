import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '../../../providers/AppSessionProvider';
import type { AppStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { layout } from '../../../theme/layout';
import {
  deleteEventImageFromPublicUrl,
  deleteOwnEvent,
  fetchEventById,
} from '../api';
import { formatEventDateTime, formatEventStatus } from '../formatters';
import type { EventDetail } from '../types';

type EventDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  upcoming:  { text: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
  ongoing:   { text: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  completed: { text: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  cancelled: { text: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
};

export function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const { profile } = useAppSession();
  const [event, setEvent]         = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved]     = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sheetAnim = useRef(new Animated.Value(0)).current;

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchEventById(route.params.eventId);
      if (error) throw error;
      if (!data) throw new Error('Event not found or has been removed.');
      setEvent(data);
      setErrorMessage(null);
      Animated.spring(sheetAnim, {
        toValue: 1, useNativeDriver: true, tension: 65, friction: 10,
      }).start();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load event details.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.eventId]);

  useFocusEffect(useCallback(() => { void loadEvent(); }, [loadEvent]));

  const isOwner = profile?.id === event?.organizerId;
  const statusStyle = STATUS_COLORS[event?.status ?? 'upcoming'] ?? STATUS_COLORS.upcoming;

  const detailRows = useMemo(() =>
    event ? [
      { icon: 'location-outline'  as const, label: 'Location',    value: event.location                                  },
      { icon: 'calendar-outline'  as const, label: 'Date & Time', value: formatEventDateTime(event.startsAt)             },
      { icon: 'time-outline'      as const, label: 'Register By', value: formatEventDateTime(event.registrationDeadline) },
    ] : [], [event]);

  async function handleDelete() {
    if (!event || !profile || profile.id !== event.organizerId) {
      Alert.alert('Not allowed', 'Only the event owner can delete this event.');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await deleteOwnEvent(event.id);
      if (error) throw error;
      if (event.coverImageUrl) await deleteEventImageFromPublicUrl(event.coverImageUrl);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'MyEvents' } }] });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete event.');
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this event?',
      'This will permanently remove the event and its cover image. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void handleDelete() },
      ],
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="light" />
        <LinearGradient colors={['#060D1F', '#0F1E3D', '#1E3A8A']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons name="hourglass-outline" size={28} color="#93C5FD" />
          </View>
          <Text style={styles.stateTitle}>Loading event…</Text>
          <Text style={styles.stateSub}>Fetching the latest details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (errorMessage || !event) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="light" />
        <LinearGradient colors={['#060D1F', '#0F1E3D', '#1E3A8A']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
            <Ionicons name="cloud-offline-outline" size={28} color="#EF4444" />
          </View>
          <Text style={styles.stateTitle}>Event unavailable</Text>
          <Text style={styles.stateSub}>{errorMessage ?? 'This event could not be found.'}</Text>
          <Pressable style={styles.backBtnState} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnStateText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient colors={['#060D1F', '#0F1E3D', '#1E3A8A']} style={StyleSheet.absoluteFill} />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero ── */}
        <View style={styles.heroWrap}>
          {event.coverImageUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: event.coverImageUrl }}
              style={styles.heroImage}
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={['#060D1F', '#0F2167', '#1E3A8A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroImage}
            >
              <View style={styles.heroPlaceholderIcon}>
                <Ionicons name="calendar" size={52} color="rgba(255,255,255,0.2)" />
              </View>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.15)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.overlayTop}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
              onPress={() => setIsSaved(v => !v)}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={22}
                color={isSaved ? '#FF3CAC' : '#fff'}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Sheet ── */}
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetAnim,
              transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <View style={styles.grabber} />

          {/* Status + category + title */}
          <View style={styles.titleBlock}>
            <View style={styles.badgeRow}>
              {event.categoryName ? (
                <View style={styles.categoryPill}>
                  <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
                  <Text style={styles.categoryText}>{event.categoryName}</Text>
                </View>
              ) : null}
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {formatEventStatus(event.status)}
                </Text>
              </View>
              {event.isFlagged && (
                <View style={styles.flaggedBadge}>
                  <Ionicons name="flag" size={11} color="#EF4444" />
                  <Text style={styles.flaggedText}>Flagged</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={3}>{event.title}</Text>
          </View>

          {/* Actions */}
          <View style={styles.metaRow}>
            <View style={styles.actionRow}>
              {isOwner && (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
                  >
                    <Ionicons name="pencil" size={19} color="#6B7280" />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                    onPress={confirmDelete}
                  >
                    <Ionicons name="trash-outline" size={19} color="#EF4444" />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Detail rows */}
          <Text style={styles.sectionTitle}>Event Details</Text>
          <View style={styles.detailCard}>
            {detailRows.map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name={row.icon} size={17} color={colors.primary} />
                </View>
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Organizer */}
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>Event Organizer</Text>
              <Text style={styles.organizerRole}>
                {isOwner ? '✦ You created this event' : 'Hosted by an Eventure organizer'}
              </Text>
            </View>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            )}
          </View>

          {/* Missing cover image notice (owner only) */}
          {isOwner && !event.coverImageUrl && (
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="image-outline" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Add a cover image</Text>
                <Text style={styles.noticeSub}>Your event is live but missing a visual — add one to stand out in the feed.</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Tags */}
          {event.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {event.tags.map(tag => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      {!isOwner && (
        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.88 }]}
            onPress={() => Alert.alert('Booking', 'Booking feature coming soon! 🎟️')}
          >
            <Ionicons name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>Register Now</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F' },
  scroll: { flexGrow: 1 },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH, gap: 12,
  },
  stateIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(96,165,250,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  stateTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#F1F5F9' },
  stateSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#475569', textAlign: 'center' },
  backBtnState: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.full,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  backBtnStateText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#CBD5E1' },

  heroWrap: { height: 340, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholderIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  overlayTop: {
    position: 'absolute', top: 52, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
  },
  overlayBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  overlayBtnPressed: { opacity: 0.7 },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 20,
  },
  grabber: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 2,
  },

  titleBlock: { gap: 10 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  flaggedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  flaggedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#EF4444' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, color: '#0F172A', lineHeight: 34, letterSpacing: -0.4 },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end',
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(30,58,138,0.07)',
    borderWidth: 1, borderColor: 'rgba(30,58,138,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  divider: { height: 1, backgroundColor: '#F1F5F9' },

  detailCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  detailIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(30,58,138,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailText: { flex: 1, gap: 3 },
  detailLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.7 },
  detailValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#111827' },

  organizerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16,
  },
  organizerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(30,58,138,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  organizerInfo: { flex: 1, gap: 3 },
  organizerName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#111827' },
  organizerRole: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6B7280' },
  ownerBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#A7F3D0',
  },
  ownerBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#059669' },

  noticeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A',
    padding: 16,
  },
  noticeIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#92400E' },
  noticeSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#B45309', lineHeight: 20, marginTop: 3 },

  descSection: { gap: 10 },
  tagsSection: { gap: 10 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#111827' },
  description: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#374151', lineHeight: 25 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    backgroundColor: '#F3F4F6', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 7,
  },
  tagText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#4B5563' },

  stickyFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bookBtn: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 56, gap: 10,
  },
  bookBtnText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff' },
});

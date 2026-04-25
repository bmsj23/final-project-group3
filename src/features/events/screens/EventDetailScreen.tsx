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
import { isAdminRole } from '../../auth/contracts';
import { useEventFavorites } from '../FavoritesProvider';
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
  updateEventStatus,
} from '../api';
import { formatEventDateTime, formatEventStatus } from '../formatters';
import type { EventDetail } from '../types';

type EventDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  upcoming:  { text: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
  ongoing:   { text: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  completed: { text: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  cancelled: { text: '#EF4444', bg: 'rgba(239,68,68,0.15)'   },
};

export function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const { profile } = useAppSession();
  const { isFavorited, toggleFavorite } = useEventFavorites();
  const [event, setEvent]         = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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
      // Animate sheet in
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

  const isAdmin = isAdminRole(profile?.role);
  const isOwner = profile?.id === event?.organizerId;
  const canModerate = isOwner || isAdmin;
  const isSaved = event ? isFavorited(event.id) : false;
  const statusStyle = STATUS_COLORS[event?.status ?? 'upcoming'] ?? STATUS_COLORS.upcoming;

  const detailRows = useMemo(() =>
    event ? [
      { icon: 'location-outline'  as const, label: 'Location',      value: event.location                                  },
      { icon: 'calendar-outline'  as const, label: 'Date & Time',   value: formatEventDateTime(event.startsAt)            },
      { icon: 'time-outline'      as const, label: 'Register By',   value: formatEventDateTime(event.registrationDeadline) },
    ] : [], [event]);

  const handleToggleSaved = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      await toggleFavorite(event.id);
    } catch (error) {
      Alert.alert('Unable to save event', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [event, toggleFavorite]);

  async function handleDelete() {
    if (!event || !profile || (!isOwner && !isAdmin)) {
      Alert.alert('Not allowed', 'Only the event owner or an admin can delete this event.');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await deleteOwnEvent(event.id);
      if (error) throw error;
      if (event.coverImageUrl) await deleteEventImageFromPublicUrl(event.coverImageUrl);
      if (isOwner) {
        navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'MyEvents' } }] });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete event.');
      setIsDeleting(false);
    }
  }

  async function handleCancelEvent() {
    if (!event || !profile || !canModerate) {
      Alert.alert('Not allowed', 'Only the event owner or an admin can cancel this event.');
      return;
    }

    if (event.status === 'cancelled') {
      Alert.alert('Already cancelled', 'This event is already cancelled.');
      return;
    }

    setIsCancelling(true);
    try {
      const { error } = await updateEventStatus(event.id, 'cancelled');
      if (error) throw error;
      setEvent((current) => current ? { ...current, status: 'cancelled' } : current);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not cancel event.');
    } finally {
      setIsCancelling(false);
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

  function confirmCancel() {
    Alert.alert(
      'Cancel this event?',
      'The event status will be set to cancelled for all attendees.',
      [
        { text: 'Keep event', style: 'cancel' },
        { text: 'Cancel event', style: 'destructive', onPress: () => void handleCancelEvent() },
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
      <LinearGradient
        colors={['#060D1F', '#0F1E3D', '#1E3A8A']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero image ── */}
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


          {/* Overlay controls */}
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
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save event'}
              style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
              onPress={() => void handleToggleSaved()}
            >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                size={22}
                color={isSaved ? '#FF3CAC' : '#fff'}
              />
            </Pressable>
          </View>

        </View>

        {/* ── Bottom sheet ── */}
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetAnim,
              transform: [{ translateY: sheetAnim.interpolate({ inputRange:[0,1], outputRange:[50,0] }) }],
            },
          ]}
        >
          <View style={styles.grabber} />

          {/* Title + badges */}
          <View style={styles.sheetTitleBlock}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.heroBadgeDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.heroBadgeText, { color: statusStyle.text }]}>
                  {formatEventStatus(event.status)}
                </Text>
              </View>
              <View style={styles.heroFreeBadge}>
                <Text style={styles.heroFreeText}>FREE</Text>
              </View>
              {event.isFlagged && (
                <View style={styles.flaggedBadge}>
                  <Ionicons name="flag" size={12} color="#EF4444" />
                  <Text style={styles.flaggedText}>Flagged</Text>
                </View>
              )}
            </View>
            <Text style={styles.sheetTitle} numberOfLines={3}>{event.title}</Text>
          </View>

          {/* Category + actions row */}
          <View style={styles.sheetHeader}>
            {event.categoryName ? (
              <View style={styles.categoryPill}>
                <Ionicons name="pricetag-outline" size={13} color="#1E3A8A" />
                <Text style={styles.categoryText}>{event.categoryName}</Text>
              </View>
            ) : <View />}

            <View style={styles.sheetActions}>
              <Pressable
                style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}
                onPress={() => void handleToggleSaved()}
              >
                <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? '#EF4444' : '#6B7280'} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}
                onPress={() => Alert.alert('Share', 'Sharing feature coming soon!')}
              >
                <Ionicons name="share-outline" size={20} color="#6B7280" />
              </Pressable>
              {canModerate && (
                <>
                  {isOwner ? (
                    <Pressable
                      style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}
                      onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
                    >
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}
                    onPress={confirmCancel}
                  >
                    <Ionicons
                      color={event.status === 'cancelled' || isCancelling ? '#9CA3AF' : '#F59E0B'}
                      name="close-circle-outline"
                      size={20}
                    />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.6 }]}
                    onPress={confirmDelete}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </Pressable>
                </>
              )}
            </View>
          </View>


          {/* ── Detail rows ── */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionHeader}>Event Details</Text>
            <View style={styles.detailCard}>
              {detailRows.map((row, i) => (
                <View
                  key={row.label}
                  style={styles.detailRow}
                >
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={row.icon} size={18} color="#1E3A8A" />
                  </View>
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Organizer card ── */}
          <View style={styles.organizerSection}>
            <Text style={styles.sectionHeader}>Organizer</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Ionicons name="person" size={24} color="#1E3A8A" />
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>Event Organizer</Text>
                <Text style={styles.organizerRole}>
                  {isOwner ? '✦ You created this event' : 'Hosted by an Eventure organizer'}
                </Text>
              </View>
              {canModerate && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>{isOwner ? 'Owner' : 'Admin'}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Missing cover image notice (owner only) ── */}
          {canModerate && !event.coverImageUrl && (
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="image-outline" size={22} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Add a cover image</Text>
                <Text style={styles.noticeSub}>Your event is live but missing a visual — add one to stand out in the feed.</Text>
              </View>
            </View>
          )}

          {/* ── Description ── */}
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* ── Tags ── */}
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
      {!canModerate ? (
        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && styles.bookBtnPressed]}
            onPress={() => Alert.alert('Booking', 'Booking feature coming soon! 🎟️')}
          >
            <Ionicons name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>Register Now</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F' },
  scroll: { flexGrow: 1 },

  // Loading / error states
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

  // Hero
  heroWrap: { height: 380, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholderIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  heroScrim: { ...StyleSheet.absoluteFillObject },
  overlayTop: {
    position: 'absolute', top: 52, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
  },
  overlayBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  overlayBtnPressed: { opacity: 0.7, backgroundColor: 'rgba(0,0,0,0.6)' },
  heroBadgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  heroBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  flaggedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  flaggedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#EF4444' },
  heroFreeBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(30,58,138,0.08)',
    borderWidth: 1, borderColor: 'rgba(30,58,138,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  heroFreeText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#1E3A8A', letterSpacing: 0.5 },
  sheetTitleBlock: { gap: 10 },
  sheetTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: '#0F172A', lineHeight: 36, letterSpacing: -0.6 },

  // Sheet
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -28, paddingTop: 16,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 48, gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 16,
  },
  grabber: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 4,
  },

  // Sheet header: category + action icons
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetActions: { flexDirection: 'row', gap: 4 },
  actionIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  divider: { height: 1, backgroundColor: '#F3F4F6' },

  // Category
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(30,58,138,0.07)', borderWidth: 1, borderColor: 'rgba(30,58,138,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1E3A8A' },

  // Sections
  sectionHeader: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#111827', marginBottom: 10 },
  detailSection: { gap: 8 },
  organizerSection: { gap: 8 },

  // Title section
  titleSection: { gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'flex-start' },
  titleBlock: { flex: 1, minWidth: 0, gap: 12 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: '#1F2937', flex: 1, lineHeight: 36, letterSpacing: -0.5 },
  freeBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB' },
  freeText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#374151', letterSpacing: 0.5 },

  // Detail card
  detailCard: {
    backgroundColor: '#FAFAFA', borderRadius: 20,
    borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  detailText: { flex: 1, gap: 4 },
  detailLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },
  detailValue: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#111827', lineHeight: 24 },

  // Organizer
  organizerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FAFAFA', borderRadius: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    padding: 18,
  },
  organizerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(30,58,138,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  organizerInfo: { flex: 1, gap: 4 },
  organizerName: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#111827' },
  organizerRole: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#6B7280', lineHeight: 20 },
  ownerBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 18, borderWidth: 1, borderColor: '#A7F3D0',
  },
  ownerBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#059669' },

  // Notice
  noticeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#FEF3C7', borderRadius: 20,
    borderWidth: 1, borderColor: '#FCD34D',
    padding: 18,
  },
  noticeIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#92400E' },
  noticeSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#B45309', lineHeight: 22, marginTop: 4 },

  // Description + tags
  descSection: { gap: 12 },
  tagsSection: { gap: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: '#111827', marginBottom: 8 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 26 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tagPill: {
    backgroundColor: '#F3F4F6', borderRadius: 18,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  tagText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#4B5563' },

  // Actions
  actionsSection: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  ownerActionHint: { flex: 1, padding: 18, backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  ownerActionHintText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconAction: {
    width: 48, height: 48, borderRadius: 20,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  iconActionPressed: { opacity: 0.8, backgroundColor: '#F3F4F6' },
  bookmarkBtn: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  bookmarkBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },

  ownerActions: { flex: 1, gap: spacing.sm },
  editBtn: { borderRadius: 16, overflow: 'hidden' },
  editBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 56, gap: 8,
  },
  editBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 16, minHeight: 50, gap: 8,
  },
  deleteBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#DC2626' },

  stickyFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookBtn: {
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 56, gap: 10,
  },
  bookBtnPressed: { opacity: 0.85 },
  bookBtnText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff' },
});

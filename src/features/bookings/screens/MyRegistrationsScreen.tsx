import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import QRCodeLib from 'qrcode';

import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { fetchMyBookings } from '../api';
import { formatEventDateTime } from '../../events/formatters';
import type { BookingHistoryItem } from '../types';
import type { AppStackParamList } from '../../../navigation/types';

type MyRegistrationsScreenProps = NativeStackScreenProps<AppStackParamList, 'MyRegistrations'>;

const QR_SIZE = 220;

function QRCodeView({ value }: { value: string }) {
  let modules: { data: { [k: number]: number }; size: number } | null = null;
  try {
    const result = QRCodeLib.create(value, { errorCorrectionLevel: 'M' });
    modules = { data: result.modules.data, size: result.modules.size };
  } catch {
    modules = null;
  }

  if (!modules) {
    return (
      <View style={[qrStyles.container, { width: QR_SIZE, height: QR_SIZE, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="qr-code-outline" size={48} color="#9CA3AF" />
      </View>
    );
  }

  const { data, size } = modules;
  const cellSize = QR_SIZE / size;

  const rows = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => data[row * size + col])
  );

  return (
    <View style={[qrStyles.container, { width: QR_SIZE, height: QR_SIZE }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={qrStyles.row}>
          {row.map((cell, colIndex) => (
            <View
              key={colIndex}
              style={[
                qrStyles.cell,
                { width: cellSize, height: cellSize, backgroundColor: cell ? '#111827' : '#FFFFFF' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row' },
  cell: {},
});

const COMPUTED_STATUS_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  confirmed:  { text: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Confirmed'  },
  completed:  { text: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'Attended'   },
  cancelled:  { text: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Cancelled'  },
};

function RegistrationCard({
  item,
  onPress,
  onNavigateToEvent,
}: {
  item: BookingHistoryItem;
  onPress: () => void;
  onNavigateToEvent: () => void;
}) {
  const statusMeta = COMPUTED_STATUS_COLORS[item.computedStatus] ?? COMPUTED_STATUS_COLORS.confirmed;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      <View style={styles.cardImageWrap}>
        {item.eventCoverImageUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: item.eventCoverImageUrl }}
            style={styles.cardImage}
            transition={150}
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <Ionicons name="ticket" size={28} color="rgba(255,255,255,0.35)" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.eventTitle}</Text>

        <View style={styles.cardMeta}>
          <View style={styles.cardMetaRow}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardMetaText}>{formatEventDateTime(item.eventDateTime)}</Text>
          </View>
          <View style={styles.cardMetaRow}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardMetaText} numberOfLines={1}>{item.eventLocation}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.ticketBadge}>
            <Ionicons name="ticket-outline" size={13} color={colors.primary} />
            <Text style={styles.ticketText}>
              {item.ticketCount} ticket{item.ticketCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.cardActions}>
            {item.computedStatus === 'confirmed' && (
              <Pressable
                style={({ pressed }) => [styles.actionButton, styles.secondaryActionButton, pressed && { opacity: 0.72 }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onPress();
                }}
              >
                <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Tap for QR</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.primaryActionButton, pressed && { opacity: 0.84 }]}
              onPress={(e) => {
                e.stopPropagation();
                onNavigateToEvent();
              }}
            >
              <Text style={styles.primaryActionText}>View Event</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function QRModal({
  item,
  onClose,
}: {
  item: BookingHistoryItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Your Ticket</Text>
          <Pressable
            style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color="#374151" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qrCard}>
            <View style={styles.qrEventInfo}>
              <Text style={styles.qrEventTitle} numberOfLines={2}>{item.eventTitle}</Text>
              <View style={styles.qrMetaRow}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.qrMetaText}>{formatEventDateTime(item.eventDateTime)}</Text>
              </View>
              <View style={styles.qrMetaRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.qrMetaText} numberOfLines={1}>{item.eventLocation}</Text>
              </View>
            </View>

            <View style={styles.qrDivider} />

            <View style={styles.qrCodeWrap}>
              <QRCodeView value={item.qrPayload} />
            </View>

            <View style={styles.qrDivider} />

            <View style={styles.qrFooter}>
              <View style={styles.qrTicketCount}>
                <Ionicons name="ticket-outline" size={16} color={colors.primary} />
                <Text style={styles.qrTicketCountText}>
                  {item.ticketCount} ticket{item.ticketCount === 1 ? '' : 's'} reserved
                </Text>
              </View>
              <Text style={styles.qrPayloadText} numberOfLines={2} selectable>
                {item.qrPayload}
              </Text>
            </View>
          </View>

          <Text style={styles.qrDisclaimer}>
            Present this QR code at the event entrance. This ticket is non-transferable.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>{title}</Text>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );
}

export function MyRegistrationsScreen({ navigation }: MyRegistrationsScreenProps) {
  const { profile } = useAppSession();
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQRItem, setActiveQRItem] = useState<BookingHistoryItem | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;

    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await fetchMyBookings();
      if (error) throw error;
      setBookings(data);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load your registrations.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const confirmed = bookings.filter((b) => b.computedStatus === 'confirmed');
  const completed = bookings.filter((b) => b.computedStatus === 'completed');
  const cancelled = bookings.filter((b) => b.computedStatus === 'cancelled');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>My Registrations</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.stateTitle}>Loading registrations...</Text>
          <Text style={styles.stateSub}>Fetching your event tickets.</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Ionicons name="cloud-offline-outline" size={28} color="#EF4444" />
          </View>
          <Text style={styles.stateTitle}>Could not load registrations</Text>
          <Text style={styles.stateSub}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="ticket-outline" size={40} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.stateTitle}>No registrations yet</Text>
          <Text style={styles.stateSub}>
            Browse events and register to see your tickets here.
          </Text>
          <Pressable
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}
          >
            <Text style={styles.exploreBtnText}>Explore Events</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              onRefresh={() => void load(true)}
              refreshing={isRefreshing}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {confirmed.length > 0 && (
            <View style={styles.section}>
              <SectionLabel title="Upcoming" count={confirmed.length} />
              {confirmed.map((item) => (
                <RegistrationCard
                  key={item.id}
                  item={item}
                  onPress={() => setActiveQRItem(item)}
                  onNavigateToEvent={() => navigation.navigate('EventDetail', { eventId: item.eventId })}
                />
              ))}
            </View>
          )}

          {completed.length > 0 && (
            <View style={styles.section}>
              <SectionLabel title="Attended" count={completed.length} />
              {completed.map((item) => (
                <RegistrationCard
                  key={item.id}
                  item={item}
                  onPress={() => {}}
                  onNavigateToEvent={() => navigation.navigate('EventDetail', { eventId: item.eventId })}
                />
              ))}
            </View>
          )}

          {cancelled.length > 0 && (
            <View style={styles.section}>
              <SectionLabel title="Cancelled" count={cancelled.length} />
              {cancelled.map((item) => (
                <RegistrationCard
                  key={item.id}
                  item={item}
                  onPress={() => {}}
                  onNavigateToEvent={() => navigation.navigate('EventDetail', { eventId: item.eventId })}
                />
              ))}
            </View>
          )}

          <View style={styles.scrollPad} />
        </ScrollView>
      )}

      <QRModal item={activeQRItem} onClose={() => setActiveQRItem(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FBFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.sm,
    paddingBottom: 14,
    backgroundColor: '#F8FBFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE7F6',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEF4FF',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: '#0F172A' },
  headerRight: { width: 40 },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH, gap: 12,
  },
  stateIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(30,58,138,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  stateTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#0F172A', textAlign: 'center' },
  stateSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 24, paddingVertical: 11, marginTop: 4,
  },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  emptyIllustration: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  exploreBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 8,
  },
  exploreBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },

  scroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md },
  scrollPad: { height: 80 },

  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionLabelText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#0F172A' },
  sectionCount: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  sectionCountText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.primary },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: '#D7E3F4',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageWrap: { position: 'relative', height: 110 },
  cardImage: { width: '100%', height: '100%' },
  cardImageFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
  statusBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
  },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardBody: { padding: spacing.md, gap: 8 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0F172A', lineHeight: 22 },
  cardMeta: { gap: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', flex: 1 },
  cardFooter: { marginTop: 4, gap: 10 },
  ticketBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,58,138,0.08)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ticketText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
  cardActions: { gap: 8 },
  actionButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  primaryActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderWidth: 1,
    borderColor: '#C9DAF8',
  },
  secondaryActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },

  // QR Modal
  modalRoot: { flex: 1, backgroundColor: '#F8FBFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    backgroundColor: '#F8FBFF',
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: '#111827' },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.lg, paddingBottom: 40 },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  qrEventInfo: { padding: spacing.lg, gap: 8 },
  qrEventTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#111827', lineHeight: 26 },
  qrMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrMetaText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6B7280', flex: 1 },
  qrDivider: {
    height: 1, marginHorizontal: spacing.lg,
    backgroundColor: '#F1F5F9',
  },
  qrCodeWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  qrFooter: { padding: spacing.lg, gap: 10, backgroundColor: '#FAFAFA' },
  qrTicketCount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrTicketCountText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  qrPayloadText: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: '#94A3B8', lineHeight: 16,
  },
  qrDisclaimer: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    color: '#94A3B8', textAlign: 'center',
    lineHeight: 18, marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
});

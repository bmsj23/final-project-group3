import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import type { NotificationSummary } from '../../notifications/types';

type NotificationsScreenProps = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

const SAMPLE_NOTIFICATIONS: NotificationSummary[] = [
  {
    id: 'notif-1',
    title: 'Booking confirmed',
    body: 'Your seat for Tech Connect 2026 has been successfully reserved.',
    type: 'booking_confirmation',
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'Event schedule updated',
    body: 'The Community Startup Mixer now starts at 6:30 PM instead of 6:00 PM.',
    type: 'event_update',
    isRead: false,
  },
  {
    id: 'notif-3',
    title: 'Reminder for tomorrow',
    body: 'Design Forward Workshop begins tomorrow. Check in 15 minutes before start time.',
    type: 'event_reminder',
    isRead: true,
  },
];

const NOTIFICATION_META: Record<
  NotificationSummary['type'],
  { icon: keyof typeof Ionicons.glyphMap; accent: string; bg: string; label: string }
> = {
  booking_confirmation: {
    icon: 'checkmark-circle',
    accent: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    label: 'Booking',
  },
  event_update: {
    icon: 'sparkles',
    accent: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    label: 'Update',
  },
  event_reminder: {
    icon: 'time',
    accent: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Reminder',
  },
};

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const unreadCount = SAMPLE_NOTIFICATIONS.filter((notification) => !notification.isRead).length;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#060D1F', '#0F1E3D', '#091423']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Stay updated with the latest activity inside the app.</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Unread</Text>
            <Text style={styles.summaryValue}>{unreadCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{SAMPLE_NOTIFICATIONS.length}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {SAMPLE_NOTIFICATIONS.map((notification) => {
            const meta = NOTIFICATION_META[notification.type];

            return (
              <View key={notification.id} style={[styles.card, !notification.isRead && styles.cardUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons color={meta.accent} name={meta.icon} size={20} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{notification.title}</Text>
                    <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.typeText, { color: meta.accent }]}>{meta.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>{notification.body}</Text>
                  {!notification.isRead ? <Text style={styles.unreadText}>New</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060D1F',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
  },
  orbTop: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#2563EB',
    opacity: 0.12,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#A855F7',
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#93C5FD',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#F8FAFC',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 20,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#F8FAFC',
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
  },
  cardUnread: {
    borderColor: '#C4B5FD',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#0F172A',
  },
  typePill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  cardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  unreadText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#7C3AED',
  },
});

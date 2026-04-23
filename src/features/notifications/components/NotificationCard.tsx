import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatEventDateTime } from '../../events/formatters';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import type { NotificationSummary, NotificationType } from '../types';

type NotificationCardProps = {
  item: NotificationSummary;
  index: number;
  onPress: () => void;
};

const NOTIFICATION_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  booking_confirmation: { icon: 'checkmark-circle', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  event_update: { icon: 'sparkles', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  event_reminder: { icon: 'time', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  event_registration: { icon: 'people', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
};

export function NotificationCard({ item, index, onPress }: NotificationCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const meta = NOTIFICATION_META[item.type] ?? NOTIFICATION_META.event_update;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      delay: index * 55,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      >
        <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
          <Ionicons color={meta.color} name={meta.icon} size={20} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.cardBody}>{item.body}</Text>

          <View style={styles.detailChipRow}>
            <View style={styles.detailChip}>
              <Ionicons color={colors.primary} name="calendar-outline" size={13} />
              <Text numberOfLines={1} style={styles.detailChipText}>
                {item.eventStartsAt ? formatEventDateTime(item.eventStartsAt) : 'Schedule pending'}
              </Text>
            </View>

            <View style={styles.detailChip}>
              <Ionicons color={colors.primary} name="people-outline" size={13} />
              <Text style={styles.detailChipText}>
                {item.remainingSlots ?? 0} / {item.capacity ?? 0} slots
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerRow}>
              <Ionicons color="#94A3B8" name="location-outline" size={13} />
              <Text numberOfLines={1} style={styles.footerText}>
                {item.eventLocation ?? 'Location pending'}
              </Text>
            </View>
            <Ionicons color="#CBD5E1" name="chevron-forward" size={16} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.26)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#312E81',
    lineHeight: 22,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EC4899',
  },
  cardBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  detailChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  detailChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#475569' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#94A3B8', flex: 1 },
});

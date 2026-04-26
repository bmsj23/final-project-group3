import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatEventDateTime } from '../../events/formatters';
import type { NotificationSummary, NotificationType } from '../../notifications/types';
import { styles } from './notificationScreen.styles';

type NotificationActivityCardProps = {
  item: NotificationSummary;
  onPress: () => void;
};

const META: Record<NotificationType, { backgroundColor: string; color: string; icon: keyof typeof Ionicons.glyphMap }> =
  {
    booking_confirmation: { icon: 'checkmark-circle', color: '#15803D', backgroundColor: '#DCFCE7' },
    event_update: { icon: 'sparkles', color: '#1D4ED8', backgroundColor: '#DBEAFE' },
    event_reminder: { icon: 'time', color: '#B45309', backgroundColor: '#FEF3C7' },
    event_registration: { icon: 'people', color: '#BE185D', backgroundColor: '#FCE7F3' },
  };

export function NotificationActivityCard({ item, onPress }: NotificationActivityCardProps) {
  const meta = META[item.type] ?? META.event_update;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}>
      <View style={styles.activityTopRow}>
        <View style={[styles.activityIconWrap, { backgroundColor: meta.backgroundColor }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        <View style={styles.activityCopy}>
          <View style={styles.activityTitleRow}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            {!item.isRead ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.activityBody}>{item.body}</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Ionicons name="calendar-outline" size={13} color="#1D4ED8" />
          <Text style={styles.chipText}>
            {item.eventStartsAt ? formatEventDateTime(item.eventStartsAt) : 'Schedule pending'}
          </Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="people-outline" size={13} color="#1D4ED8" />
          <Text style={styles.chipText}>
            {item.remainingSlots ?? 0} / {item.capacity ?? 0} slots
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerMeta}>
          <Ionicons name="location-outline" size={13} color="#64748B" />
          <Text numberOfLines={1} style={styles.footerText}>
            {item.eventLocation ?? 'Location pending'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NotificationSummary } from '../../notifications/types';
import { NotificationActivityCard } from './NotificationActivityCard';
import { styles } from './notificationScreen.styles';

type NotificationActivitySectionProps = {
  errorMessage: string | null;
  isLoading: boolean;
  notifications: NotificationSummary[];
  onOpenNotification: (item: NotificationSummary) => void;
};

export function NotificationActivitySection({
  errorMessage,
  isLoading,
  notifications,
  onOpenNotification,
}: NotificationActivitySectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent activity</Text>
        <Text style={styles.cardDescription}>
          The latest organizer-related updates tied to your events and attendee registrations.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.emptyTitle}>Loading notifications...</Text>
          <Text style={styles.emptyText}>Checking the newest activity for your events.</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="cloud-offline-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.emptyTitle}>Couldn't load notifications</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="notifications-off-outline" size={26} color="#2563EB" />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            Your event registration updates will appear here once attendees start joining your events.
          </Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {notifications.map((item) => (
            <NotificationActivityCard key={item.id} item={item} onPress={() => onOpenNotification(item)} />
          ))}
        </View>
      )}
    </View>
  );
}

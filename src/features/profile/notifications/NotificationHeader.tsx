import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './notificationScreen.styles';

type NotificationHeaderProps = {
  onBack: () => void;
};

export function NotificationHeader({ onBack }: NotificationHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color="#0F172A" />
      </Pressable>

      <View>
        <Text style={styles.eyebrow}>Profile Alerts</Text>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          Track organizer activity, attendee registrations, and notification access in one clean place.
        </Text>
      </View>
    </View>
  );
}

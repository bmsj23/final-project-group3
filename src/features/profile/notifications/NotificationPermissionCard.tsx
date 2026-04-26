import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PermissionState } from './notificationScreen.shared';
import { styles } from './notificationScreen.styles';

type NotificationPermissionCardProps = {
  isSubmitting: boolean;
  onManageSettings: () => void;
  onRequestPermission: () => void;
  permissionState: PermissionState;
};

export function NotificationPermissionCard({
  isSubmitting,
  onManageSettings,
  onRequestPermission,
  permissionState,
}: NotificationPermissionCardProps) {
  const isGranted = permissionState === 'granted';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Permission control</Text>
        <Text style={styles.cardDescription}>
          Make sure organizer alerts are allowed so attendee activity can reach this device right away.
        </Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isGranted ? '#DCFCE7' : '#FEE2E2' },
          ]}
        >
          <Text style={[styles.statusPillText, { color: isGranted ? '#166534' : '#991B1B' }]}>
            {isGranted ? 'Enabled' : 'Blocked'}
          </Text>
        </View>
        <Text style={styles.statusText}>
          {isGranted ? 'This phone can receive organizer notifications.' : 'Turn this on to receive organizer notifications.'}
        </Text>
      </View>

      <View style={styles.subtleRow}>
        <Text style={styles.subtleLabel}>Recommended for event owners</Text>
        <Text style={styles.subtleValue}>{isGranted ? 'Ready' : 'Action needed'}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onRequestPermission}
        style={({ pressed }) => [
          styles.buttonPrimary,
          pressed && !isSubmitting && styles.pressed,
          isSubmitting && styles.buttonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#F8FAFC" />
        ) : (
          <>
            <Ionicons name={isGranted ? 'refresh-outline' : 'notifications-outline'} size={17} color="#F8FAFC" />
            <Text style={styles.buttonPrimaryText}>{isGranted ? 'Refresh permission' : 'Enable notifications'}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onManageSettings}
        style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
      >
        <Ionicons name="settings-outline" size={17} color="#1D4ED8" />
        <Text style={styles.buttonSecondaryText}>Open phone settings</Text>
      </Pressable>
    </View>
  );
}

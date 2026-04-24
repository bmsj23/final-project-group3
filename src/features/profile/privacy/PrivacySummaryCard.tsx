import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { PermissionState, PrivacySettings } from './privacyScreen.shared';
import { styles } from './privacyScreen.styles';

type PrivacySummaryCardProps = {
  enabledCount: number;
  permissionState: PermissionState;
  settings: PrivacySettings;
  summary: {
    label: string;
    text: string;
    tone: string;
    bg: string;
  };
};

export function PrivacySummaryCard({
  enabledCount,
  permissionState,
  settings,
  summary,
}: PrivacySummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryGlow} pointerEvents="none" />

      <View style={styles.summaryTopRow}>
        <View style={[styles.summaryBadge, { backgroundColor: summary.bg }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={summary.tone} />
          <Text style={[styles.summaryBadgeText, { color: summary.tone }]}>{summary.label}</Text>
        </View>
        <Text style={styles.summaryMeta}>{enabledCount} controls enabled</Text>
      </View>

      <Text style={styles.summaryTitle}>Your privacy snapshot</Text>
      <Text style={styles.summaryText}>{summary.text}</Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {settings.profileVisibleToAttendees ? 'Visible' : 'Hidden'}
          </Text>
          <Text style={styles.summaryStatLabel}>Organizer profile</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{settings.loginAlerts ? 'On' : 'Off'}</Text>
          <Text style={styles.summaryStatLabel}>Security alerts</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {permissionState === 'enabled'
              ? 'Ready'
              : permissionState === 'disabled'
                ? 'Blocked'
                : 'Manual'}
          </Text>
          <Text style={styles.summaryStatLabel}>Phone permission</Text>
        </View>
      </View>
    </View>
  );
}

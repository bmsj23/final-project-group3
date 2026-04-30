import { Ionicons } from '@expo/vector-icons';
import { Switch, Text, View } from 'react-native';

import type { PermissionState, PrivacySettingItem, PrivacySettings, SettingKey } from './privacyScreen.shared';
import { styles } from './privacyScreen.styles';

type PrivacySettingsSectionProps = {
  description: string;
  onToggle: (key: SettingKey, value: boolean) => void;
  permissionState: PermissionState;
  settings: PrivacySettings;
  title: string;
  items: PrivacySettingItem[];
};

export function PrivacySettingsSection({
  description,
  items,
  onToggle,
  permissionState,
  settings,
  title,
}: PrivacySettingsSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>

      <View style={styles.toggleList}>
        {items.map((item) => {
          return (
            <View key={item.key} style={styles.toggleRow}>
              <View style={styles.toggleIconWrap}>
                <Ionicons name={item.icon} size={18} color="#2563EB" />
              </View>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>{item.title}</Text>
                <Text style={styles.toggleDescription}>{item.description}</Text>
              </View>
              <Switch
                onValueChange={(value) => void onToggle(item.key, value)}
                thumbColor={settings[item.key] ? '#FFFFFF' : '#CBD5E1'}
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                value={settings[item.key]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

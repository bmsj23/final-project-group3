import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { ProfileRecord } from '../../../lib/supabase/types';
import { colors } from '../../../theme/colors';
import { MENU_ITEMS, type ProfileMenuAction } from './profileScreen.shared';
import { styles } from './profileScreen.styles';

type QuickAction = {
  color: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
};

type ProfileAuthenticatedContentProps = {
  memberSince: string;
  onCreateEvent: () => void;
  onExplore: () => void;
  onMenuPress: (action: ProfileMenuAction) => void;
  onMyEvents: () => void;
  onNotifications: () => void;
  onSignOut: () => void;
  profile: ProfileRecord | null;
  roleLabel: string;
};

export function ProfileAuthenticatedContent({
  memberSince,
  onCreateEvent,
  onExplore,
  onMenuPress,
  onMyEvents,
  onNotifications,
  onSignOut,
  profile,
  roleLabel,
}: ProfileAuthenticatedContentProps) {
  const quickActions: QuickAction[] = [
    { icon: 'calendar', label: 'My Events', color: '#60A5FA', onPress: onMyEvents },
    { icon: 'add-circle', label: 'Create', color: '#34D399', onPress: onCreateEvent },
    { icon: 'compass', label: 'Explore', color: '#FBBF24', onPress: onExplore },
    { icon: 'notifications', label: 'Alerts', color: '#A78BFA', onPress: onNotifications },
  ];

  const accountInfo = [
    { icon: 'mail-outline' as const, label: 'Email', value: profile?.email ?? '-' },
    { icon: 'shield-outline' as const, label: 'Role', value: roleLabel },
    { icon: 'calendar-outline' as const, label: 'Joined', value: memberSince },
    { icon: 'person-outline' as const, label: 'Account ID', value: `${profile?.id?.slice(0, 8) ?? '-'}...` },
  ];

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account Info</Text>
        <View style={styles.infoCard}>
          {accountInfo.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index < accountInfo.length - 1 && styles.infoRowBorder]}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons name={row.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>More</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => onMenuPress(item.action)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
        onPress={onSignOut}
      >
        <View style={styles.signOutIconWrap}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        </View>
        <Text style={styles.signOutText}>Sign Out</Text>
        <Ionicons name="chevron-forward" size={16} color="#EF4444" />
      </Pressable>

      <Text style={styles.versionText}>Eventure v1.0.0 | Made with love in PH</Text>
    </>
  );
}

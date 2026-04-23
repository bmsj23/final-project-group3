import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type NotificationsScreenProps = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

type NotificationSettings = {
  appNotificationsEnabled: boolean;
  eventReminders: boolean;
  bookingUpdates: boolean;
  eventChanges: boolean;
  marketingUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
};

type NotificationSettingKey = keyof Omit<NotificationSettings, 'appNotificationsEnabled'>;
type PermissionState = 'enabled' | 'disabled' | 'unsupported';

const STORAGE_KEY = '@eventure/notification-settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  appNotificationsEnabled: true,
  eventReminders: true,
  bookingUpdates: true,
  eventChanges: true,
  marketingUpdates: false,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
};

const SETTING_SECTIONS: Array<{
  title: string;
  description: string;
  items: Array<{
    key: NotificationSettingKey;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
  }>;
}> = [
  {
    title: 'Push notifications',
    description: 'Choose which alerts can appear on your phone.',
    items: [
      {
        key: 'eventReminders',
        icon: 'time-outline',
        title: 'Event reminders',
        description: 'Get notified before events you saved or booked.',
      },
      {
        key: 'bookingUpdates',
        icon: 'ticket-outline',
        title: 'Booking updates',
        description: 'Receive confirmations, cancellations, and check-in updates.',
      },
      {
        key: 'eventChanges',
        icon: 'calendar-outline',
        title: 'Event changes',
        description: 'See schedule changes, venue changes, and organizer notices.',
      },
      {
        key: 'marketingUpdates',
        icon: 'megaphone-outline',
        title: 'Promotions and announcements',
        description: 'Get launch news, featured events, and product updates.',
      },
    ],
  },
  {
    title: 'Delivery preferences',
    description: 'Fine-tune how alerts behave on your device.',
    items: [
      {
        key: 'soundEnabled',
        icon: 'volume-high-outline',
        title: 'Sound',
        description: 'Play a sound when a notification arrives.',
      },
      {
        key: 'vibrationEnabled',
        icon: 'phone-portrait-outline',
        title: 'Vibration',
        description: 'Use vibration for incoming notifications.',
      },
      {
        key: 'quietHoursEnabled',
        icon: 'moon-outline',
        title: 'Quiet hours',
        description: 'Reduce non-essential alerts during late hours.',
      },
    ],
  },
];

async function getSystemNotificationPermission(): Promise<PermissionState> {
  if (Platform.OS !== 'android') {
    return 'unsupported';
  }

  if (typeof Platform.Version !== 'number' || Platform.Version < 33) {
    return 'enabled';
  }

  const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return granted ? 'enabled' : 'disabled';
}

async function requestSystemNotificationPermission(): Promise<PermissionState> {
  if (Platform.OS !== 'android') {
    return 'unsupported';
  }

  if (typeof Platform.Version !== 'number' || Platform.Version < 33) {
    return 'enabled';
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return result === PermissionsAndroid.RESULTS.GRANTED ? 'enabled' : 'disabled';
}

async function openPhoneNotificationSettings() {
  await Linking.openSettings();
}

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionState, setPermissionState] = useState<PermissionState>('disabled');
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionBusy, setIsPermissionBusy] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const [storedSettings, currentPermission] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        getSystemNotificationPermission(),
      ]);

      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(storedSettings) as Partial<NotificationSettings>) });
      }

      setPermissionState(currentPermission);
    } catch {
      setPermissionState(await getSystemNotificationPermission());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void getSystemNotificationPermission().then(setPermissionState);
      }
    });

    return () => subscription.remove();
  }, []);

  const persistSettings = useCallback(async (next: NotificationSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      Alert.alert('Unable to save', 'Your notification preferences could not be saved right now.');
    }
  }, []);

  const handleToggleSetting = useCallback(
    async (key: NotificationSettingKey, value: boolean) => {
      if (permissionState === 'disabled') {
        Alert.alert(
          'Phone notifications are blocked',
          'Turn on device notifications first so these preferences can take effect.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void openPhoneNotificationSettings() },
          ],
        );
        return;
      }

      if (!settings.appNotificationsEnabled) {
        Alert.alert('Notifications are off in app', 'Enable app notifications first, then adjust the categories.');
        return;
      }

      await persistSettings({ ...settings, [key]: value });
    },
    [permissionState, persistSettings, settings],
  );

  const handleDeviceNotificationsPress = useCallback(async () => {
    setIsPermissionBusy(true);

    try {
      if (permissionState === 'unsupported') {
        await openPhoneNotificationSettings();
        return;
      }

      if (permissionState === 'disabled') {
        const nextState = await requestSystemNotificationPermission();
        setPermissionState(nextState);

        if (nextState === 'enabled') {
          return;
        }

        Alert.alert(
          'Permission still blocked',
          'Your phone did not grant notification access. Open system settings to enable it manually.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void openPhoneNotificationSettings() },
          ],
        );
        return;
      }

      Alert.alert(
        'Manage in phone settings',
        'Your device already allows notifications for this app. Use system settings if you want to turn them off or change how they appear.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void openPhoneNotificationSettings() },
        ],
      );
    } finally {
      setIsPermissionBusy(false);
    }
  }, [permissionState]);

  const permissionStatusText = useMemo(() => {
    if (permissionState === 'enabled') {
      return 'Enabled on this device';
    }
    if (permissionState === 'disabled') {
      return 'Blocked on this device';
    }
    return 'Managed by phone settings';
  }, [permissionState]);

  const deviceActionLabel = useMemo(() => {
    if (permissionState === 'disabled') {
      return 'Turn on phone notifications';
    }
    if (permissionState === 'enabled') {
      return 'Manage in phone settings';
    }
    return 'Open phone settings';
  }, [permissionState]);

  const settingsDisabled = permissionState === 'disabled' || !settings.appNotificationsEnabled;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#060D1F', '#0F1E3D', '#091423']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#93C5FD" />
          <Text style={styles.loadingText}>Loading your notification preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.subtitle}>
              Control phone alerts, delivery behavior, and which app updates are allowed to reach you.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="notifications-outline" size={22} color="#60A5FA" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Phone notification access</Text>
              <Text style={styles.heroSubtitle}>{permissionStatusText}</Text>
            </View>
          </View>
          <Text style={styles.heroNote}>
            Device notifications are controlled by the operating system. This button will request permission when
            Android allows it, or open your phone settings for manual control.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isPermissionBusy}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && !isPermissionBusy && styles.primaryActionPressed,
              isPermissionBusy && styles.primaryActionDisabled,
            ]}
            onPress={() => void handleDeviceNotificationsPress()}
          >
            {isPermissionBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={permissionState === 'disabled' ? 'notifications' : 'settings-outline'}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryActionText}>{deviceActionLabel}</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>General</Text>
          <Text style={styles.sectionDescription}>
            Use this as the main switch for whether the app should send you notifications at all.
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons
                name={settings.appNotificationsEnabled ? 'notifications-outline' : 'notifications-off-outline'}
                size={18}
                color="#2563EB"
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Enable notifications in app</Text>
              <Text style={styles.settingDescription}>
                Turn this off if you want to stop all reminders, updates, and promotional alerts from the app.
              </Text>
            </View>
            <Switch
              onValueChange={(value) => void persistSettings({ ...settings, appNotificationsEnabled: value })}
              thumbColor={settings.appNotificationsEnabled ? '#FFFFFF' : '#CBD5E1'}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              value={settings.appNotificationsEnabled}
            />
          </View>
        </View>

        {SETTING_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDescription}>{section.description}</Text>

            <View style={styles.settingsList}>
              {section.items.map((item) => (
                <View key={item.key} style={[styles.settingRow, settingsDisabled && styles.settingRowDisabled]}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name={item.icon} size={18} color={settingsDisabled ? '#94A3B8' : '#2563EB'} />
                  </View>
                  <View style={styles.settingCopy}>
                    <Text style={[styles.settingTitle, settingsDisabled && styles.settingTitleDisabled]}>
                      {item.title}
                    </Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    disabled={settingsDisabled}
                    onValueChange={(value) => void handleToggleSetting(item.key, value)}
                    thumbColor={settings[item.key] ? '#FFFFFF' : '#CBD5E1'}
                    trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                    value={settings[item.key]}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060D1F',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 18,
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
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F8FAFC',
  },
  heroSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#93C5FD',
  },
  heroNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#CBD5E1',
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryActionPressed: {
    opacity: 0.85,
  },
  primaryActionDisabled: {
    opacity: 0.7,
  },
  primaryActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sectionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },
  settingsList: {
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  settingRowDisabled: {
    opacity: 0.65,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  settingTitleDisabled: {
    color: '#475569',
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
});

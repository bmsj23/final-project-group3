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
import { useAppSession } from '../../../providers/AppSessionProvider';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type PrivacyScreenProps = NativeStackScreenProps<AppStackParamList, 'Privacy'>;

type PermissionState = 'enabled' | 'disabled' | 'unsupported';

type PrivacySettings = {
  profileVisibleToAttendees: boolean;
  organizerContactEnabled: boolean;
  searchableByEmail: boolean;
  personalizedRecommendations: boolean;
  analyticsSharing: boolean;
  marketingPersonalization: boolean;
  loginAlerts: boolean;
  sensitiveActionConfirmation: boolean;
};

type SettingKey = keyof PrivacySettings;

const STORAGE_KEY = '@eventure/privacy-settings';

const DEFAULT_SETTINGS: PrivacySettings = {
  profileVisibleToAttendees: true,
  organizerContactEnabled: true,
  searchableByEmail: false,
  personalizedRecommendations: true,
  analyticsSharing: true,
  marketingPersonalization: false,
  loginAlerts: true,
  sensitiveActionConfirmation: true,
};

const PRIVACY_SECTIONS: Array<{
  title: string;
  description: string;
  items: Array<{
    key: SettingKey;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
  }>;
}> = [
  {
    title: 'Profile visibility',
    description: 'Control how much of your organizer identity is visible inside the app.',
    items: [
      {
        key: 'profileVisibleToAttendees',
        icon: 'eye-outline',
        title: 'Show profile on event pages',
        description: 'Let attendees see your public organizer profile when viewing your events.',
      },
      {
        key: 'organizerContactEnabled',
        icon: 'chatbubble-ellipses-outline',
        title: 'Allow contact requests',
        description: 'Permit support or organizer-related inquiries routed through the app experience.',
      },
      {
        key: 'searchableByEmail',
        icon: 'search-outline',
        title: 'Searchable by email',
        description: 'Allow your account to be easier to identify when support verifies your identity.',
      },
    ],
  },
  {
    title: 'Data preferences',
    description: 'Choose how Eventure uses your account activity to personalize the experience.',
    items: [
      {
        key: 'personalizedRecommendations',
        icon: 'sparkles-outline',
        title: 'Personalized recommendations',
        description: 'Use your interests and event activity to improve event suggestions.',
      },
      {
        key: 'analyticsSharing',
        icon: 'bar-chart-outline',
        title: 'Analytics and diagnostics',
        description: 'Share usage signals that help improve reliability, performance, and bug detection.',
      },
      {
        key: 'marketingPersonalization',
        icon: 'megaphone-outline',
        title: 'Marketing personalization',
        description: 'Tailor promotional content based on your in-app activity and preferences.',
      },
    ],
  },
  {
    title: 'Security controls',
    description: 'Extra checks that help keep your account safer on this device.',
    items: [
      {
        key: 'loginAlerts',
        icon: 'notifications-outline',
        title: 'Security alerts',
        description: 'Keep important account and sign-in alerts enabled for this device.',
      },
      {
        key: 'sensitiveActionConfirmation',
        icon: 'shield-checkmark-outline',
        title: 'Confirm sensitive actions',
        description: 'Require an extra confirmation before account-sensitive changes are completed.',
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

async function openPhoneSettings() {
  await Linking.openSettings();
}

function formatDateLabel(value: string | undefined) {
  if (!value) {
    return 'Unavailable';
  }

  const parsed = new Date(value);
  return parsed.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getProtectionLevel(settings: PrivacySettings, permissionState: PermissionState) {
  const checks = [
    settings.loginAlerts,
    settings.sensitiveActionConfirmation,
    settings.analyticsSharing,
    permissionState !== 'disabled',
  ].filter(Boolean).length;

  if (checks >= 4) {
    return {
      label: 'Strong protection',
      text: 'Your account protections and device alerts are in a healthy state.',
      tone: '#22C55E',
      bg: 'rgba(34,197,94,0.14)',
    };
  }

  if (checks >= 2) {
    return {
      label: 'Needs review',
      text: 'A few protections are active, but there is still room to tighten privacy or alert coverage.',
      tone: '#F59E0B',
      bg: 'rgba(245,158,11,0.14)',
    };
  }

  return {
    label: 'Action recommended',
    text: 'Turn on more safeguards so account changes and important alerts are easier to catch.',
    tone: '#F97316',
    bg: 'rgba(249,115,22,0.14)',
  };
}

export function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const { profile, signOut } = useAppSession();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [permissionState, setPermissionState] = useState<PermissionState>('disabled');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const [storedSettings, currentPermission] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        getSystemNotificationPermission(),
      ]);

      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(storedSettings) as Partial<PrivacySettings>) });
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

  const persistSettings = useCallback(async (next: PrivacySettings) => {
    setSettings(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      Alert.alert('Unable to save', 'Your privacy preferences could not be saved right now.');
    }
  }, []);

  const handleToggleSetting = useCallback(
    async (key: SettingKey, value: boolean) => {
      if (key === 'loginAlerts' && value && permissionState === 'disabled') {
        Alert.alert(
          'Phone alerts are blocked',
          'Turn on device notifications first so security alerts can reach you on this phone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                setIsOpeningSettings(true);
                void openPhoneSettings().finally(() => setIsOpeningSettings(false));
              },
            },
          ],
        );
        return;
      }

      await persistSettings({ ...settings, [key]: value });
    },
    [permissionState, persistSettings, settings],
  );

  const handleOpenPhoneSettings = useCallback(async () => {
    setIsOpeningSettings(true);

    try {
      await openPhoneSettings();
    } finally {
      setIsOpeningSettings(false);
    }
  }, []);

  const handleRequestDataExport = useCallback(() => {
    Alert.alert(
      'Request account data',
      'A support request is the safest flow for exports in this build. You can review your policy rights now and then continue through Help & Support.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Privacy Policy', onPress: () => navigation.navigate('TermsPolicy', { section: 'privacy' }) },
        { text: 'Open Help', onPress: () => navigation.navigate('Help') },
      ],
    );
  }, [navigation]);

  const handleRequestDeletion = useCallback(() => {
    Alert.alert(
      'Request account deletion',
      'Deletion requests should be confirmed through support so event records, bookings, and compliance checks can be reviewed properly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Help', onPress: () => navigation.navigate('Help') },
      ],
    );
  }, [navigation]);

  const handleSignOutThisDevice = useCallback(() => {
    Alert.alert('Sign out on this device?', 'This will end your current session and require you to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut]);

  const enabledCount = useMemo(
    () => Object.values(settings).filter(Boolean).length,
    [settings],
  );

  const protection = useMemo(
    () => getProtectionLevel(settings, permissionState),
    [permissionState, settings],
  );

  const permissionStatusText = useMemo(() => {
    if (permissionState === 'enabled') {
      return 'Device alerts enabled';
    }

    if (permissionState === 'disabled') {
      return 'Device alerts blocked';
    }

    return 'Managed by phone settings';
  }, [permissionState]);

  const accountRows = useMemo(
    () => [
      {
        icon: 'mail-outline' as const,
        label: 'Sign-in email',
        value: profile?.email ?? 'Unavailable',
      },
      {
        icon: 'person-circle-outline' as const,
        label: 'Account ID',
        value: profile?.id ? `${profile.id.slice(0, 8)}...` : 'Unavailable',
      },
      {
        icon: 'calendar-outline' as const,
        label: 'Member since',
        value: formatDateLabel(profile?.created_at),
      },
      {
        icon: 'phone-portrait-outline' as const,
        label: 'Device alerts',
        value: permissionStatusText,
      },
    ],
    [permissionStatusText, profile?.created_at, profile?.email, profile?.id],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#020617', '#07152A', '#0E2A3F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#7DD3FC" />
          <Text style={styles.loadingText}>Loading your privacy controls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#020617', '#07152A', '#0E2A3F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

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
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Account controls</Text>
            <Text style={styles.title}>Privacy & Security</Text>
            <Text style={styles.subtitle}>
              Review account visibility, data preferences, security alerts, and legal controls in one place.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: protection.bg }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={protection.tone} />
              <Text style={[styles.heroBadgeText, { color: protection.tone }]}>{protection.label}</Text>
            </View>
            <Text style={styles.heroMeta}>{enabledCount} of {Object.keys(settings).length} controls enabled</Text>
          </View>

          <Text style={styles.heroTitle}>Protection overview</Text>
          <Text style={styles.heroText}>{protection.text}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{settings.sensitiveActionConfirmation ? 'On' : 'Off'}</Text>
              <Text style={styles.heroStatLabel}>Sensitive confirmations</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{settings.loginAlerts ? 'On' : 'Off'}</Text>
              <Text style={styles.heroStatLabel}>Security alerts</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {permissionState === 'enabled' ? 'Ready' : permissionState === 'disabled' ? 'Blocked' : 'Manual'}
              </Text>
              <Text style={styles.heroStatLabel}>Phone permission</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Account security</Text>
            <Text style={styles.sectionDescription}>
              Basic identity and device signals tied to your current session.
            </Text>
          </View>

          <View style={styles.infoCard}>
            {accountRows.map((row, index) => (
              <View key={row.label} style={[styles.infoRow, index < accountRows.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={row.icon} size={17} color="#0EA5E9" />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isOpeningSettings}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && !isOpeningSettings && styles.pressed,
              isOpeningSettings && styles.actionDisabled,
            ]}
            onPress={() => void handleOpenPhoneSettings()}
          >
            {isOpeningSettings ? (
              <ActivityIndicator size="small" color="#E0F2FE" />
            ) : (
              <>
                <Ionicons name="settings-outline" size={16} color="#E0F2FE" />
                <Text style={styles.secondaryActionText}>Manage phone permissions</Text>
              </>
            )}
          </Pressable>
        </View>

        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>
            </View>

            <View style={styles.settingsList}>
              {section.items.map((item) => (
                <View key={item.key} style={styles.settingRow}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#0EA5E9" />
                  </View>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    onValueChange={(value) => void handleToggleSetting(item.key, value)}
                    thumbColor={settings[item.key] ? '#FFFFFF' : '#CBD5E1'}
                    trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                    value={settings[item.key]}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your data choices</Text>
            <Text style={styles.sectionDescription}>
              Use these actions when you need policy details, export guidance, or account removal support.
            </Text>
          </View>

          <View style={styles.actionList}>
            {[
              {
                icon: 'document-text-outline' as const,
                title: 'Review privacy policy',
                text: 'Read the current policy summary and your privacy rights.',
                onPress: () => navigation.navigate('TermsPolicy', { section: 'privacy' }),
              },
              {
                icon: 'newspaper-outline' as const,
                title: 'Review terms of service',
                text: 'See platform rules, account responsibilities, and service conditions.',
                onPress: () => navigation.navigate('TermsPolicy', { section: 'terms' }),
              },
              {
                icon: 'download-outline' as const,
                title: 'Request account data',
                text: 'Start a support-assisted request for a copy of eligible account information.',
                onPress: handleRequestDataExport,
              },
              {
                icon: 'trash-outline' as const,
                title: 'Request account deletion',
                text: 'Route a deletion request through support for review and confirmation.',
                destructive: true,
                onPress: handleRequestDeletion,
              },
            ].map((item, index, items) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                  index < items.length - 1 && styles.actionRowBorder,
                ]}
                onPress={item.onPress}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    item.destructive ? styles.actionIconWrapDanger : styles.actionIconWrapDefault,
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={item.destructive ? '#DC2626' : '#0369A1'} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={[styles.actionTitle, item.destructive && styles.actionTitleDanger]}>{item.title}</Text>
                  <Text style={styles.actionText}>{item.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerTitle}>Session control</Text>
            <Text style={styles.footerText}>
              If this is not your device anymore, sign out to remove local access to your account.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
            onPress={handleSignOutThisDevice}
          >
            <Ionicons name="log-out-outline" size={18} color="#FECACA" />
            <Text style={styles.signOutText}>Sign out on this device</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
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
    color: '#BFDBFE',
    textAlign: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0891B2',
    opacity: 0.14,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1D4ED8',
    opacity: 0.12,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: spacing.lg,
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
  pressed: {
    opacity: 0.8,
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
    color: '#7DD3FC',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 29,
    color: '#F8FAFC',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
  },
  heroCard: {
    backgroundColor: 'rgba(8,47,73,0.58)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.16)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  heroBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  heroMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#BAE6FD',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  heroText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#D7F0FF',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(2,6,23,0.3)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.14)',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  heroStatValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F8FAFC',
  },
  heroStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#BAE6FD',
    textAlign: 'center',
    lineHeight: 16,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(125,211,252,0.16)',
    marginHorizontal: 10,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#D7E6F3',
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#082F49',
    letterSpacing: -0.4,
  },
  sectionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#5B7186',
  },
  infoCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#0EA5E9',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#E0F2FE',
  },
  actionDisabled: {
    opacity: 0.7,
  },
  settingsList: {
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
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
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  actionList: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  actionRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapDefault: {
    backgroundColor: '#ECFEFF',
  },
  actionIconWrapDanger: {
    backgroundColor: '#FEF2F2',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  actionTitleDanger: {
    color: '#991B1B',
  },
  actionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  footerCard: {
    backgroundColor: 'rgba(127,29,29,0.28)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  footerCopy: {
    gap: 6,
  },
  footerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FEE2E2',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#FECACA',
  },
  signOutButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(69,10,10,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FEE2E2',
  },
});

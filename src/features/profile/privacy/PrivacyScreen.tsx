import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { PrivacyActionList } from './PrivacyActionList';
import { PrivacyHeader } from './PrivacyHeader';
import { PrivacySettingsSection } from './PrivacySettingsSection';
import { PrivacySummaryCard } from './PrivacySummaryCard';
import {
  DEFAULT_SETTINGS,
  formatDateLabel,
  getProtectionSummary,
  PRIVACY_SECTIONS,
  STORAGE_KEY,
  type PermissionState,
  type PrivacySettings,
  type SettingKey,
} from './privacyScreen.shared';
import { styles } from './privacyScreen.styles';

type PrivacyScreenProps = NativeStackScreenProps<AppStackParamList, 'Privacy'>;

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
      Alert.alert('Unable to save', 'Your privacy choices could not be saved right now.');
    }
  }, []);

  const handleToggleSetting = useCallback(
    async (key: SettingKey, value: boolean) => {
      await persistSettings({ ...settings, [key]: value });
    },
    [persistSettings, settings],
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
      'Exports are handled through support in this build so the request can be reviewed safely.',
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
      'Account deletion is routed through support so event and booking records can be reviewed properly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Help', onPress: () => navigation.navigate('Help') },
      ],
    );
  }, [navigation]);

  const handleSignOutThisDevice = useCallback(() => {
    Alert.alert('Sign out on this device?', 'This will end your current session on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut]);

  const enabledCount = useMemo(() => Object.values(settings).filter(Boolean).length, [settings]);
  const summary = useMemo(() => getProtectionSummary(settings, permissionState), [permissionState, settings]);

  const permissionStatusText = useMemo(() => {
    if (permissionState === 'enabled') return 'Enabled';
    if (permissionState === 'disabled') return 'Blocked';
    return 'Managed by phone';
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
        label: 'Phone alerts',
        value: permissionStatusText,
      },
    ],
    [permissionStatusText, profile?.created_at, profile?.email, profile?.id],
  );

  const actionItems = useMemo(
    () => [
      {
        icon: 'document-text-outline' as const,
        title: 'Privacy policy',
        text: 'Read the current privacy summary and your rights.',
        onPress: () => navigation.navigate('TermsPolicy', { section: 'privacy' }),
      },
      {
        icon: 'download-outline' as const,
        title: 'Request account data',
        text: 'Start a support-assisted export request.',
        onPress: handleRequestDataExport,
      },
      {
        icon: 'trash-outline' as const,
        title: 'Request account deletion',
        text: 'Route a deletion request through support.',
        destructive: true,
        onPress: handleRequestDeletion,
      },
    ],
    [handleRequestDataExport, handleRequestDeletion, navigation],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your privacy controls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <PrivacyHeader onBack={() => navigation.goBack()} />

        <PrivacySummaryCard
          enabledCount={enabledCount}
          permissionState={permissionState}
          settings={settings}
          summary={summary}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account details</Text>
            <Text style={styles.cardDescription}>Basic information tied to your current session.</Text>
          </View>

          <View style={styles.infoList}>
            {accountRows.map((row, index) => (
              <View key={row.label} style={[styles.infoRow, index < accountRows.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={row.icon} size={17} color="#2563EB" />
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
              styles.buttonSecondary,
              pressed && !isOpeningSettings && styles.pressed,
              isOpeningSettings && styles.buttonDisabled,
            ]}
            onPress={() => void handleOpenPhoneSettings()}
          >
            {isOpeningSettings ? (
              <ActivityIndicator size="small" color="#F8FAFC" />
            ) : (
              <>
                <Ionicons name="settings-outline" size={16} color="#F8FAFC" />
                <Text style={styles.buttonSecondaryText}>Manage phone permissions</Text>
              </>
            )}
          </Pressable>
        </View>

        {PRIVACY_SECTIONS.map((section) => (
          <PrivacySettingsSection
            key={section.title}
            description={section.description}
            items={section.items}
            onToggle={handleToggleSetting}
            permissionState={permissionState}
            settings={settings}
            title={section.title}
          />
        ))}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your data</Text>
            <Text style={styles.cardDescription}>
              Open the privacy policy or start support-assisted account requests.
            </Text>
          </View>

          <PrivacyActionList items={actionItems} />
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Session control</Text>
          <Text style={styles.footerText}>
            If you no longer trust this device, sign out to remove local access to your account.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
            onPress={handleSignOutThisDevice}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.signOutText}>Sign out on this device</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

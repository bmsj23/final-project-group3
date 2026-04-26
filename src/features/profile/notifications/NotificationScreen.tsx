import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { fetchOrganizerNotifications } from '../../notifications/api';
import { openNotificationSettings, requestNotificationPermission } from '../../notifications/service';
import type { NotificationSummary } from '../../notifications/types';
import { NotificationActivitySection } from './NotificationActivitySection';
import { NotificationHeader } from './NotificationHeader';
import { NotificationPermissionCard } from './NotificationPermissionCard';
import { NotificationSummaryCard } from './NotificationSummaryCard';
import { getNotificationPermissionState, STORAGE_KEY, type PermissionState } from './notificationScreen.shared';
import { styles } from './notificationScreen.styles';

type NotificationScreenProps = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationScreen({ navigation }: NotificationScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPermissionLoading, setIsPermissionLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!profile) {
        return;
      }

      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const { data, error } = await fetchOrganizerNotifications(profile.id);
        if (error) throw error;
        setNotifications(data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load notifications right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profile],
  );

  const syncPermissionState = useCallback(async () => {
    try {
      const [storedState, currentState] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        getNotificationPermissionState(),
      ]);

      if (storedState === 'granted' || storedState === 'blocked' || storedState === 'dismissed') {
        setPermissionState(currentState === 'granted' ? 'granted' : storedState === 'granted' ? 'granted' : 'blocked');
      } else {
        setPermissionState(currentState);
      }
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (isGuest) {
      setIsBootstrapping(false);
      return;
    }

    void syncPermissionState();
  }, [isGuest, syncPermissionState]);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest && profile) {
        void syncPermissionState();

        if (!hasFetched.current) {
          hasFetched.current = true;
          void loadNotifications();
        } else {
          void loadNotifications(true);
        }
      }
    }, [isGuest, loadNotifications, profile, syncPermissionState]),
  );

  const handleRequestPermission = useCallback(() => {
    void (async () => {
      setIsPermissionLoading(true);

      try {
        const nextState = await requestNotificationPermission();
        setPermissionState(nextState);
        await AsyncStorage.setItem(STORAGE_KEY, nextState);

        if (nextState === 'blocked') {
          Alert.alert(
            'Notifications blocked',
            'Enable notifications in your device settings to receive organizer alerts.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void openNotificationSettings() },
            ],
          );
        }
      } finally {
        setIsPermissionLoading(false);
      }
    })();
  }, []);

  const handleManageSettings = useCallback(() => {
    void openNotificationSettings();
  }, []);

  const handleOpenNotification = useCallback(
    (item: NotificationSummary) => {
      if (item.eventId) {
        navigation.navigate('EventDetail', { eventId: item.eventId });
      }
    },
    [navigation],
  );

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.root} edges={[]}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Preparing your notification center...</Text>
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
        refreshControl={
          !isGuest ? (
            <RefreshControl
              onRefresh={() => {
                hasFetched.current = false;
                void syncPermissionState();
                void loadNotifications(true);
              }}
              refreshing={isRefreshing}
              tintColor="#2563EB"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <NotificationHeader onBack={() => navigation.goBack()} />

        {isGuest ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <Ionicons name="notifications-outline" size={28} color="#1D4ED8" />
            </View>
            <Text style={styles.guestTitle}>Organizer notifications</Text>
            <Text style={styles.guestText}>
              Sign in to view attendee registration updates and manage alert permissions for your events.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              style={({ pressed }) => [styles.buttonPrimary, styles.fullWidthButton, pressed && styles.pressed]}
            >
              <Ionicons name="log-in-outline" size={18} color="#F8FAFC" />
              <Text style={styles.buttonPrimaryText}>Sign in to continue</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <NotificationSummaryCard notifications={notifications} permissionState={permissionState} />

            <NotificationPermissionCard
              isSubmitting={isPermissionLoading}
              onManageSettings={handleManageSettings}
              onRequestPermission={handleRequestPermission}
              permissionState={permissionState}
            />

            <NotificationActivitySection
              errorMessage={errorMessage}
              isLoading={isLoading}
              notifications={notifications}
              onOpenNotification={handleOpenNotification}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

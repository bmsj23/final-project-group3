import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

let isConfigured = false;
let channelReady: Promise<void> | null = null;

export type NotificationPermissionState = 'granted' | 'blocked';

export function configureNotifications() {
  if (isConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  isConfigured = true;
}

async function ensureNotificationChannel() {
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 150, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).then(() => undefined);
  }

  await channelReady;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    await ensureNotificationChannel();
    return 'granted';
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  if (requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    await ensureNotificationChannel();
    return 'granted';
  }

  return 'blocked';
}

export async function openNotificationSettings() {
  await Linking.openSettings();
}

export async function notifyEventCreated(eventTitle: string) {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Event created successfully',
      body: `${eventTitle} is now live. We will notify you when attendees register.`,
      sound: 'default',
      data: {
        type: 'event_created',
        eventTitle,
      },
    },
    trigger: null,
  });

  return true;
}

import * as Notifications from 'expo-notifications';

export type PermissionState = 'unknown' | 'granted' | 'blocked';

export const STORAGE_KEY = 'notifications.permission.prompted';

export async function getNotificationPermissionState(): Promise<PermissionState> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }

  return 'blocked';
}

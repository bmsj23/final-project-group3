import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';

export type PermissionState = 'enabled' | 'disabled' | 'unsupported';

export type PrivacySettings = {
  personalizedRecommendations: boolean;
  analyticsSharing: boolean;
};

export type SettingKey = keyof PrivacySettings;

export type PrivacySettingItem = {
  key: SettingKey;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
};

export const STORAGE_KEY = '@eventure/privacy-settings';

export const DEFAULT_SETTINGS: PrivacySettings = {
  personalizedRecommendations: true,
  analyticsSharing: true,
};

export const PRIVACY_SECTIONS: Array<{
  title: string;
  description: string;
  items: PrivacySettingItem[];
}> = [
  {
    title: 'Experience',
    description: 'Choose how Eventure tailors the app around your activity.',
    items: [
      {
        key: 'personalizedRecommendations',
        icon: 'sparkles-outline',
        title: 'Personalized suggestions',
        description: 'Use your activity to improve event recommendations.',
      },
      {
        key: 'analyticsSharing',
        icon: 'bar-chart-outline',
        title: 'Usage analytics',
        description: 'Share app diagnostics that help improve reliability.',
      },
    ],
  },
];

export function formatDateLabel(value: string | undefined) {
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

export function getProtectionSummary(settings: PrivacySettings, permissionState: PermissionState) {
  const score = [
    settings.analyticsSharing === false,
    permissionState !== 'disabled',
  ].filter(Boolean).length;

  if (score >= 2) {
    return {
      label: 'Strong',
      text: 'Your account sharing is restrained and your device permissions are in a good state.',
      tone: '#16A34A',
      bg: 'rgba(22,163,74,0.12)',
    };
  }

  if (score >= 1) {
    return {
      label: 'Balanced',
      text: 'Your setup is decent, but you can still tighten a few privacy choices.',
      tone: '#D97706',
      bg: 'rgba(217,119,6,0.12)',
    };
  }

  return {
    label: 'Open',
    text: 'Review your sharing and alert settings if you want a more private setup.',
    tone: '#DC2626',
    bg: 'rgba(220,38,38,0.12)',
  };
}

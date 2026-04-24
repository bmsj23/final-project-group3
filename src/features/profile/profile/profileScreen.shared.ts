import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';

export type ProfileMenuAction = 'notifications' | 'privacy' | 'help';

export type ProfileMenuItem = {
  id: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  action: ProfileMenuAction;
};

export const MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: 'notifications',
    icon: 'notifications',
    label: 'Notifications',
    sublabel: 'Manage your alerts',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
    action: 'notifications',
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark',
    label: 'Privacy & Security',
    sublabel: 'Control your data',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    action: 'privacy',
  },
  {
    id: 'help',
    icon: 'help-circle',
    label: 'Help & Support',
    sublabel: 'FAQs and contact',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.1)',
    action: 'help',
  },
];

export function formatMemberSince(isoDate: string | undefined) {
  if (!isoDate) return 'Recently';

  const date = new Date(isoDate);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

export function getRoleMeta(role: string | undefined, isGuest: boolean) {
  if (isGuest) {
    return { label: 'Guest', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  }

  if (role === 'admin') {
    return { label: 'Admin', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' };
  }

  return { label: 'Organizer', color: '#34D399', bg: 'rgba(52,211,153,0.12)' };
}

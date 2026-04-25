export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const SUPPORT_EMAIL = 'support@eventure.app';
export const SUPPORT_PHONE = '+63 917 800 8388';
export const SUPPORT_PHONE_LINK = 'tel:+639178008388';

export const FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: 'account-access',
    question: 'I cannot access my account.',
    answer:
      'Check your internet connection, confirm you are using the correct email, and try signing in again. If the issue continues, contact support with your account email and a short description of what happened.',
  },
  {
    id: 'notifications',
    question: 'Why are notifications not arriving?',
    answer:
      'Check both your phone notification permission and the in-app notification settings. On Android, phone-level permissions can block alerts even when app toggles are enabled.',
  },
  {
    id: 'booking-help',
    question: 'I need help with a booking or event change.',
    answer:
      'Include the event title, event date, and the email used for the booking when contacting support. A screenshot also helps the team investigate faster.',
  },
];

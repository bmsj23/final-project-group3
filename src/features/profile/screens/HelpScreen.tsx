import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type HelpScreenProps = NativeStackScreenProps<AppStackParamList, 'Help'>;

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const SUPPORT_EMAIL = 'support@eventure.app';
const SUPPORT_PHONE = '+63 917 800 8388';
const SUPPORT_PHONE_LINK = 'tel:+639178008388';
const SUPPORT_HOURS = 'Mon-Fri, 9:00 AM-6:00 PM (PH time)';
const FIRST_RESPONSE_TARGET = 'First response in under 24 hours';

const SUPPORT_CHANNELS = [
  {
    id: 'email',
    icon: 'mail-outline' as const,
    title: 'Email support',
    text: 'Best for account issues, event concerns, and detailed follow-up requests.',
    cta: 'Send email',
  },
  {
    id: 'call',
    icon: 'call-outline' as const,
    title: 'Support line',
    text: 'Use the phone line for urgent organizer issues or time-sensitive event disruptions.',
    cta: 'Call support',
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark-outline' as const,
    title: 'Privacy and legal requests',
    text: 'Review privacy rights, terms, and support-assisted data requests.',
    cta: 'Open policy tools',
  },
] as const;

const ISSUE_SHORTCUTS = [
  {
    id: 'notifications',
    icon: 'notifications-outline' as const,
    title: 'Notifications not working',
    text: 'Review device permission and in-app notification controls.',
    tone: '#2563EB',
    bg: '#EFF6FF',
    action: 'notifications' as const,
  },
  {
    id: 'privacy',
    icon: 'lock-closed-outline' as const,
    title: 'Privacy and account safety',
    text: 'Adjust visibility, security settings, and request privacy support.',
    tone: '#0F766E',
    bg: '#ECFEFF',
    action: 'privacy' as const,
  },
  {
    id: 'bookings',
    icon: 'ticket-outline' as const,
    title: 'Bookings and confirmations',
    text: 'Get help with booking records, confirmations, or event changes.',
    tone: '#EA580C',
    bg: '#FFF7ED',
    action: 'booking' as const,
  },
  {
    id: 'organizer',
    icon: 'megaphone-outline' as const,
    title: 'Organizer and event listing help',
    text: 'Reach support for publishing issues, event edits, or organizer concerns.',
    tone: '#7C3AED',
    bg: '#F5F3FF',
    action: 'organizer' as const,
  },
] as const;

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'account-access',
    question: 'I cannot access my account. What should I do first?',
    answer:
      'Double-check the email you used to sign up, make sure your internet connection is stable, and try signing in again. If the issue continues, contact support and include your account email plus a short description of what happened.',
  },
  {
    id: 'event-change',
    question: 'How do I handle a changed or cancelled event?',
    answer:
      'Open the event details and review the latest organizer update. If your booking confirmation no longer matches the event status, contact support with the event title, date, and a screenshot if available.',
  },
  {
    id: 'privacy-request',
    question: 'How can I request my data or account deletion?',
    answer:
      'Go through Privacy & Security for data-related requests. The current build routes export and deletion requests through support so account records and compliance checks can be reviewed safely.',
  },
  {
    id: 'notification-troubleshooting',
    question: 'Why are push notifications not arriving?',
    answer:
      'Check both device notification permission and your in-app notification settings. Android may block alerts at the system level even when app toggles are enabled.',
  },
];

async function openExternalLink(url: string, fallbackTitle: string, fallbackText: string) {
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert(fallbackTitle, fallbackText);
    return;
  }

  await Linking.openURL(url);
}

export function HelpScreen({ navigation }: HelpScreenProps) {
  const { profile } = useAppSession();
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const supportEmailLink = useMemo(() => {
    const subject = encodeURIComponent('Eventure Support Request');
    const body = encodeURIComponent(
      [
        'Hello Eventure Support,',
        '',
        'I need help with:',
        '',
        'Account email: ' + (profile?.email ?? 'Not signed in'),
        'Account ID: ' + (profile?.id ? `${profile.id.slice(0, 8)}...` : 'Unavailable'),
        '',
        'Issue details:',
      ].join('\n'),
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [profile?.email, profile?.id]);

  function handleSupportChannelPress(channelId: (typeof SUPPORT_CHANNELS)[number]['id']) {
    if (channelId === 'email') {
      void openExternalLink(
        supportEmailLink,
        'Email unavailable',
        `We could not open your mail app. Please contact ${SUPPORT_EMAIL} manually.`,
      );
      return;
    }

    if (channelId === 'call') {
      void openExternalLink(
        SUPPORT_PHONE_LINK,
        'Calling unavailable',
        `We could not open the phone dialer. Please call ${SUPPORT_PHONE} manually.`,
      );
      return;
    }

    navigation.navigate('Privacy');
  }

  function handleShortcutPress(action: (typeof ISSUE_SHORTCUTS)[number]['action']) {
    if (action === 'notifications') {
      navigation.navigate('Notifications');
      return;
    }

    if (action === 'privacy') {
      navigation.navigate('Privacy');
      return;
    }

    if (action === 'booking') {
      Alert.alert(
        'Booking help',
        'Include your event title, event date, and the email used for the booking when contacting support so the team can trace your record faster.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Email Support', onPress: () => handleSupportChannelPress('email') },
        ],
      );
      return;
    }

    Alert.alert(
      'Organizer help',
      'For event listing or organizer account concerns, contact support with the event title, issue summary, and any screenshots that show the problem.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => handleSupportChannelPress('call') },
        { text: 'Email Support', onPress: () => handleSupportChannelPress('email') },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#050816', '#0C1731', '#16284D']}
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
            <Text style={styles.eyebrow}>Support desk</Text>
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.subtitle}>
              Find quick answers, contact the support team, and route account or event concerns to the right place.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="headset-outline" size={22} color="#F97316" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Support line and response guide</Text>
              <Text style={styles.heroSubtitle}>{FIRST_RESPONSE_TARGET}</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            Use email for detailed account cases and the support line for urgent event issues that need immediate
            attention during operating hours.
          </Text>

          <View style={styles.supportMeta}>
            <View style={styles.metaPill}>
              <Ionicons name="call-outline" size={15} color="#FDBA74" />
              <Text style={styles.metaPillText}>{SUPPORT_PHONE}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={15} color="#FDBA74" />
              <Text style={styles.metaPillText}>{SUPPORT_HOURS}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Contact support</Text>
            <Text style={styles.sectionDescription}>
              Choose the fastest path based on the kind of issue you need help with.
            </Text>
          </View>

          <View style={styles.channelList}>
            {SUPPORT_CHANNELS.map((channel) => (
              <Pressable
                key={channel.id}
                accessibilityRole="button"
                style={({ pressed }) => [styles.channelCard, pressed && styles.channelPressed]}
                onPress={() => handleSupportChannelPress(channel.id)}
              >
                <View style={styles.channelIconWrap}>
                  <Ionicons name={channel.icon} size={20} color="#F97316" />
                </View>
                <View style={styles.channelCopy}>
                  <Text style={styles.channelTitle}>{channel.title}</Text>
                  <Text style={styles.channelText}>{channel.text}</Text>
                  <Text style={styles.channelCta}>{channel.cta}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Common issue shortcuts</Text>
            <Text style={styles.sectionDescription}>
              Jump straight to the right screen or support path for the most common requests.
            </Text>
          </View>

          <View style={styles.shortcutGrid}>
            {ISSUE_SHORTCUTS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                style={({ pressed }) => [styles.shortcutCard, pressed && styles.shortcutPressed]}
                onPress={() => handleShortcutPress(item.action)}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.tone} />
                </View>
                <Text style={styles.shortcutTitle}>{item.title}</Text>
                <Text style={styles.shortcutText}>{item.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Frequently asked questions</Text>
            <Text style={styles.sectionDescription}>
              Quick answers for access, bookings, privacy, and notification issues.
            </Text>
          </View>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => {
              const expanded = expandedFaqId === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.faqItem,
                    index < FAQ_ITEMS.length - 1 && styles.faqItemBorder,
                    pressed && styles.faqPressed,
                  ]}
                  onPress={() => setExpandedFaqId((current) => (current === item.id ? null : item.id))}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </View>
                  {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Policy and trust</Text>
            <Text style={styles.sectionDescription}>
              Review the rules, privacy terms, and protections that apply to your account.
            </Text>
          </View>

          <View style={styles.policyActions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.policyButton, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TermsPolicy', { section: 'terms' })}
            >
              <Ionicons name="document-text-outline" size={18} color="#1D4ED8" />
              <Text style={styles.policyButtonText}>Terms of Service</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.policyButton, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TermsPolicy', { section: 'privacy' })}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#1D4ED8" />
              <Text style={styles.policyButtonText}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Before you contact support</Text>
          <Text style={styles.footerText}>
            Include your account email, event title, event date, and a short timeline of what happened. Screenshots
            help the team investigate faster and reduce follow-up delays.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050816',
  },
  glowTop: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F97316',
    opacity: 0.14,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FB923C',
    opacity: 0.12,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 18,
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
    color: '#FDBA74',
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
    color: '#CBD5E1',
  },
  heroCard: {
    backgroundColor: 'rgba(124,45,18,0.34)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.2)',
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
    backgroundColor: 'rgba(249,115,22,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFF7ED',
  },
  heroSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FDBA74',
  },
  heroText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#FED7AA',
  },
  supportMeta: {
    gap: 10,
  },
  metaPill: {
    minHeight: 46,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  metaPillText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFF7ED',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    gap: 6,
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
  channelList: {
    gap: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.md,
  },
  channelPressed: {
    opacity: 0.82,
  },
  channelIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelCopy: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#7C2D12',
  },
  channelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#9A3412',
  },
  channelCta: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#EA580C',
    marginTop: 2,
  },
  shortcutGrid: {
    gap: 12,
  },
  shortcutCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: 10,
  },
  shortcutPressed: {
    opacity: 0.82,
  },
  shortcutIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#0F172A',
  },
  shortcutText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  faqList: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    gap: 10,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  faqPressed: {
    backgroundColor: '#F8FAFC',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  policyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  policyButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  policyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#1D4ED8',
  },
  footerCard: {
    backgroundColor: 'rgba(255,247,237,0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.lg,
    gap: 6,
  },
  footerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#9A3412',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#7C2D12',
  },
});

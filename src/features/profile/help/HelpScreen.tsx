import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { HelpActionList } from './HelpActionList';
import { HelpHeader } from './HelpHeader';
import { FAQ_ITEMS, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_LINK } from './helpScreen.shared';
import { styles } from './helpScreen.styles';

type HelpScreenProps = NativeStackScreenProps<AppStackParamList, 'Help'>;

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

  const contactActions = [
    {
      icon: 'mail-outline' as const,
      title: 'Email support',
      text: 'Best for account issues, event concerns, and requests that need extra detail.',
      cta: SUPPORT_EMAIL,
      onPress: () =>
        void openExternalLink(
          supportEmailLink,
          'Email unavailable',
          `We could not open your mail app. Please contact ${SUPPORT_EMAIL} manually.`,
        ),
    },
    {
      icon: 'call-outline' as const,
      title: 'Call support',
      text: 'Use the phone line for urgent organizer or event-day issues.',
      cta: SUPPORT_PHONE,
      onPress: () =>
        void openExternalLink(
          SUPPORT_PHONE_LINK,
          'Calling unavailable',
          `We could not open the phone dialer. Please call ${SUPPORT_PHONE} manually.`,
        ),
    },
  ];

  const shortcutActions = [
    {
      icon: 'notifications-outline' as const,
      title: 'Notification help',
      text: 'Check phone permission and in-app notification settings.',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'lock-closed-outline' as const,
      title: 'Privacy & security',
      text: 'Open privacy settings, policy links, and account request actions.',
      onPress: () => navigation.navigate('Privacy'),
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <HelpHeader onBack={() => navigation.goBack()} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact support</Text>
          <Text style={styles.cardDescription}>
            Use the support channel that matches the urgency and detail of your issue.
          </Text>
          <HelpActionList items={contactActions} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick help</Text>
          <Text style={styles.cardDescription}>
            Jump straight to the screens that usually solve the most common support questions.
          </Text>

          <View style={styles.shortcutGrid}>
            {shortcutActions.map((item) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                style={({ pressed }) => [styles.shortcutCard, pressed && styles.pressed]}
                onPress={item.onPress}
              >
                <View style={styles.shortcutIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#2563EB" />
                </View>
                <Text style={styles.shortcutTitle}>{item.title}</Text>
                <Text style={styles.shortcutText}>{item.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently asked questions</Text>
          <Text style={styles.cardDescription}>
            A few quick answers before you reach out to support.
          </Text>

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Policies</Text>
          <Text style={styles.cardDescription}>
            Review the rules and privacy terms that apply to your account.
          </Text>

          <HelpActionList
            items={[
              {
                icon: 'document-text-outline',
                title: 'Terms of Service',
                text: 'Read the platform rules and account responsibilities.',
                onPress: () => navigation.navigate('TermsPolicy', { section: 'terms' }),
              },
              {
                icon: 'shield-checkmark-outline',
                title: 'Privacy Policy',
                text: 'Review how account and app data are handled.',
                onPress: () => navigation.navigate('TermsPolicy', { section: 'privacy' }),
              },
            ]}
          />
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Before you contact support</Text>
          <Text style={styles.footerText}>
            Include your account email, the event title if relevant, and a short summary of what happened so the team
            can investigate faster.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList, AuthStackParamList } from '../../../navigation/types';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type TermsPolicyScreenProps = NativeStackScreenProps<AuthStackParamList & AppStackParamList, 'TermsPolicy'>;
type LegalSectionKey = 'terms' | 'privacy';

type LegalBlock = {
  title: string;
  body: string;
};

const EFFECTIVE_DATE = 'April 20, 2026';

const HIGHLIGHTS: Record<
  LegalSectionKey,
  Array<{ icon: keyof typeof Ionicons.glyphMap; title: string; text: string }>
> = {
  terms: [
    {
      icon: 'document-text-outline',
      title: 'Fair Platform Use',
      text: 'Accounts must use accurate details and may not post harmful, fraudulent, or illegal event content.',
    },
    {
      icon: 'card-outline',
      title: 'Bookings & Payments',
      text: 'If paid experiences are enabled, charges, refunds, and organizer policies apply before entry is confirmed.',
    },
    {
      icon: 'warning-outline',
      title: 'Account Responsibility',
      text: 'You are responsible for your sign-in credentials and for activity performed through your account.',
    },
  ],
  privacy: [
    {
      icon: 'shield-checkmark-outline',
      title: 'Data We Collect',
      text: 'We process profile details, event activity, and technical information needed to operate the service securely.',
    },
    {
      icon: 'eye-outline',
      title: 'How We Use It',
      text: 'Your information helps us personalize discovery, improve reliability, and support communication around events.',
    },
    {
      icon: 'lock-closed-outline',
      title: 'Your Controls',
      text: 'You can request access, correction, or deletion of certain personal data according to applicable law.',
    },
  ],
};

const CONTENT: Record<LegalSectionKey, LegalBlock[]> = {
  terms: [
    {
      title: '1. Acceptance of Terms',
      body: 'By creating an account or using the app, you agree to these Terms and to any posted guidelines that apply to specific features, bookings, or promotional campaigns.',
    },
    {
      title: '2. Eligibility and Accounts',
      body: 'You must provide truthful account information and keep your login credentials secure. You may not impersonate another person, share access in a misleading way, or create accounts for abusive activity.',
    },
    {
      title: '3. Event Listings and User Content',
      body: 'Organizers are responsible for the accuracy, legality, timing, venue details, and safety information of their listings. You retain rights to your content, but you grant the app permission to display, promote, and distribute it inside the service as needed to operate the platform.',
    },
    {
      title: '4. Acceptable Use',
      body: 'You agree not to upload malicious code, scrape private data, disrupt service operations, harass other users, or use the platform for unlawful, deceptive, or infringing conduct.',
    },
    {
      title: '5. Payments, Cancellations, and Refunds',
      body: 'When payment features are offered, final pricing, taxes, organizer rules, refund windows, and cancellation terms are presented before checkout. Refund outcomes may depend on organizer policy, payment processor rules, and fraud review.',
    },
    {
      title: '6. Suspension and Termination',
      body: 'We may limit or remove access to accounts that violate these Terms, create safety risks, or interfere with the integrity of the app. You may stop using the service at any time.',
    },
    {
      title: '7. Liability and Service Availability',
      body: 'The app is provided on an as-available basis. We work to keep the platform reliable, but we cannot guarantee uninterrupted access, third-party organizer performance, or the outcome of every event, listing, or attendee interaction.',
    },
  ],
  privacy: [
    {
      title: '1. Information We Collect',
      body: 'We may collect your name, email address, profile details, event preferences, booking activity, device identifiers, and usage analytics needed to provide the service and protect accounts.',
    },
    {
      title: '2. How Information Is Used',
      body: 'Your information is used to create accounts, support sign-in, recommend events, send operational updates, prevent abuse, respond to support requests, and improve product performance.',
    },
    {
      title: '3. Sharing and Disclosure',
      body: 'We may share limited information with service providers, payment partners, cloud infrastructure vendors, and organizers when necessary to complete transactions, operate the app, comply with law, or enforce platform policies.',
    },
    {
      title: '4. Data Retention',
      body: 'We keep information only as long as it is reasonably necessary for service delivery, legal compliance, dispute resolution, fraud prevention, and legitimate business records.',
    },
    {
      title: '5. Security Measures',
      body: 'Administrative, technical, and organizational safeguards are used to protect personal data. Even so, no internet-based system can be guaranteed as completely secure.',
    },
    {
      title: '6. Your Privacy Choices',
      body: 'Subject to local law, you may request access to your data, ask for corrections, object to certain processing, or request deletion of eligible information by contacting support.',
    },
    {
      title: '7. Policy Updates',
      body: 'We may revise this Privacy Policy to reflect product, legal, or operational changes. Material updates will be posted in the app with a new effective date.',
    },
  ],
};

const CONTACT_COPY = {
  title: 'Questions or concerns?',
  text: 'For legal, privacy, or account-related requests, contact the Eventure support team through the help channel listed in the app settings or your official project contact email.',
};

export function TermsPolicyScreen({ navigation, route }: TermsPolicyScreenProps) {
  const section = route.params?.section ?? 'terms';

  const heroTitle = useMemo(() => (section === 'terms' ? 'Terms of Service' : 'Privacy Policy'), [section]);
  const heroSubtitle = useMemo(
    () =>
      section === 'terms'
        ? 'Clear platform rules for accounts, event publishing, bookings, and responsible use.'
        : 'A straightforward summary of how account, booking, and usage information is handled.',
    [section],
  );

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0B1733', '#12305D', '#1D4E89', '#3B82C4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#CBD5E1" />
          </Pressable>
          <Text style={styles.headerTitle}>Legal</Text>
          <View style={styles.headerGhost} />
        </View>

        <View style={styles.heroBlock}>
          <View style={styles.heroBadge}>
            <Ionicons
              name={section === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
              size={18}
              color="#60A5FA"
            />
            <Text style={styles.heroBadgeText}>Effective {EFFECTIVE_DATE}</Text>
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

          <View style={styles.tabRow}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.tabBtn,
                section === 'terms' && styles.tabBtnActive,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.setParams({ section: 'terms' })}
            >
              <Text style={[styles.tabText, section === 'terms' && styles.tabTextActive]}>Terms</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.tabBtn,
                section === 'privacy' && styles.tabBtnActive,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.setParams({ section: 'privacy' })}
            >
              <Text style={[styles.tabText, section === 'privacy' && styles.tabTextActive]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.quickRead}>
          <Text style={styles.quickReadLabel}>Quick read</Text>
          {HIGHLIGHTS[section].map((item) => (
            <View key={item.title} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Ionicons name={item.icon} size={18} color="#60A5FA" />
              </View>
              <View style={styles.highlightCopy}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.highlightText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>{section === 'terms' ? 'What this means for you' : 'How your information is handled'}</Text>
            <Text style={styles.sheetIntro}>
              {section === 'terms'
                ? 'These points explain the rules for using the platform, publishing events, and protecting accounts.'
                : 'These points explain what information is collected, why it is used, and what choices you have.'}
            </Text>
          </View>

          <View style={styles.sectionsList}>
            {CONTENT[section].map((item, index) => (
              <View key={item.title} style={styles.sectionRow}>
                <View style={styles.sectionMarkerWrap}>
                  <View style={styles.sectionMarker}>
                    <Text style={styles.sectionMarkerText}>{index + 1}</Text>
                  </View>
                  {index !== CONTENT[section].length - 1 ? <View style={styles.sectionLine} /> : null}
                </View>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  <Text style={styles.sectionBody}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.contactStrip}>
            <View style={styles.contactIcon}>
              <Ionicons name="help-buoy-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>{CONTACT_COPY.title}</Text>
              <Text style={styles.contactText}>{CONTACT_COPY.text}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  scroll: {
    paddingTop: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: 36,
    gap: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#F8FAFC',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerGhost: { width: 40 },
  heroBlock: {
    gap: spacing.md,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.18)',
  },
  heroBadgeText: {
    color: '#BFDBFE',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: '#E2E8F0',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.22)',
    backgroundColor: 'rgba(15,23,42,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#CBD5E1',
  },
  tabTextActive: {
    color: '#1E3A8A',
  },
  quickRead: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.2)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  quickReadLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#DBEAFE',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(239,246,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  highlightCopy: { flex: 1 },
  highlightTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  highlightText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#E2E8F0',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  sheetTop: {
    gap: 6,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  sheetIntro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  sectionsList: {
    gap: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  sectionMarkerWrap: {
    alignItems: 'center',
    width: 28,
  },
  sectionMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMarkerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#1D4ED8',
  },
  sectionLine: {
    flex: 1,
    width: 1,
    backgroundColor: '#DBEAFE',
    marginTop: 8,
    marginBottom: -8,
  },
  sectionContent: {
    flex: 1,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginTop: 6,
  },
  contactStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#F8FBFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: spacing.lg,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1E3A8A',
  },
  contactText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
    marginTop: 4,
  },
  pressed: { opacity: 0.8 },
});

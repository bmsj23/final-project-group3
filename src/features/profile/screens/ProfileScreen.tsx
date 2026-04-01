import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessNotice } from '../../../components/ui/AccessNotice';
import { DarkHero } from '../../../components/ui/DarkHero';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import type { AppTabScreenProps } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { useAppSession } from '../../../providers/AppSessionProvider';

type ProfileScreenProps = AppTabScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();

  return (
    <ScreenContainer bg={colors.bgDark} noPadding>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <DarkHero
          avatarInitials={profile?.full_name?.slice(0, 1) ?? undefined}
          avatarUri={profile?.avatar_url ?? null}
          eyebrow={isGuest ? 'Guest Profile' : 'Organizer Profile'}
          title={profile?.full_name ?? 'Guest Explorer'}
          subtitle={profile?.email ?? 'Browse public events now and sign in whenever you are ready to manage your account.'}
        />

        <View style={styles.body}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIdentity}>
                {profile?.avatar_url ? (
                  <Image contentFit="cover" source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons color={colors.primaryDeep} name="person" size={28} />
                  </View>
                )}
                <View style={styles.profileCopy}>
                  <Text style={styles.name}>{profile?.full_name ?? 'Guest user'}</Text>
                  <Text style={styles.role}>{profile?.role === 'admin' ? 'Platform Admin' : isGuest ? 'Guest Mode' : 'Event Organizer'}</Text>
                </View>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{profile?.is_suspended ? 'Paused' : 'Active'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile ? '1' : '0'}</Text>
                <Text style={styles.statLabel}>Account</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.role === 'admin' ? 'Admin' : isGuest ? 'Guest' : 'User'}</Text>
                <Text style={styles.statLabel}>Role</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{isGuest ? 'Browse' : 'Ready'}</Text>
                <Text style={styles.statLabel}>Access</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {isGuest ? (
                <PrimaryButton label="Sign In" onPress={() => void signOut()} variant="dark" />
              ) : (
                <PrimaryButton label="My Events" onPress={() => navigation.navigate('MyEvents')} variant="dark" />
              )}
              <PrimaryButton
                label={isGuest ? 'Explore Events' : 'Sign Out'}
                onPress={isGuest ? () => navigation.navigate('Explore') : () => void signOut()}
                variant="secondary"
              />
            </View>
          </View>

          <View style={styles.segmentRow}>
            <Text style={[styles.segmentText, styles.segmentActive]}>About</Text>
            <Text style={styles.segmentText}>Events</Text>
            <Text style={styles.segmentText}>Reviews</Text>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutBody}>
              {isGuest
                ? 'Guest mode lets you browse public events and experience the app before creating an account.'
                : 'Your profile keeps your organizer identity, current account role, and the actions you use most in one clear place.'}
            </Text>
          </View>

          {isGuest ? (
            <AccessNotice
              body="Profile editing and organizer-only actions stay locked until you sign in."
              title="Profile actions require sign-in"
            />
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bgDark,
  },
  content: {
    backgroundColor: colors.bgDark,
    flexGrow: 1,
    paddingBottom: 108,
  },
  body: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.lg,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.xl,
    ...shadows.card,
  },
  profileHeader: {
    gap: spacing.md,
  },
  profileIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgInfo,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    ...typography.caption3,
    color: colors.primaryDeep,
  },
  avatar: {
    borderRadius: radius.full,
    height: 72,
    width: 72,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  name: {
    ...typography.h5,
    color: colors.text,
    fontSize: 24,
  },
  role: {
    ...typography.body2,
    color: colors.textMuted,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xxs,
  },
  statValue: {
    ...typography.h5,
    color: colors.text,
    fontSize: 20,
  },
  statLabel: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  statDivider: {
    backgroundColor: colors.border,
    height: 36,
    width: 1,
  },
  actionRow: {
    gap: spacing.sm,
    width: '100%',
  },
  segmentRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  segmentText: {
    ...typography.body2,
    color: colors.textMuted,
    paddingBottom: spacing.sm,
  },
  segmentActive: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
    color: colors.primary,
    fontFamily: typography.caption3.fontFamily,
  },
  aboutCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.xl,
    ...shadows.card,
  },
  aboutTitle: {
    ...typography.h5,
    color: colors.text,
  },
  aboutBody: {
    ...typography.body2,
    color: colors.textMuted,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppTabScreenProps } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { fetchMyCreatedEvents } from '../../events/api';

type ProfileScreenProps = AppTabScreenProps<'Profile'>;

const MENU_ITEMS = [
  {
    id: 'notifications',
    icon: 'notifications' as const,
    label: 'Notifications',
    sublabel: 'Manage your alerts',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
    action: 'notifications' as const,
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark' as const,
    label: 'Privacy & Security',
    sublabel: 'Control your data',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    action: 'privacy' as const,
  },
  {
    id: 'help',
    icon: 'help-circle' as const,
    label: 'Help & Support',
    sublabel: 'FAQs and contact',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.1)',
    action: 'help' as const,
  },
];

function formatMemberSince(isoDate: string | undefined) {
  if (!isoDate) return 'Recently';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

function getRoleMeta(role: string | undefined, isGuest: boolean) {
  if (isGuest) return { label: 'Guest', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  if (role === 'admin') return { label: 'Admin', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' };
  return { label: 'Organizer', color: '#34D399', bg: 'rgba(52,211,153,0.12)' };
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [eventCount, setEventCount] = useState(0);
  const [isPhotoPreviewVisible, setIsPhotoPreviewVisible] = useState(false);
  const roleMeta = getRoleMeta(profile?.role, isGuest);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(avatarAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(bodyAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isGuest || !profile) {
        setEventCount(0);
        return;
      }

      void (async () => {
        const { data } = await fetchMyCreatedEvents(profile.id);
        setEventCount(data.length);
      })();
    }, [profile, isGuest]),
  );

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => void signOut(),
        },
      ],
    );
  }

  function handleMenuPress(action: string) {
    if (action === 'navigate') {
      navigation.navigate('MyEvents');
      return;
    }

    if (action === 'create') {
      navigation.navigate('CreateEvent');
      return;
    }

    if (action === 'notifications') {
      navigation.navigate('Notifications');
      return;
    }

    if (action === 'privacy') {
      navigation.navigate('Privacy');
      return;
    }

    if (action === 'help') {
      navigation.navigate('Help');
      return;
    }
  }

  const initial = profile?.full_name?.slice(0, 1)?.toUpperCase() ?? (isGuest ? 'G' : '?');

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#020617', '#0B1B3B', '#112B5C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>
              {isGuest ? 'Guest Mode' : profile?.role === 'admin' ? 'Admin' : ''}
            </Text>
          </View>

          <Animated.View
            style={[
              styles.avatarSection,
              {
                opacity: avatarAnim,
                transform: [
                  {
                    scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View profile photo"
              style={({ pressed }) => [styles.avatarPressable, pressed && styles.avatarPressed]}
              onPress={() => setIsPhotoPreviewVisible(true)}
            >
              <LinearGradient
                colors={['#0F172A', '#1D4ED8', '#60A5FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  {profile?.avatar_url ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatarImg}
                      transition={200}
                    />
                  ) : (
                    <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
            </Pressable>

            {!isGuest && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                style={({ pressed }) => [styles.activeDot, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="create-outline" size={13} color="#F8FAFC" />
              </Pressable>
            )}
          </Animated.View>

          <Text style={styles.heroName}>
            {profile?.full_name ?? (isGuest ? 'Guest Explorer' : 'Eventure User')}
          </Text>
          <Text style={styles.heroEmail}>
            {isGuest
              ? 'Sign in to build your organizer identity and personalize your profile.'
              : profile?.bio?.trim() || 'Add a short bio so people can get to know you.'}
          </Text>

          {profile?.is_suspended && (
            <View style={styles.suspendedBadge}>
              <Ionicons name="warning-outline" size={11} color="#FCA5A5" />
              <Text style={styles.suspendedText}>Suspended</Text>
            </View>
          )}

          <Animated.View
            style={[
              styles.statsRow,
              {
                opacity: statsAnim,
                transform: [
                  {
                    translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isGuest ? '-' : eventCount}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isGuest ? '-' : '0'}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {isGuest ? 'Guest' : formatMemberSince(profile?.created_at)}
              </Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.body,
            {
              opacity: bodyAnim,
              transform: [
                {
                  translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />

          {isGuest ? (
            <View style={styles.guestSection}>
              <LinearGradient
                colors={['#0B1220', '#0F172A', '#16243E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guestCard}
              >
                <Text style={styles.guestCardTitle}>You're browsing as a guest</Text>
                <Text style={styles.guestCardSub}>
                  Sign in to unlock event creation, bookings, and your personal organizer dashboard.
                </Text>
                <View style={styles.guestFeatures}>
                  {['Create Events', 'Manage Bookings', 'Organizer Dashboard'].map((feature) => (
                    <View key={feature} style={styles.guestFeatureRow}>
                      <View style={styles.guestFeatureDot} />
                      <Text style={styles.guestFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.guestSignInBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => void signOut()}
                >
                  <LinearGradient
                    colors={['#1E3A8A', '#1D4ED8', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.guestSignInGrad}
                  >
                    <Text style={styles.guestSignInText}>Sign In Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </LinearGradient>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('Explore')}
              >
                <Ionicons name="compass-outline" size={18} color={colors.primary} />
                <Text style={styles.exploreBtnText}>Continue Exploring Events</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Quick Actions</Text>
                <View style={styles.quickActions}>
                  {[
                    {
                      icon: 'calendar' as const,
                      label: 'My Events',
                      color: '#60A5FA',
                      onPress: () => navigation.navigate('MyEvents'),
                    },
                    {
                      icon: 'add-circle' as const,
                      label: 'Create',
                      color: '#34D399',
                      onPress: () => navigation.navigate('CreateEvent'),
                    },
                    {
                      icon: 'compass' as const,
                      label: 'Explore',
                      color: '#FBBF24',
                      onPress: () => navigation.navigate('Explore'),
                    },
                    {
                      icon: 'notifications' as const,
                      label: 'Alerts',
                      color: '#A78BFA',
                      onPress: () => navigation.navigate('Notifications'),
                    },
                  ].map((action) => (
                    <Pressable
                      key={action.label}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
                      onPress={action.onPress}
                    >
                      <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                        <Ionicons name={action.icon} size={22} color={action.color} />
                      </View>
                      <Text style={styles.quickActionLabel}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Account Info</Text>
                <View style={styles.infoCard}>
                  {[
                    { icon: 'mail-outline' as const, label: 'Email', value: profile?.email ?? '-' },
                    { icon: 'shield-outline' as const, label: 'Role', value: roleMeta.label },
                    {
                      icon: 'calendar-outline' as const,
                      label: 'Joined',
                      value: formatMemberSince(profile?.created_at),
                    },
                    {
                      icon: 'person-outline' as const,
                      label: 'Account ID',
                      value: `${profile?.id?.slice(0, 8) ?? '-'}...`,
                    },
                  ].map((row, index, items) => (
                    <View
                      key={row.label}
                      style={[styles.infoRow, index < items.length - 1 && styles.infoRowBorder]}
                    >
                      <View style={styles.infoIconWrap}>
                        <Ionicons name={row.icon} size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>More</Text>
                <View style={styles.menuCard}>
                  {MENU_ITEMS.map((item, index) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                        index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                      ]}
                      onPress={() => handleMenuPress(item.action)}
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon} size={18} color={item.color} />
                      </View>
                      <View style={styles.menuTextWrap}>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
                onPress={handleSignOut}
              >
                <View style={styles.signOutIconWrap}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={styles.signOutText}>Sign Out</Text>
                <Ionicons name="chevron-forward" size={16} color="#EF4444" />
              </Pressable>

              <Text style={styles.versionText}>Eventure v1.0.0 · Made with love in PH</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isPhotoPreviewVisible}
        onRequestClose={() => setIsPhotoPreviewVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsPhotoPreviewVisible(false)} />
          <View style={styles.previewShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close photo preview"
              style={({ pressed }) => [styles.previewCloseBtn, pressed && styles.previewPressed]}
              onPress={() => setIsPhotoPreviewVisible(false)}
            >
              <Ionicons name="close" size={22} color="#F8FAFC" />
            </Pressable>

            <LinearGradient
              colors={['#0F172A', '#1D4ED8', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewRing}
            >
              <View style={styles.previewInner}>
                {profile?.avatar_url ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: profile.avatar_url }}
                    style={styles.previewImage}
                    transition={200}
                  />
                ) : (
                  <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.previewFallback}>
                    <Text style={styles.previewInitial}>{initial}</Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>

            <Text style={styles.previewName}>
              {profile?.full_name ?? (isGuest ? 'Guest Explorer' : 'Eventure User')}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingTop: 46,
    paddingHorizontal: spacing.xl,
    paddingBottom: 28,
  },
  heroHeader: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  heroEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#BFDBFE',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  avatarSection: { alignItems: 'center', marginBottom: 18 },
  avatarPressable: { borderRadius: 59 },
  avatarPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  avatarRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 38,
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#F8FAFC',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  heroEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#BFDBFE',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '92%',
  },
  suspendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(127,29,29,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: 12,
  },
  suspendedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#FCA5A5' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginTop: 28,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: { width: 1, height: 46, backgroundColor: 'rgba(148,163,184,0.18)' },
  body: {
    backgroundColor: '#081225',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 12,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E3A8A',
    alignSelf: 'center',
    marginBottom: 24,
  },
  section: { paddingHorizontal: spacing.xl, marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#60A5FA',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  quickActionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#E2E8F0',
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)' },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#93C5FD',
    width: 80,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#F8FAFC',
    flex: 1,
    textAlign: 'right',
  },
  menuCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  menuItemPressed: { backgroundColor: '#16243E' },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)' },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#F8FAFC',
  },
  menuSublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#93C5FD',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: '#1F1220',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: 16,
  },
  signOutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  versionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  guestSection: { paddingHorizontal: spacing.xl, gap: spacing.md },
  guestCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.16)',
  },
  guestCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  guestCardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#93C5FD',
    lineHeight: 20,
  },
  guestFeatures: { gap: 8 },
  guestFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guestFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  guestFeatureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#CBD5E1',
  },
  guestSignInBtn: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.24)',
  },
  guestSignInGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: spacing.xs,
  },
  guestSignInText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1220',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  exploreBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.primary,
    flex: 1,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  previewShell: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
  },
  previewCloseBtn: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPressed: { opacity: 0.85 },
  previewRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 12,
  },
  previewInner: {
    width: '100%',
    height: '100%',
    borderRadius: 134,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  previewImage: { width: '100%', height: '100%' },
  previewFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 92,
    color: '#FFFFFF',
  },
  previewName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#F8FAFC',
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '../../../providers/AppSessionProvider';
import type { AppTabScreenProps } from '../../../navigation/types';
import { fetchMyCreatedEvents } from '../../events/api';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type ProfileScreenProps = AppTabScreenProps<'Profile'>;

// ─── Menu items for authenticated users ──────────────────────────────────────
const MENU_ITEMS = [
  {
    id: 'notifications',
    icon: 'notifications' as const,
    label: 'Notifications',
    sublabel: 'Manage your alerts',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
    action: 'soon' as const,
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark' as const,
    label: 'Privacy & Security',
    sublabel: 'Control your data',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    action: 'soon' as const,
  },
  {
    id: 'help',
    icon: 'help-circle' as const,
    label: 'Help & Support',
    sublabel: 'FAQs and contact',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.1)',
    action: 'soon' as const,
  },
];

// ─── Helper: format join date ─────────────────────────────────────────────────
function formatMemberSince(isoDate: string | undefined) {
  if (!isoDate) return 'Recently';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

// ─── Helper: get role label + color ──────────────────────────────────────────
function getRoleMeta(role: string | undefined, isGuest: boolean) {
  if (isGuest) return { label: 'Guest',        color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  if (role === 'admin') return { label: 'Admin', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' };
  return                       { label: 'Organizer', color: '#34D399', bg: 'rgba(52,211,153,0.12)' };
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [eventCount, setEventCount] = useState(0);
  const roleMeta = getRoleMeta(profile?.role, isGuest);

  // ─── Entrance animations ────────────────────────────────────────────────
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const bodyAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim,   { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(avatarAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(statsAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(bodyAnim,   { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Load event count when screen comes into focus ──────────────────────
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

  // ─── Sign out confirmation ──────────────────────────────────────────────
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

  // ─── Menu action handler ────────────────────────────────────────────────
  function handleMenuPress(action: string) {
    if (action === 'navigate') {
      navigation.navigate('MyEvents');
      return;
    }
    if (action === 'create') {
      navigation.navigate('CreateEvent');
      return;
    }
    if (action === 'soon') {
      Alert.alert('Coming Soon', 'This feature is being built. Stay tuned! 🚀');
    }
  }

  // ─── Avatar initial ─────────────────────────────────────────────────────
  const initial = profile?.full_name?.slice(0, 1)?.toUpperCase() ?? (isGuest ? 'G' : '?');

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />

      {/* ── Full dark background gradient ── */}
      <LinearGradient
        colors={['#060D1F', '#0F1E3D', '#0A1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Neon glow orbs (same universe as auth screens) ── */}
      <View style={styles.orbPink}   pointerEvents="none" />
      <View style={styles.orbCyan}   pointerEvents="none" />
      <View style={styles.orbPurple} pointerEvents="none" />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ══════════════ HERO SECTION ══════════════ */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [{
                translateY: heroAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }),
              }],
            },
          ]}
        >
          {/* Header row: label + settings icon */}
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>
              {isGuest ? '👋 Guest Mode' : profile?.role === 'admin' ? '⚡ Admin' : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
              onPress={() => Alert.alert('Settings', 'Settings panel coming soon! 🚀')}
            >
              <Ionicons name="settings-outline" size={20} color="#CBD5E1" />
            </Pressable>
          </View>

          {/* ── Large avatar with gradient ring ── */}
          <Animated.View
            style={[
              styles.avatarSection,
              {
                opacity: avatarAnim,
                transform: [{
                  scale: avatarAnim.interpolate({ inputRange: [0,1], outputRange: [0.8, 1] }),
                }],
              },
            ]}
          >
            {/* Gradient ring around avatar */}
            <LinearGradient
              colors={['#FF3CAC', '#784BA0', '#2B86C5']}
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
                  <LinearGradient
                    colors={['#1E3A8A', '#2563EB']}
                    style={styles.avatarFallback}
                  >
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>

            {/* Online/active indicator */}
            {!isGuest && (
              <View style={styles.activeDot}>
                <View style={styles.activeDotInner} />
              </View>
            )}
          </Animated.View>

          {/* Name + role badge */}
          <Text style={styles.heroName}>
            {profile?.full_name ?? (isGuest ? 'Guest Explorer' : 'Eventure User')}
          </Text>
          <Text style={styles.heroEmail}>{profile?.email ?? 'Browsing as guest'}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleMeta.bg, borderColor: roleMeta.color + '55' }]}>
              <View style={[styles.roleDot, { backgroundColor: roleMeta.color }]} />
              <Text style={[styles.roleBadgeText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
            </View>

            {/* Suspended warning */}
            {profile?.is_suspended && (
              <View style={styles.suspendedBadge}>
                <Ionicons name="warning-outline" size={11} color="#EF4444" />
                <Text style={styles.suspendedText}>Suspended</Text>
              </View>
            )}
          </View>

          {/* ── Stats row ── */}
          <Animated.View
            style={[
              styles.statsRow,
              {
                opacity: statsAnim,
                transform: [{
                  translateY: statsAnim.interpolate({ inputRange: [0,1], outputRange: [16, 0] }),
                }],
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isGuest ? '—' : eventCount}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isGuest ? '—' : '0'}</Text>
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

        {/* ══════════════ WHITE BODY SHEET ══════════════ */}
        <Animated.View
          style={[
            styles.body,
            {
              opacity: bodyAnim,
              transform: [{
                translateY: bodyAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }),
              }],
            },
          ]}
        >
          {/* Sheet handle */}
          <View style={styles.handle} />

          {/* ── GUEST STATE ── */}
          {isGuest ? (
            <View style={styles.guestSection}>
              {/* Guest card */}
              <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guestCard}
              >
                <View style={styles.guestCardOrb} pointerEvents="none" />
                <Text style={styles.guestCardTitle}>You're browsing as a guest</Text>
                <Text style={styles.guestCardSub}>
                  Sign in to unlock event creation, bookings, and your personal organizer dashboard.
                </Text>
                <View style={styles.guestFeatures}>
                  {['Create Events', 'Manage Bookings', 'Organizer Dashboard'].map((f) => (
                    <View key={f} style={styles.guestFeatureRow}>
                      <View style={styles.guestFeatureDot} />
                      <Text style={styles.guestFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.guestSignInBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => void signOut()}
                >
                  <LinearGradient
                    colors={['#FF3CAC', '#784BA0', '#2B86C5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.guestSignInGrad}
                  >
                    <Text style={styles.guestSignInText}>Sign In Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </LinearGradient>

              {/* Explore as guest */}
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
              {/* ── AUTHENTICATED: Quick actions ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Quick Actions</Text>
                <View style={styles.quickActions}>
                  {[
                    { icon: 'calendar' as const,   label: 'My Events',    color: '#60A5FA', onPress: () => navigation.navigate('MyEvents')    },
                    { icon: 'add-circle' as const,  label: 'Create',       color: '#34D399', onPress: () => navigation.navigate('CreateEvent') },
                    { icon: 'compass' as const,     label: 'Explore',      color: '#FBBF24', onPress: () => navigation.navigate('Explore')     },
                    { icon: 'notifications' as const, label: 'Alerts',     color: '#A78BFA', onPress: () => Alert.alert('Coming Soon', 'Notifications coming soon! 🔔') },
                  ].map((action) => (
                    <Pressable
                      key={action.label}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
                      onPress={action.onPress}
                    >
                      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                        <Ionicons name={action.icon} size={22} color={action.color} />
                      </View>
                      <Text style={styles.quickActionLabel}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── Account info card ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Account Info</Text>
                <View style={styles.infoCard}>
                  {[
                    { icon: 'mail-outline' as const,    label: 'Email',       value: profile?.email ?? '—'                },
                    { icon: 'shield-outline' as const,   label: 'Role',        value: roleMeta.label                       },
                    { icon: 'calendar-outline' as const, label: 'Joined',      value: formatMemberSince(profile?.created_at) },
                    { icon: 'person-outline' as const,   label: 'Account ID',  value: (profile?.id?.slice(0, 8) ?? '—') + '...' },
                  ].map((row, i, arr) => (
                    <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                      <View style={styles.infoIconWrap}>
                        <Ionicons name={row.icon} size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── Menu items ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>More</Text>
                <View style={styles.menuCard}>
                  {MENU_ITEMS.map((item, i) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                        i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
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
                      {item.action === 'soon' ? (
                        <View style={styles.soonPill}>
                          <Text style={styles.soonText}>Soon</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── Sign out button ── */}
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

              {/* App version footer */}
              <Text style={styles.versionText}>Eventure v1.0.0 · Made with ❤️ in PH</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#060D1F' },

  scroll: { flexGrow: 1 },

  // ── Orbs ──────────────────────────────────────────────────────────────────
  orbPink: {
    position: 'absolute', top: -60, left: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#FF3CAC', opacity: 0.10,
  },
  orbCyan: {
    position: 'absolute', top: 100, right: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#00F5FF', opacity: 0.07,
  },
  orbPurple: {
    position: 'absolute', top: 200, left: '30%',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#7C3AED', opacity: 0.08,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
  },

  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  heroEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52,
    padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: 98, height: 98, borderRadius: 49,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 38, color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#060D1F',
    alignItems: 'center', justifyContent: 'center',
  },
  activeDotInner: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#10B981',
  },

  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26, color: '#F1F5F9',
    letterSpacing: -0.5, textAlign: 'center',
  },
  heroEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13, color: '#475569',
    marginTop: 4, textAlign: 'center',
  },

  badgeRow: {
    flexDirection: 'row', gap: spacing.xs,
    marginTop: 12, alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.2 },
  suspendedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.full,
  },
  suspendedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#EF4444' },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xl,
    paddingVertical: 16, paddingHorizontal: spacing.xl,
    marginTop: 24, width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: 'Inter_700Bold', fontSize: 16,
    color: '#F1F5F9', letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },

  // ── White body sheet ───────────────────────────────────────────────────────
  body: {
    backgroundColor: '#FFFFFF',
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
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 24,
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: spacing.xl, marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 12,
    color: '#94A3B8', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 12,
  },

  // ── Quick actions ──────────────────────────────────────────────────────────
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 12,
    color: '#334155',
  },

  // ── Info card ──────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    gap: spacing.sm,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 13,
    color: '#64748B', width: 80,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13,
    color: '#0F172A', flex: 1, textAlign: 'right',
  },

  // ── Menu card ─────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    gap: spacing.sm,
  },
  menuItemPressed: { backgroundColor: '#F1F5F9' },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTextWrap: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14,
    color: '#0F172A',
  },
  menuSublabel: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    color: '#94A3B8',
  },
  soonPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
  },
  soonText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 10,
    color: '#D97706', letterSpacing: 0.3,
  },

  // ── Sign out ───────────────────────────────────────────────────────────────
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: '#FFF5F5',
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: '#FECACA',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: 16,
  },
  signOutIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14,
    color: '#EF4444', flex: 1,
  },

  versionText: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    color: '#CBD5E1', textAlign: 'center', marginTop: 4,
  },

  // ── Guest section ──────────────────────────────────────────────────────────
  guestSection: { paddingHorizontal: spacing.xl, gap: spacing.md },
  guestCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  guestCardOrb: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#FF3CAC', opacity: 0.1,
  },
  guestCardTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 18,
    color: '#F1F5F9', letterSpacing: -0.3,
  },
  guestCardSub: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: '#64748B', lineHeight: 20,
  },
  guestFeatures: { gap: 8 },
  guestFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guestFeatureDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FF3CAC',
  },
  guestFeatureText: {
    fontFamily: 'Inter_500Medium', fontSize: 13,
    color: '#94A3B8',
  },
  guestSignInBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: 4 },
  guestSignInGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', minHeight: 52,
    gap: spacing.xs,
  },
  guestSignInText: {
    fontFamily: 'Inter_700Bold', fontSize: 15,
    color: '#FFFFFF', letterSpacing: 0.2,
  },

  exploreBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: '#BFDBFE',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    gap: spacing.sm,
  },
  exploreBtnText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14,
    color: colors.primary, flex: 1,
  },
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { formatEventDateTime } from '../../events/formatters';
import { fetchOrganizerNotifications } from '../api';
import type { NotificationSummary, NotificationType } from '../types';

type NotificationScreenProps = NativeStackScreenProps<AppStackParamList, 'Notifications'>;
type PermissionState = 'unknown' | 'granted' | 'blocked';

const STORAGE_KEY = 'notifications.permission.prompted';

const NOTIFICATION_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  booking_confirmation: { icon: 'checkmark-circle', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  event_update: { icon: 'sparkles', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  event_reminder: { icon: 'time', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  event_registration: { icon: 'people', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
};

async function requestNotificationPermission(): Promise<PermissionState> {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'Enable Notifications',
      'Allow notifications in your device settings so you can receive attendee registration updates.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return 'blocked';
  }

  if (typeof Platform.Version === 'number' && Platform.Version < 33) {
    return 'granted';
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'blocked';
}

function NotificationCard({
  item,
  index,
  onPress,
}: {
  item: NotificationSummary;
  index: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const meta = NOTIFICATION_META[item.type] ?? NOTIFICATION_META.event_update;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      delay: index * 55,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        onPress={onPress}
      >
        <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
          <Ionicons color={meta.color} name={meta.icon} size={20} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.cardBody}>{item.body}</Text>

          <View style={styles.detailChipRow}>
            <View style={styles.detailChip}>
              <Ionicons color={colors.primary} name="calendar-outline" size={13} />
              <Text numberOfLines={1} style={styles.detailChipText}>
                {item.eventStartsAt ? formatEventDateTime(item.eventStartsAt) : 'Schedule pending'}
              </Text>
            </View>

            <View style={styles.detailChip}>
              <Ionicons color={colors.primary} name="people-outline" size={13} />
              <Text style={styles.detailChipText}>
                {item.remainingSlots ?? 0} / {item.capacity ?? 0} slots
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerRow}>
              <Ionicons color="#94A3B8" name="location-outline" size={13} />
              <Text numberOfLines={1} style={styles.footerText}>{item.eventLocation ?? 'Location pending'}</Text>
            </View>
            <Ionicons color="#CBD5E1" name="chevron-forward" size={16} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function NotificationScreen({ navigation }: NotificationScreenProps) {
  const { isGuest, profile, signOut } = useAppSession();
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(bodyAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [bodyAnim, heroAnim]);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!profile) {
        return;
      }

      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const { data, error } = await fetchOrganizerNotifications(profile.id);
        if (error) throw error;
        setNotifications(data);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to load notifications right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isGuest && profile) {
        if (!hasFetched.current) {
          hasFetched.current = true;
          void loadNotifications();
        } else {
          void loadNotifications(true);
        }
      }
    }, [isGuest, loadNotifications, profile]),
  );

  useEffect(() => {
    if (isGuest || !profile) {
      return;
    }

    void (async () => {
      const prompted = await AsyncStorage.getItem(STORAGE_KEY);
      if (prompted) {
        setPermissionState(prompted === 'granted' ? 'granted' : 'blocked');
        return;
      }

      Alert.alert(
        'Allow Event Notifications',
        'Turn on notifications to receive updates when someone registers for your event.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => {
              setPermissionState('blocked');
              void AsyncStorage.setItem(STORAGE_KEY, 'dismissed');
            },
          },
          {
            text: 'Allow',
            onPress: () => {
              void (async () => {
                const nextState = await requestNotificationPermission();
                setPermissionState(nextState);
                await AsyncStorage.setItem(STORAGE_KEY, nextState);
              })();
            },
          },
        ],
      );
    })();
  }, [isGuest, profile]);

  if (isGuest) {
    return (
      <SafeAreaView edges={[]} style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#060D1F', '#0F1E3D', '#0A1628']} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.orbBlue} />
        <View pointerEvents="none" style={styles.orbPink} />

        <View style={styles.guestWrap}>
          <View style={styles.guestIconWrap}>
            <Ionicons color="#EC4899" name="notifications" size={38} />
          </View>
          <Text style={styles.guestTitle}>Organizer Notifications</Text>
          <Text style={styles.guestSub}>
            Sign in to receive event registration updates and manage attendee activity.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
            onPress={() => void signOut()}
          >
            <LinearGradient colors={['#FF3CAC', '#784BA0', '#2B86C5']} style={styles.primaryBtnGrad}>
              <Text style={styles.primaryBtnText}>Sign In</Text>
              <Ionicons color="#fff" name="arrow-forward" size={16} />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const activeNotifications = notifications.filter((item) => item.type === 'event_registration').length;

  return (
    <SafeAreaView edges={[]} style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#070B2A', '#2B0A3C', '#230F47']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.orbBlue} />
      <View pointerEvents="none" style={styles.orbPink} />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              hasFetched.current = false;
              void loadNotifications(true);
            }}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons color="#E2E8F0" name="chevron-back" size={22} />
            </Pressable>

            <View style={styles.heroChip}>
              <Text style={styles.heroChipValue}>{notifications.length}</Text>
              <Text style={styles.heroChipLabel}>total</Text>
            </View>
          </View>

          <Text style={styles.heroEyebrow}>Organizer Alerts</Text>
          <Text style={styles.heroTitle}>Notifications</Text>
          <Text style={styles.heroSub}>
            Stay updated when attendees register and keep track of your event capacity at a glance.
          </Text>

          <View style={styles.heroStats}>
            {[
              { label: 'New', value: activeNotifications, color: '#EC4899' },
              { label: 'Updates', value: notifications.length - activeNotifications, color: '#60A5FA' },
              { label: 'Enabled', value: permissionState === 'granted' ? 1 : 0, color: '#34D399' },
            ].map((item, index, items) => (
              <View key={item.label} style={[styles.heroStatItem, index < items.length - 1 && styles.heroStatBorder]}>
                <Text style={[styles.heroStatValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.body,
            {
              opacity: bodyAnim,
              transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <View style={styles.bodyHandle} />

          <View style={styles.permissionCard}>
            <View style={styles.permissionCopy}>
              <Text style={styles.sectionLabel}>Permissions</Text>
              <Text style={styles.permissionTitle}>
                {permissionState === 'granted' ? 'Notifications are enabled' : 'Allow notifications for event updates'}
              </Text>
              <Text style={styles.permissionSub}>
                {permissionState === 'granted'
                  ? 'You are ready to receive attendee registration alerts for your events.'
                  : 'We will ask for permission so attendee activity can reach you right away.'}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.permissionBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                void (async () => {
                  const nextState = await requestNotificationPermission();
                  setPermissionState(nextState);
                  await AsyncStorage.setItem(STORAGE_KEY, nextState);
                })();
              }}
            >
              <Text style={styles.permissionBtnText}>
                {permissionState === 'granted' ? 'Review' : 'Allow'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionCaption}>{notifications.length} items</Text>
          </View>

          {isLoading ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.primary} name="hourglass-outline" size={28} />
              </View>
              <Text style={styles.emptyTitle}>Loading notifications...</Text>
              <Text style={styles.emptySub}>Checking the latest organizer activity for your events.</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Ionicons color="#EF4444" name="cloud-offline-outline" size={28} />
              </View>
              <Text style={styles.emptyTitle}>Couldn't load notifications</Text>
              <Text style={styles.emptySub}>{errorMessage}</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons color="#EC4899" name="notifications-off-outline" size={28} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                Your registration updates will appear here once attendees start joining your events.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {notifications.map((item, index) => (
                <NotificationCard
                  key={item.id}
                  index={index}
                  item={item}
                  onPress={() => {
                    if (item.eventId) {
                      navigation.navigate('EventDetail', { eventId: item.eventId });
                    }
                  }}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F' },
  scroll: { flexGrow: 1 },

  orbBlue: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#4F46E5',
    opacity: 0.16,
  },
  orbPink: {
    position: 'absolute',
    top: 140,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#EC4899',
    opacity: 0.12,
  },

  hero: {
    paddingTop: 56,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroChip: {
    backgroundColor: 'rgba(236,72,153,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
  },
  heroChipValue: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#60A5FA' },
  heroChipLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroEyebrow: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#F1F5F9',
    letterSpacing: -0.8,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginTop: 10,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
    borderRadius: radius.xl,
    paddingVertical: 14,
    marginTop: 20,
  },
  heroStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)' },
  heroStatValue: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  heroStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  body: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 16,
    paddingBottom: 44,
    minHeight: 520,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 18,
  },
  bodyHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  permissionCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionCopy: { flex: 1, gap: 4 },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  permissionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0F172A' },
  permissionSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B', lineHeight: 20 },
  permissionBtn: {
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  permissionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 14,
  },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#0F172A' },
  sectionCaption: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#94A3B8' },

  list: { paddingHorizontal: layout.screenPaddingH, gap: spacing.md },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.26)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#312E81',
    lineHeight: 22,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EC4899',
  },
  cardBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  detailChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  detailChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#475569' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#94A3B8', flex: 1 },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 44,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#0F172A', textAlign: 'center' },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
    gap: 16,
  },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(236,72,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, color: '#F1F5F9', letterSpacing: -0.5 },
  guestSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', width: '100%', marginTop: 8 },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: spacing.xs,
  },
  primaryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});

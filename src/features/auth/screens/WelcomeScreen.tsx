import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_NAME } from '../../../constants/app';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// ─── Event pill tags floating in the hero ────────────────────────────────────
const TAGS = [
  { label: '#music',    color: '#FF3CAC', bg: 'rgba(255,60,172,0.15)',  rotate: '-8deg',  top: '48%',  left: '6%'   },
  { label: '#techsummit', color: '#00F5FF', bg: 'rgba(0,245,255,0.12)', rotate: '5deg',   top: '8%',   right: '4%'  },
  { label: '#campus',   color: '#FFEA00', bg: 'rgba(255,234,0,0.13)',   rotate: '-3deg',  top: '28%',  right: '8%'  },
  { label: '#free 🎉',  color: '#7CFF6B', bg: 'rgba(124,255,107,0.12)', rotate: '7deg',   top: '38%',  right: '15%'   },
  { label: '#tonight',  color: '#FF8C42', bg: 'rgba(255,140,66,0.14)',  rotate: '-5deg',  top: '50%',  right: '5%'  },
];

// ─── Stat counters displayed mid-screen ──────────────────────────────────────
const STATS = [
  { value: '240+', label: 'events' },
  { value: '5k+',  label: 'people' },
  { value: '🔥',    label: 'live now' },
];

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { continueAsGuest } = useAppSession();

  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const tag1     = useRef(new Animated.Value(0)).current;
  const tag2     = useRef(new Animated.Value(0)).current;
  const tag3     = useRef(new Animated.Value(0)).current;
  const tag4     = useRef(new Animated.Value(0)).current;
  const tag5     = useRef(new Animated.Value(0)).current;
  const sheetY   = useRef(new Animated.Value(80)).current;
  const sheetOp  = useRef(new Animated.Value(0)).current;

  const tagAnims = [tag1, tag2, tag3, tag4, tag5];

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.stagger(80, tagAnims.map(a =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      )),
      Animated.parallel([
        Animated.timing(sheetOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(sheetY,  { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={[]}>

      {/* ── Vivid mesh gradient background ── */}
      <LinearGradient
        colors={['#0D0015', '#120028', '#0A001F', '#130020']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Neon glow blobs ── */}
      <View style={styles.blobPink}   pointerEvents="none" />
      <View style={styles.blobCyan}   pointerEvents="none" />
      <View style={styles.blobYellow} pointerEvents="none" />

      {/* ── Subtle dot-grid texture ── */}
      <View style={styles.dotGrid} pointerEvents="none" />

      {/* ══ HERO AREA ══ */}
      <Animated.View
        style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
      >
        {/* App name — chunky display style */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={['#FF3CAC', '#784BA0', '#2B86C5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoPill}
          >
            <Text style={styles.logoText}>{APP_NAME.toUpperCase()}</Text>
          </LinearGradient>

          {/* Live pulse dot */}
          <View style={styles.livePill}>
            <View style={styles.livePulse} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        </View>

        {/* BIG headline — editorial stacked type */}
        <View style={styles.headlineBlock}>
  <Text style={styles.h1}>YOUR NEXT</Text>
  <View style={styles.h2Row}>
    {/* "EVENT" stroke effect — outline + fill layers stacked */}
    <View style={styles.strokeWrap}>
      <Text style={[styles.h2StrokeBase, styles.h2StrokeOutline]}>EVENT</Text>
      <Text style={[styles.h2StrokeBase, styles.h2StrokeFill]}>EVENT</Text>
    </View>
    <Text style={styles.h2Solid}> IS</Text>
  </View>
  <Text style={styles.h3Accent}>RIGHT HERE ✦</Text>
</View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ── Floating tag pills scattered across the dark area ── */}
      {TAGS.map((tag, i) => (
        <Animated.View
          key={tag.label}
          pointerEvents="none"
          style={[
            styles.floatingTag,
            {
              backgroundColor: tag.bg,
              borderColor: tag.color + '55',
              top: tag.top as any,
              ...(tag.left  ? { left:  tag.left  as any } : {}),
              ...(tag.right ? { right: tag.right as any } : {}),
              transform: [
                { rotate: tag.rotate as any },
                { scale: tagAnims[i] },
              ],
              opacity: tagAnims[i],
            },
          ]}
        >
          <Text style={[styles.floatingTagText, { color: tag.color }]}>{tag.label}</Text>
        </Animated.View>
      ))}

      {/* ══ BOTTOM SHEET ══ */}
      <Animated.View
        style={[
          styles.sheet,
          { opacity: sheetOp, transform: [{ translateY: sheetY }] },
        ]}
      >
        {/* Sheet drag handle */}
        <View style={styles.handle} />

        {/* Sub-headline in the sheet */}
        <Text style={styles.sheetEyebrow}>✦ discover · book · vibe ✦</Text>
        <Text style={styles.sheetHeadline}>
          Campus events,{'\n'}
          <Text style={styles.sheetHeadlineAccent}>made for you.</Text>
        </Text>

        {/* CTA buttons */}
        <View style={styles.btnStack}>

          {/* Primary — full gradient */}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('SignIn')}
          >
            <LinearGradient
              colors={['#FF3CAC', '#784BA0', '#2B86C5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnPrimaryText}>Sign In</Text>
              <View style={styles.btnArrow}>
                <Ionicons name="arrow-forward" size={16} color="#784BA0" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Secondary — dark with neon border */}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.75 }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.btnOutlineText}>Create Account</Text>
          </Pressable>

        </View>

        {/* Ghost continue as guest */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.5 }]}
          onPress={() => void continueAsGuest()}
        >
          <Text style={styles.btnGhostText}>just browsing →</Text>
        </Pressable>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#0D0015' },

  // ── Glow blobs ────────────────────────────────────────────────────────────
  blobPink: {
    position: 'absolute', top: -60, left: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#FF3CAC', opacity: 0.18,
  },
  blobCyan: {
    position: 'absolute', top: 120, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#00F5FF', opacity: 0.10,
  },
  blobYellow: {
    position: 'absolute', top: '38%', left: '30%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#FFEA00', opacity: 0.06,
  },

  // ── Dot grid overlay ──────────────────────────────────────────────────────
  dotGrid: {
    ...StyleSheet.absoluteFillObject,
    // Simulated with opacity — in production you'd use a repeating SVG pattern
    opacity: 0.03,
    backgroundColor: 'transparent',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124,255,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124,255,107,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  livePulse: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#7CFF6B',
  },
  liveLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#7CFF6B',
    letterSpacing: 2,
  },

  // ── Big editorial headline ─────────────────────────────────────────────────
  headlineBlock: {
    marginTop: spacing.md,
    gap: 0,
  },
  h1: {
  fontFamily: 'Inter_700Bold',
  fontSize: 64,     // was 52
  lineHeight: 66,   // was 54
  color: '#F0E6FF',
  letterSpacing: -2,
  marginTop: 15,
},
  h2Row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  // Outlined/stroke text effect via text shadow trick
  strokeWrap: {
  position: 'relative',
},
h2StrokeBase: {
  fontFamily: 'Inter_700Bold',
  fontSize: 52,
  lineHeight: 58,
  letterSpacing: -2,
},
h2StrokeOutline: {
  color: '#FF3CAC',
  textShadowColor: '#FF3CAC',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 4,
},
h2StrokeFill: {
  position: 'absolute',
  top: 0,
  left: 0,
  color: '#0D0015',  // match your background color exactly
},
  h2Solid: {
  fontFamily: 'Inter_700Bold',
  fontSize: 64,     // was 52
  lineHeight: 70,   // was 58
  color: '#F0E6FF',
  letterSpacing: -2,
},
  h3Accent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: '#FF3CAC',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  statItem: { alignItems: 'flex-start' },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  // ── Floating hashtag pills ─────────────────────────────────────────────────
  floatingTag: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  floatingTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 38,
    shadowColor: '#FF3CAC',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },

  sheetEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  sheetHeadline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#0D0015',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sheetHeadlineAccent: {
    color: '#784BA0',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnStack: { gap: spacing.sm, marginBottom: spacing.sm },

  btnPrimary: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  btnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  btnPrimaryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  btnOutline: {
    borderRadius: radius.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0015',
    borderWidth: 1.5,
    borderColor: 'rgba(255,60,172,0.4)',
  },
  btnOutlineText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F0E6FF',
    letterSpacing: 0.2,
  },

  btnGhost: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  btnGhostText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
});
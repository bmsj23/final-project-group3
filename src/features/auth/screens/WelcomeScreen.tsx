import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME } from '../../../constants/app';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const TAGS = [
  { label: '#music', color: '#93C5FD', bg: 'rgba(59,130,246,0.16)', rotate: '-8deg', top: '54%', left: '6%' },
  { label: '#techsummit', color: '#7DD3FC', bg: 'rgba(14,165,233,0.14)', rotate: '5deg', top: '10%', right: '4%' },
  { label: '#campus', color: '#BFDBFE', bg: 'rgba(96,165,250,0.14)', rotate: '-3deg', top: '28%', right: '8%' },
  { label: '#free', color: '#C4B5FD', bg: 'rgba(99,102,241,0.14)', rotate: '7deg', top: '39%', right: '15%' },
  { label: '#tonight', color: '#60A5FA', bg: 'rgba(37,99,235,0.14)', rotate: '-5deg', top: '53%', right: '5%' },
];

const STATS = [
  { value: '240+', label: 'events' },
  { value: '5k+', label: 'people' },
  { value: '24/7', label: 'energy' },
];

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { continueAsGuest } = useAppSession();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const sheetY = useRef(new Animated.Value(80)).current;
  const sheetOp = useRef(new Animated.Value(0)).current;
  const tagAnims = Array.from({ length: 5 }, () => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.stagger(
        80,
        tagAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        ),
      ),
      Animated.parallel([
        Animated.timing(sheetOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      ]),
    ]).start();
  }, [fadeIn, slideUp, sheetOp, sheetY, tagAnims]);

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <LinearGradient
        colors={['#020617', '#08152E', '#0B1F46', '#153A75']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobRight} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />
      <View style={styles.grid} pointerEvents="none" />

      <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <View style={styles.logoRow}>
          <LinearGradient
            colors={['#1D4ED8', '#2563EB', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoPill}
          >
            <Text style={styles.logoText}>{APP_NAME.toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.livePill}>
            <View style={styles.livePulse} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={styles.h1}>YOUR NEXT</Text>
          <View style={styles.h2Row}>
            <View style={styles.strokeWrap}>
              <Text style={[styles.h2StrokeBase, styles.h2StrokeOutline]}>EVENT</Text>
              <Text style={[styles.h2StrokeBase, styles.h2StrokeFill]}>EVENT</Text>
            </View>
            <Text style={styles.h2Solid}> IS</Text>
          </View>
          <Text style={styles.h3Accent}>RIGHT HERE</Text>
        </View>

        <Text style={styles.subcopy}>
          Discover campus moments, last-minute plans, and the events everyone is about to post on their story.
        </Text>

        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {TAGS.map((tag, index) => (
        <Animated.View
          key={tag.label}
          pointerEvents="none"
          style={[
            styles.floatingTag,
            {
              backgroundColor: tag.bg,
              borderColor: `${tag.color}55`,
              top: tag.top as never,
              ...(tag.left ? { left: tag.left as never } : {}),
              ...(tag.right ? { right: tag.right as never } : {}),
              transform: [{ rotate: tag.rotate as never }, { scale: tagAnims[index] }],
              opacity: tagAnims[index],
            },
          ]}
        >
          <Text style={[styles.floatingTagText, { color: tag.color }]}>{tag.label}</Text>
        </Animated.View>
      ))}

      <Animated.View style={[styles.sheet, { opacity: sheetOp, transform: [{ translateY: sheetY }] }]}>
        <Text style={styles.sheetEyebrow}>discover . book . vibe</Text>
        <Text style={styles.sheetHeadline}>
          Campus events,{'\n'}
          <Text style={styles.sheetHeadlineAccent}>made for your era.</Text>
        </Text>

        <View style={styles.btnStack}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.86 }]}
            onPress={() => navigation.navigate('SignIn')}
          >
            <LinearGradient
              colors={['#1E3A8A', '#1D4ED8', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnPrimaryText}>Sign In</Text>
              <View style={styles.btnArrow}>
                <Ionicons name="arrow-forward" size={16} color="#1E3A8A" />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.78 }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.btnOutlineText}>Create Account</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.55 }]}
          onPress={() => void continueAsGuest()}
        >
          <Text style={styles.btnGhostText}>Just browsing</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  blobTop: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#1D4ED8',
    opacity: 0.22,
  },
  blobRight: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#38BDF8',
    opacity: 0.12,
  },
  blobBottom: {
    position: 'absolute',
    top: '42%',
    left: '24%',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#1E3A8A',
    opacity: 0.12,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },
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
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7DD3FC',
  },
  liveLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#BFDBFE',
    letterSpacing: 2,
  },
  headlineBlock: {
    marginTop: spacing.md,
  },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 64,
    lineHeight: 66,
    color: '#EFF6FF',
    letterSpacing: -2,
    marginTop: 15,
  },
  h2Row: { flexDirection: 'row', alignItems: 'baseline' },
  strokeWrap: { position: 'relative' },
  h2StrokeBase: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -2,
  },
  h2StrokeOutline: {
    color: '#60A5FA',
    textShadowColor: '#60A5FA',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  h2StrokeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: '#020617',
  },
  h2Solid: {
    fontFamily: 'Inter_700Bold',
    fontSize: 64,
    lineHeight: 70,
    color: '#EFF6FF',
    letterSpacing: -2,
  },
  h3Accent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: '#93C5FD',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subcopy: {
    marginTop: 16,
    maxWidth: '88%',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#BFDBFE',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(8,21,46,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#93C5FD',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
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
  sheet: {
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 38,
    borderTopWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E3A8A',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#7DD3FC',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  sheetHeadline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#F8FAFC',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sheetHeadlineAccent: {
    color: '#60A5FA',
  },
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239,246,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderRadius: radius.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111C35',
    borderWidth: 1.5,
    borderColor: 'rgba(96,165,250,0.28)',
  },
  btnOutlineText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  btnGhost: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  btnGhostText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#93C5FD',
    letterSpacing: 0.2,
  },
});

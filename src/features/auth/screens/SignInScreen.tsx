import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import type { AuthFormErrors, SignInFormValues } from '../types';
import { isValidEmail } from '../validation';

type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

// Floating vibe tags scattered in the hero
const VIBE_TAGS = [
  { label: '🎵 music',    color: '#FF3CAC', bg: 'rgba(255,60,172,0.15)',  rotate: '-7deg',  top: '35%', right: '9%'   },
  { label: '⚡ live now', color: '#00F5FF', bg: 'rgba(0,245,255,0.12)',   rotate: '4deg',   top: '7%',  right: '3%'  },
  { label: '🎟 free entry', color: '#FFEA00', bg: 'rgba(255,234,0,0.13)', rotate: '-4deg',  top: '26%', right: '6%'  },
  { label: '🔥 trending',  color: '#7CFF6B', bg: 'rgba(124,255,107,0.12)',rotate: '6deg',   top: '35%', left: '3%'   },
  { label: '📍 near you',  color: '#FF8C42', bg: 'rgba(255,140,66,0.14)', rotate: '-5deg',  top: '15%', right: '4%'  },
];

const STATS = [
  { value: '240+', label: 'events'   },
  { value: '5k+',  label: 'people'   },
  { value: '🔥',   label: 'live now' },
];

export function SignInScreen({ navigation }: SignInScreenProps) {
  const { clearError, errorMessage, signIn } = useAppSession();

  const [values, setValues]             = useState<SignInFormValues>({ email: '', password: '' });
  const [errors, setErrors]             = useState<AuthFormErrors<keyof SignInFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);

  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const tag1     = useRef(new Animated.Value(0)).current;
  const tag2     = useRef(new Animated.Value(0)).current;
  const tag3     = useRef(new Animated.Value(0)).current;
  const tag4     = useRef(new Animated.Value(0)).current;
  const tag5     = useRef(new Animated.Value(0)).current;
  const sheetY   = useRef(new Animated.Value(80)).current;
  const sheetOp  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function updateValue<K extends keyof SignInFormValues>(key: K, val: SignInFormValues[K]) {
    setValues((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate() {
    const next: AuthFormErrors<keyof SignInFormValues> = {};
    if (!isValidEmail(values.email)) next.email    = 'Enter a valid email address.';
    if (!values.password.trim())     next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    clearError();
    if (!isSupabaseConfigured) {
      setErrors({ password: 'App is not connected to a server. Contact your admin.' });
      triggerShake();
      return;
    }
    if (!validate()) { triggerShake(); return; }
    setIsSubmitting(true);
    try {
      await signIn(values);
    } catch (error) {
      triggerShake();
      setErrors((p) => ({
        ...p,
        password: error instanceof Error ? error.message : 'Unable to sign in. Try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Reset Password',
      "We'll send a reset link to your email address.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => {
            if (!isValidEmail(values.email)) {
              Alert.alert('Heads up', 'Enter your email above first, then tap Forgot Password.');
              return;
            }
            Alert.alert('Link Sent ✓', `Check your inbox at ${values.email}`);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>

      {/* Deep purple-black mesh gradient */}
      <LinearGradient
        colors={['#0D0015', '#120028', '#0A001F', '#130020']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Neon glow blobs */}
      <View style={styles.blobPink}   pointerEvents="none" />
      <View style={styles.blobCyan}   pointerEvents="none" />
      <View style={styles.blobYellow} pointerEvents="none" />

      {/* Floating vibe tags */}
      {VIBE_TAGS.map((tag, i) => (
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

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={styles.layout}>

          {/* ══ HERO ══ */}
          <Animated.View
            style={[
              styles.hero,
              { opacity: fadeIn, transform: [{ translateY: slideUp }] },
            ]}
          >
            {/* Back button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.55 }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={20} color="#CBD5E1" />
            </Pressable>

            

            {/* Big editorial headline */}
            <View style={styles.headlineBlock}>
              <Text style={styles.h1}>WELCOME</Text>
              <View style={styles.h2Row}>
                {/* Stroke "BACK" effect */}
                <View style={styles.strokeWrap}>
                  <Text style={[styles.h2StrokeBase, styles.h2StrokeOutline]}>BACK</Text>
                  <Text style={[styles.h2StrokeBase, styles.h2StrokeFill]}>BACK</Text>
                </View>
                <Text style={styles.h2Solid}> TO IT</Text>
              </View>
              <Text style={styles.h3Accent}>sign in ✦</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ══ BOTTOM SHEET ══ */}
          <Animated.View
            style={[
              styles.sheet,
              { opacity: sheetOp, transform: [{ translateY: sheetY }] },
            ]}
          >
            <View style={styles.handle} />

            <ScrollView
              contentContainerStyle={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Sheet heading */}
              <View style={styles.sheetHead}>
                <View style={styles.lockCircle}>
                  <Ionicons name="flash" size={22} color="#784BA0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>hey, you're back 👋</Text>
                  <Text style={styles.sheetSub}>your events are waiting</Text>
                </View>
              </View>

              {/* Global error banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form with shake */}
              <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>

                {/* Email */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Email address</Text>
                  <View style={[styles.inputShell, errors.email ? styles.inputError : null]}>
                    <View style={[styles.inputIcon, errors.email ? styles.inputIconError : null]}>
                      <Ionicons
                        name="mail-outline"
                        size={17}
                        color={errors.email ? colors.error : '#784BA0'}
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      value={values.email}
                      onChangeText={(v) => updateValue('email', v)}
                      onFocus={clearError}
                      placeholder="you@example.com"
                      placeholderTextColor="#B0BFCD"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                    {values.email.length > 3 && isValidEmail(values.email) && (
                      <View style={styles.validIcon}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </View>
                  {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={[styles.inputShell, errors.password ? styles.inputError : null]}>
                    <View style={[styles.inputIcon, errors.password ? styles.inputIconError : null]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={17}
                        color={errors.password ? colors.error : '#784BA0'}
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      value={values.password}
                      onChangeText={(v) => updateValue('password', v)}
                      onFocus={clearError}
                      placeholder="Enter your password"
                      placeholderTextColor="#B0BFCD"
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={() => void handleSubmit()}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword(v => !v)}
                      hitSlop={10}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color="#94A3B8"
                      />
                    </Pressable>
                  </View>
                  {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
                </View>

              </Animated.View>

              {/* Remember me + Forgot */}
              <View style={styles.inlineRow}>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: rememberMe }}
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(v => !v)}
                >
                  <View style={[styles.toggle, rememberMe && styles.toggleOn]}>
                    <View style={[styles.knob, rememberMe && styles.knobRight]} />
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>
                <Pressable onPress={handleForgotPassword} hitSlop={8}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </View>

              {/* Sign In button */}
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.88 },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={() => void handleSubmit()}
              >
                <LinearGradient
                  colors={['#FF3CAC', '#784BA0', '#2B86C5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {isSubmitting ? (
                    <>
                      <View style={styles.dotsRow}>
                        {[0, 1, 2].map(i => <View key={i} style={styles.dot} />)}
                      </View>
                      <Text style={styles.btnLabel}>Signing in…</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.btnLabel}>Let's Go →</Text>
                      <View style={styles.btnArrow}>
                        <Ionicons name="flash" size={16} color="#784BA0" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* OR divider */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.orLine} />
              </View>

              {/* Sign up link */}
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.signupBtn, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.signupText}>new here?</Text>
                <Text style={styles.signupLink}> create an account →</Text>
              </Pressable>

            </ScrollView>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#0D0015' },
  kav:  { flex: 1 },
  layout: { flex: 1, justifyContent: 'flex-end' },

  // Glow blobs
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

  // Floating tags
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

  // Hero — absolute so sheet slides over it
  hero: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingTop: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },

  backBtn: {
    position: 'absolute',
    top: 52, left: spacing.xl,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
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
    fontSize: 13, color: '#FFFFFF', letterSpacing: 3,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(124,255,107,0.1)',
    borderWidth: 1, borderColor: 'rgba(124,255,107,0.35)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.full,
  },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7CFF6B' },
  liveLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10, color: '#7CFF6B', letterSpacing: 2,
  },

  headlineBlock: { marginTop: 56, gap: 0 },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52, lineHeight: 54,
    color: '#F0E6FF', letterSpacing: -2,
  },
  h2Row: { flexDirection: 'row', alignItems: 'baseline' },

  // Stroke "BACK" effect
  strokeWrap: { position: 'relative' },
  h2StrokeBase: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52, lineHeight: 58, letterSpacing: -2,
  },
  h2StrokeOutline: {
    color: '#FF3CAC',
    textShadowColor: '#FF3CAC',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  h2StrokeFill: {
    position: 'absolute', top: 0, left: 0,
    color: '#0D0015',
  },

  h2Solid: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52, lineHeight: 58,
    color: '#F0E6FF', letterSpacing: -2,
  },
  h3Accent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28, lineHeight: 36,
    color: '#FF3CAC', letterSpacing: -0.5,
    marginTop: 2,
  },

  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xl },
  statItem: { alignItems: 'flex-start' },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22, color: '#FFFFFF', letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11, color: '#6B7280',
    letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1,
  },

  // Sheet
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    maxHeight: '72%',
    shadowColor: '#FF3CAC',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 4,
  },
  sheetScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 44,
    gap: spacing.lg,
  },

  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lockCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F5F0FF',
    borderWidth: 1.5, borderColor: '#DDD6FE',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 20,
    color: '#0D0015', letterSpacing: -0.4,
  },
  sheetSub: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: '#94A3B8', marginTop: 2,
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1,
    borderColor: '#FECACA', borderRadius: radius.md, padding: spacing.md,
  },
  errorBannerText: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: colors.error, flex: 1, lineHeight: 19,
  },

  form: { gap: spacing.md },
  fieldWrap: { gap: 7 },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13,
    color: '#334155', letterSpacing: 0.1,
  },
  inputShell: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: radius.md, minHeight: 56,
    paddingRight: spacing.md, overflow: 'hidden',
  },
  inputError: { borderColor: colors.error, backgroundColor: '#FFF5F5' },
  inputIcon: {
    width: 50, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#E2E8F0', height: 56,
  },
  inputIconError: { borderRightColor: '#FECACA', backgroundColor: '#FFF0F0' },
  input: {
    flex: 1, fontFamily: 'Inter_400Regular',
    fontSize: 15, color: '#0F172A',
    paddingHorizontal: spacing.md, minHeight: 54,
  },
  validIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center', marginRight: 2,
  },
  eyeBtn: { padding: 4 },
  fieldError: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.error },

  inlineRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: {
    width: 40, height: 23, borderRadius: 12,
    backgroundColor: '#E2E8F0', justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: '#784BA0' },
  knob: {
    width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    alignSelf: 'flex-start',
  },
  knobRight: { alignSelf: 'flex-end' },
  rememberText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B' },
  forgotText:   { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#784BA0' },

  btnPrimary: { borderRadius: radius.md, overflow: 'hidden' },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', minHeight: 56,
    gap: spacing.sm, paddingHorizontal: spacing.xl,
  },
  btnLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 16,
    color: '#FFFFFF', letterSpacing: 0.3,
  },
  btnArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', gap: 5, marginRight: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
  orText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#CBD5E1' },

  signupBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  signupText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#94A3B8' },
  signupLink: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#784BA0' },
});
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTextField } from '../../../components/ui/IconTextField';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import type { AuthFormErrors, SignInFormValues } from '../types';
import { isValidEmail } from '../validation';

type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: SignInScreenProps) {
  const { clearError, errorMessage, signIn } = useAppSession();
  const [values, setValues] = useState<SignInFormValues>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<AuthFormErrors<keyof SignInFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof SignInFormValues>(key: Key, value: SignInFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate() {
    const nextErrors: AuthFormErrors<keyof SignInFormValues> = {};

    if (!isValidEmail(values.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    clearError();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(values);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        password: error instanceof Error ? error.message : 'Unable to sign in right now.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content} keyboardAvoiding scroll>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={colors.softDark} name="chevron-back" size={22} />
        </Pressable>
      </View>

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.description}>
        Sign in to discover events, manage your plans, and continue where you left off.
      </Text>

      <View style={styles.authCard}>
        <View style={styles.form}>
          <IconTextField
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            keyboardType="email-address"
            leadingIcon="mail-outline"
            onChangeText={(value) => updateValue('email', value)}
            onFocus={clearError}
            placeholder="Type your email"
            value={values.email}
          />

          <IconTextField
            error={errors.password}
            leadingIcon="lock-closed-outline"
            onChangeText={(value) => updateValue('password', value)}
            onFocus={clearError}
            placeholder="Type your password"
            secureTextEntry
            trailingIcon="eye-off-outline"
            value={values.password}
          />
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.rememberWrap}>
            <View style={styles.toggleOn}>
              <View style={styles.toggleKnob} />
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </View>

        <PrimaryButton
          disabled={!isSupabaseConfigured || isSubmitting}
          label={isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
          onPress={() => void handleSubmit()}
          variant="dark"
        />
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>
          Don't have an account? <Text style={styles.linkAccent}>Sign Up</Text>
        </Text>
      </Pressable>

      {isSubmitting ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  topRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  form: {
    gap: spacing.md,
  },
  inlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rememberWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggleOn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 36,
  },
  toggleKnob: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    height: 18,
    width: 18,
  },
  rememberText: {
    ...typography.body2,
    color: colors.softDark,
  },
  forgotText: {
    ...typography.body2,
    color: colors.primary,
    fontFamily: typography.caption3.fontFamily,
  },
  errorCard: {
    backgroundColor: colors.bgCard,
    borderColor: colors.error,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  errorCardText: {
    ...typography.body2,
    color: colors.error,
  },
  link: {
    ...typography.body2,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  linkAccent: {
    color: colors.primary,
    fontFamily: typography.caption3.fontFamily,
  },
  loader: {
    marginTop: spacing.lg,
  },
});

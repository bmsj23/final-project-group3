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
import type { AuthFormErrors, SignUpFormValues } from '../types';
import { isStrongEnoughPassword, isValidEmail } from '../validation';

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { clearError, errorMessage, signUp } = useAppSession();
  const [values, setValues] = useState<SignUpFormValues>({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<AuthFormErrors<keyof SignUpFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof SignUpFormValues>(key: Key, value: SignUpFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate() {
    const nextErrors: AuthFormErrors<keyof SignUpFormValues> = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!isValidEmail(values.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!isStrongEnoughPassword(values.password)) {
      nextErrors.password = 'Password must be at least 8 characters.';
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
      await signUp(values);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        email: error instanceof Error ? error.message : 'Unable to create the account right now.',
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

      <Text style={styles.title}>Create account</Text>
      <Text style={styles.description}>
        Join Eventure to discover experiences, publish events, and stay in the loop.
      </Text>

      <View style={styles.authCard}>
        <View style={styles.form}>
          <IconTextField
            error={errors.fullName}
            leadingIcon="person-outline"
            onChangeText={(value) => updateValue('fullName', value)}
            onFocus={clearError}
            placeholder="Full name"
            value={values.fullName}
          />
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
            hint="Use at least 8 characters."
            leadingIcon="lock-closed-outline"
            onChangeText={(value) => updateValue('password', value)}
            onFocus={clearError}
            placeholder="Create a password"
            secureTextEntry
            trailingIcon="sparkles-outline"
            value={values.password}
          />
        </View>

        <PrimaryButton
          disabled={!isSupabaseConfigured || isSubmitting}
          label={isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          onPress={() => void handleSubmit()}
          variant="dark"
        />
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.linkAccent}>Sign In</Text>
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

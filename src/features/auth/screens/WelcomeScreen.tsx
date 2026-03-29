import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { APP_NAME } from '../../../constants/app';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { AuthStackParamList } from '../../../navigation/types';

type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { continueAsGuest } = useAppSession();

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Phase 1 Setup</Text>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>
          The React Navigation shell, feature folders, and Supabase-ready project foundation are now in place.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Start from here</Text>
        <Text style={styles.cardBody}>Choose an auth flow screen or continue as guest to inspect the initial tab structure.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Sign In" onPress={() => navigation.navigate('SignIn')} />
        <PrimaryButton label="Sign Up" onPress={() => navigation.navigate('SignUp')} variant="secondary" />
        <PrimaryButton label="Continue as Guest" onPress={continueAsGuest} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
});

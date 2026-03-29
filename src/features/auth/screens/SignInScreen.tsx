import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { AuthStackParamList } from '../../../navigation/types';

type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: SignInScreenProps) {
  const { completePlaceholderAuth } = useAppSession();

  return (
    <FeaturePlaceholder
      description="This screen is ready for FE2 to wire to Supabase email/password and Google OAuth flows."
      eyebrow="Auth"
      footer={
        <View style={styles.actions}>
          <PrimaryButton label="Simulate Sign In" onPress={completePlaceholderAuth} />
          <PrimaryButton label="Back to Welcome" onPress={() => navigation.goBack()} variant="secondary" />
          <Text style={styles.note}>
            {isSupabaseConfigured
              ? 'Supabase environment variables are present.'
              : 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env before wiring real auth.'}
          </Text>
        </View>
      }
      highlights={[
        'Email/password sign in form',
        'Google OAuth button and redirect handling',
        'Supabase session persistence',
      ]}
      title="Sign In Scaffold"
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  note: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});

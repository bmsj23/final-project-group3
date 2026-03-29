import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { useAppSession } from '../../../providers/AppSessionProvider';
import type { AuthStackParamList } from '../../../navigation/types';

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { completePlaceholderAuth } = useAppSession();

  return (
    <FeaturePlaceholder
      description="This screen is ready for FE1 to add validation, Supabase sign-up, and post-sign-up profile handling."
      eyebrow="Auth"
      footer={
        <>
          <PrimaryButton label="Simulate Sign Up" onPress={completePlaceholderAuth} />
          <PrimaryButton label="Back to Welcome" onPress={() => navigation.goBack()} variant="secondary" />
        </>
      }
      highlights={[
        'Full name, email, and password fields',
        'Client-side validation hooks',
        'Supabase sign-up request and profile bootstrap',
      ]}
      title="Sign Up Scaffold"
    />
  );
}

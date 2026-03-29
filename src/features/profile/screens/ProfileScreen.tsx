import { StyleSheet, Text } from 'react-native';

import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';

export function ProfileScreen() {
  const { isAuthenticated, isGuest, signOut } = useAppSession();

  const sessionLabel = isAuthenticated ? 'Authenticated placeholder session' : isGuest ? 'Guest session' : 'No active session';

  return (
    <FeaturePlaceholder
      description="The profile area is ready for user details, notification preferences, and role-aware settings."
      eyebrow="Profile"
      footer={
        <>
          <Text style={styles.sessionText}>Current mode: {sessionLabel}</Text>
          <PrimaryButton label="Return to Welcome" onPress={signOut} variant="secondary" />
        </>
      }
      highlights={[
        'Profile details and avatar upload',
        'Notification inbox and preferences',
        'Admin-only navigation entry point',
      ]}
      title="Profile"
    />
  );
}

const styles = StyleSheet.create({
  sessionText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});

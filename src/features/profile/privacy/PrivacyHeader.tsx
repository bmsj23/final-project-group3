import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './privacyScreen.styles';

type PrivacyHeaderProps = {
  onBack: () => void;
};

export function PrivacyHeader({ onBack }: PrivacyHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={22} color="#0F172A" />
      </Pressable>

      <View>
        <Text style={styles.eyebrow}>Account controls</Text>
        <Text style={styles.title}>Privacy & Security</Text>
        <Text style={styles.subtitle}>
          Manage the small set of privacy controls that matter most for your account.
        </Text>
      </View>
    </View>
  );
}

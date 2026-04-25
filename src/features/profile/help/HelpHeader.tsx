import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './helpScreen.styles';

type HelpHeaderProps = {
  onBack: () => void;
};

export function HelpHeader({ onBack }: HelpHeaderProps) {
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
        <Text style={styles.eyebrow}>Support</Text>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          Find quick answers, open the right support channel, and jump to the settings that matter.
        </Text>
      </View>
    </View>
  );
}

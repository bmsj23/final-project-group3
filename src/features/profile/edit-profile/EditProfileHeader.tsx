import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './editProfileScreen.styles';

type EditProfileHeaderProps = {
  onBack: () => void;
};

export function EditProfileHeader({ onBack }: EditProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={22} color="#0F172A" />
      </Pressable>
      <View>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.headerSubtitle}>
          Update your name, photo, and short bio without the extra clutter.
        </Text>
      </View>
    </View>
  );
}

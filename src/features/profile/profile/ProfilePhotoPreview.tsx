import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileRecord } from '../../../lib/supabase/types';
import { styles } from './profileScreen.styles';

type ProfilePhotoPreviewProps = {
  initial: string;
  isGuest: boolean;
  onClose: () => void;
  profile: ProfileRecord | null;
  visible: boolean;
};

export function ProfilePhotoPreview({
  initial,
  isGuest,
  onClose,
  profile,
  visible,
}: ProfilePhotoPreviewProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.previewShell}>
          <Pressable
            accessibilityLabel="Close photo preview"
            accessibilityRole="button"
            style={({ pressed }) => [styles.previewCloseBtn, pressed && styles.previewPressed]}
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color="#F8FAFC" />
          </Pressable>

          <LinearGradient
            colors={['#0F172A', '#1D4ED8', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewRing}
          >
            <View style={styles.previewInner}>
              {profile?.avatar_url ? (
                <Image
                  contentFit="cover"
                  source={{ uri: profile.avatar_url }}
                  style={styles.previewImage}
                  transition={200}
                />
              ) : (
                <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.previewFallback}>
                  <Text style={styles.previewInitial}>{initial}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>

          <Text style={styles.previewName}>
            {profile?.full_name ?? (isGuest ? 'Guest Explorer' : 'Eventure User')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

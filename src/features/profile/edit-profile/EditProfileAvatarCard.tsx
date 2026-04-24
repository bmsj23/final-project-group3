import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { styles } from './editProfileScreen.styles';

type EditProfileAvatarCardProps = {
  avatarInitial: string;
  avatarPreview: string | null;
  email: string;
  fullName: string;
  hasExistingAvatar: boolean;
  isPickingImage: boolean;
  onPickImage: () => void;
  onRemoveAvatar: () => void;
  onUndoNewPhoto: () => void;
  selectedImagePending: boolean;
  shouldRemoveAvatar: boolean;
};

export function EditProfileAvatarCard({
  avatarInitial,
  avatarPreview,
  email,
  fullName,
  hasExistingAvatar,
  isPickingImage,
  onPickImage,
  onRemoveAvatar,
  onUndoNewPhoto,
  selectedImagePending,
  shouldRemoveAvatar,
}: EditProfileAvatarCardProps) {
  return (
    <View style={[styles.card, styles.avatarCard]}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.avatarShell, pressed && styles.pressed]}
        onPress={onPickImage}
      >
        {avatarPreview ? (
          <Image contentFit="cover" source={{ uri: avatarPreview }} style={styles.avatarImage} />
        ) : (
          <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </LinearGradient>
        )}

        <View style={styles.cameraBadge}>
          {isPickingImage ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <Text style={styles.heroNamePreview}>{fullName.trim() || 'Your display name'}</Text>
      <Text style={styles.heroEmail}>{email.trim() || 'No email available'}</Text>

      <View style={styles.heroActions}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryChip, pressed && styles.pressed]}
          onPress={onPickImage}
        >
          <Ionicons name="image-outline" size={16} color="#1D4ED8" />
          <Text style={styles.secondaryChipText}>Upload Photo</Text>
        </Pressable>

        {selectedImagePending ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.ghostChip, pressed && styles.pressed]}
            onPress={onUndoNewPhoto}
          >
            <Ionicons name="refresh-outline" size={16} color="#DC2626" />
            <Text style={styles.ghostChipText}>Undo New Photo</Text>
          </Pressable>
        ) : hasExistingAvatar && !shouldRemoveAvatar ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.ghostChip, pressed && styles.pressed]}
            onPress={onRemoveAvatar}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.ghostChipText}>Remove Photo</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

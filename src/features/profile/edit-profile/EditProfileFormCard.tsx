import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { styles } from './editProfileScreen.styles';

type EditProfileFormCardProps = {
  bio: string;
  errorMessage: string | null;
  fullName: string;
  hasChanges: boolean;
  isSaving: boolean;
  memberSince: string;
  onBioChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onSave: () => void;
  role: string;
  statusText: string;
};

export function EditProfileFormCard({
  bio,
  errorMessage,
  fullName,
  hasChanges,
  isSaving,
  memberSince,
  onBioChange,
  onFullNameChange,
  onSave,
  role,
  statusText,
}: EditProfileFormCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.sectionTitle}>Profile details</Text>
        <Text style={styles.sectionText}>Keep your public identity clear and easy to recognize.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        <View style={styles.inputShell}>
          <Ionicons name="person-outline" size={18} color="#64748B" />
          <TextInput
            maxLength={60}
            placeholder="Enter your name"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={fullName}
            onChangeText={onFullNameChange}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Bio</Text>
        <View style={[styles.inputShell, styles.inputShellMulti]}>
          <TextInput
            maxLength={180}
            multiline
            numberOfLines={5}
            placeholder="Tell people a little about yourself or the events you organize."
            placeholderTextColor="#64748B"
            style={styles.inputMulti}
            textAlignVertical="top"
            value={bio}
            onChangeText={onBioChange}
          />
        </View>
        <Text style={styles.helperText}>{bio.trim().length}/180 characters</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{role}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{memberSince}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Photo Status</Text>
          <Text style={styles.infoValue}>{statusText}</Text>
        </View>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        style={({ pressed }) => [
          styles.saveButtonWrap,
          pressed && !isSaving ? styles.pressed : null,
          isSaving ? styles.disabled : null,
        ]}
        onPress={onSave}
      >
        <View style={styles.saveButton}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{hasChanges ? 'Save Changes' : 'No Changes Yet'}</Text>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

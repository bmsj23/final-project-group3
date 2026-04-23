import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import type { EventImageAsset } from '../../events/types';
import {
  deleteProfileImageFromPublicUrl,
  updateMyAuthEmail,
  updateMyProfile,
  uploadProfileImage,
} from '../api';
import { pickProfileImageAsset } from '../imagePicker';

type EditProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { profile, refreshProfile } = useAppSession();
  const scrollRef = useRef<ScrollView | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [selectedImage, setSelectedImage] = useState<EventImageAsset | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setEmail(profile?.email ?? '');
    setBio(profile?.bio ?? '');
    setSelectedImage(null);
    setShouldRemoveAvatar(false);
  }, [profile]);

  const hasExistingAvatar = Boolean(profile?.avatar_url);
  const avatarPreview = shouldRemoveAvatar ? null : selectedImage?.uri ?? profile?.avatar_url ?? null;
  const avatarInitial = useMemo(
    () => (fullName.trim().slice(0, 1) || profile?.full_name?.slice(0, 1) || 'U').toUpperCase(),
    [fullName, profile?.full_name],
  );
  const hasChanges =
    fullName.trim() !== (profile?.full_name ?? '').trim() ||
    email.trim() !== (profile?.email ?? '').trim() ||
    bio.trim() !== (profile?.bio ?? '').trim() ||
    Boolean(selectedImage) ||
    shouldRemoveAvatar;

  async function handlePickImage() {
    setIsPickingImage(true);
    setErrorMessage(null);

    try {
      const { data, error } = await pickProfileImageAsset();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data) {
        setSelectedImage(data);
        setShouldRemoveAvatar(false);
      }
    } finally {
      setIsPickingImage(false);
    }
  }

  function handleUndoNewPhoto() {
    setSelectedImage(null);
  }

  function handleRemoveAvatar() {
    setSelectedImage(null);
    setShouldRemoveAvatar(true);
  }

  function handleBioFocus() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }

  async function handleSave() {
    if (!profile) {
      setErrorMessage('Your account profile is not available right now.');
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName) {
      setErrorMessage('Name is required.');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let avatarUrl = profile.avatar_url;

      if (shouldRemoveAvatar && profile.avatar_url) {
        const deleteResult = await deleteProfileImageFromPublicUrl(profile.avatar_url);

        if (deleteResult.error) {
          throw deleteResult.error;
        }

        avatarUrl = null;
      }

      if (selectedImage) {
        const previousAvatarUrl = shouldRemoveAvatar ? null : profile.avatar_url;
        const uploadResult = await uploadProfileImage(profile.id, selectedImage);

        if (uploadResult.error || !uploadResult.data) {
          throw uploadResult.error ?? new Error('Unable to upload the selected profile photo.');
        }

        avatarUrl = uploadResult.data.publicUrl;

        if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
          await deleteProfileImageFromPublicUrl(previousAvatarUrl);
        }
      }

      if (trimmedEmail !== (profile.email ?? '').trim()) {
        const { error } = await updateMyAuthEmail(trimmedEmail);

        if (error) {
          throw error;
        }
      }

      const { error } = await updateMyProfile(profile.id, {
        fullName: trimmedName,
        bio: trimmedBio ? trimmedBio : null,
        avatarUrl,
      });

      if (error) {
        throw error;
      }

      await refreshProfile();
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your profile.';
      setErrorMessage(message);
      Alert.alert('Save Failed', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#020817', '#0B1733', '#10224A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Profile Studio</Text>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>
                Update your identity, contact info, and profile photo in one place.
              </Text>
            </View>
          </View>
        

          <View style={styles.heroCard}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.avatarShell, pressed && styles.pressed]}
              onPress={() => void handlePickImage()}
            >
              {avatarPreview ? (
                <Image contentFit="cover" source={{ uri: avatarPreview }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={['#2563EB', '#7C3AED']} style={styles.avatarFallback}>
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
                onPress={() => void handlePickImage()}
              >
                <Ionicons name="image-outline" size={16} color="#DBEAFE" />
                <Text style={styles.secondaryChipText}>Upload Photo</Text>
              </Pressable>
              {selectedImage ? (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.ghostChip, pressed && styles.pressed]}
                  onPress={handleUndoNewPhoto}
                >
                  <Ionicons name="refresh-outline" size={16} color="#FCA5A5" />
                  <Text style={styles.ghostChipText}>Undo New Photo</Text>
                </Pressable>
              ) : hasExistingAvatar && !shouldRemoveAvatar ? (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.ghostChip, pressed && styles.pressed]}
                  onPress={handleRemoveAvatar}
                >
                  <Ionicons name="trash-outline" size={16} color="#FCA5A5" />
                  <Text style={styles.ghostChipText}>Remove Photo</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <View style={styles.inputShell}>
                <Ionicons name="person-outline" size={18} color="#93C5FD" />
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  maxLength={60}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputShell}>
                <Ionicons name="mail-outline" size={18} color="#93C5FD" />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <Text style={styles.helperText}>
                Changing your email updates the account contact email used by the app.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <View style={[styles.inputShell, styles.inputShellMulti]}>
                <TextInput
                  multiline
                  numberOfLines={5}
                  placeholder="Tell people a bit about yourself, your events, or what you enjoy organizing."
                  placeholderTextColor="#64748B"
                style={styles.inputMulti}
                textAlignVertical="top"
                value={bio}
                onChangeText={setBio}
                onFocus={handleBioFocus}
                maxLength={180}
              />
              </View>
              <Text style={styles.helperText}>{bio.trim().length}/180 characters</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{profile?.role ?? 'Organizer'}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-PH', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {shouldRemoveAvatar
                    ? 'Photo will be removed on save'
                    : selectedImage
                      ? 'New photo ready to upload'
                      : 'No pending media changes'}
                </Text>
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
              onPress={() => void handleSave()}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8', '#1E40AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>
                      {hasChanges ? 'Save Changes' : 'No Changes Yet'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020817' },
  keyboardArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 36,
  },
  orbTop: {
    position: 'absolute',
    top: -60,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#2563EB',
    opacity: 0.18,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1D4ED8',
    opacity: 0.12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: 24 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.65 },
  headerCopy: { flex: 1, gap: 6 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#93C5FD',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: '#F8FAFC', letterSpacing: -0.6 },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
  },
  heroCard: {
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    marginBottom: 18,
  },
  avatarShell: {
    width: 116,
    height: 116,
    borderRadius: 58,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 54 },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 42, color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  heroNamePreview: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  heroEmail: {
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#93C5FD',
    textAlign: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 16,
  },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(37,99,235,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.25)',
  },
  secondaryChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#DBEAFE' },
  ghostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(127,29,29,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.22)',
  },
  ghostChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FCA5A5' },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.xl,
    gap: 18,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#334155',
  },
  inputShell: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: spacing.md,
  },
  inputShellMulti: {
    alignItems: 'flex-start',
    minHeight: 132,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    minHeight: 54,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#0F172A',
  },
  inputMulti: {
    flex: 1,
    minHeight: 100,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#0F172A',
    paddingTop: 2,
  },
  helperText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B' },
  infoCard: {
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  infoRow: { paddingHorizontal: spacing.md, paddingVertical: 14, gap: 4 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
  infoLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#64748B',
  },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#0F172A' },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#DC2626' },
  saveButtonWrap: { borderRadius: 18, overflow: 'hidden' },
  saveButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },
});

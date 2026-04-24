import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import type { EventImageAsset } from '../../events/types';
import {
  deleteProfileImageFromPublicUrl,
  updateMyProfile,
  uploadProfileImage,
} from '../api';
import { pickProfileImageAsset } from '../imagePicker';
import { EditProfileAvatarCard } from './EditProfileAvatarCard';
import { EditProfileFormCard } from './EditProfileFormCard';
import { EditProfileHeader } from './EditProfileHeader';
import {
  formatMemberSince,
  getAvatarInitial,
  hasProfileChanges,
  type EditProfileFormState,
} from './editProfileScreen.shared';
import { styles } from './editProfileScreen.styles';

type EditProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function getBaselineForm(profile: ReturnType<typeof useAppSession>['profile']): EditProfileFormState {
  return {
    fullName: profile?.full_name ?? '',
    bio: profile?.bio ?? '',
  };
}

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { profile, refreshProfile } = useAppSession();
  const [form, setForm] = useState<EditProfileFormState>(getBaselineForm(profile));
  const [selectedImage, setSelectedImage] = useState<EventImageAsset | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(getBaselineForm(profile));
    setSelectedImage(null);
    setShouldRemoveAvatar(false);
    setErrorMessage(null);
  }, [profile]);

  const baselineForm = useMemo(() => getBaselineForm(profile), [profile]);
  const hasExistingAvatar = Boolean(profile?.avatar_url);
  const avatarPreview = shouldRemoveAvatar ? null : selectedImage?.uri ?? profile?.avatar_url ?? null;
  const avatarInitial = getAvatarInitial(form.fullName, profile?.full_name);
  const memberSince = formatMemberSince(profile?.created_at);
  const hasChanges = hasProfileChanges(form, baselineForm, selectedImage, shouldRemoveAvatar);
  const statusText = shouldRemoveAvatar
    ? 'Photo will be removed on save'
    : selectedImage
      ? 'New photo ready to upload'
      : 'No pending photo changes';

  const confirmDiscardChanges = useCallback(
    (onDiscard: () => void) => {
      if (!hasChanges || isSaving) {
        onDiscard();
        return;
      }

      Alert.alert(
        'Discard changes?',
        'You have unsaved profile changes. If you leave now, your edits will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onDiscard,
          },
        ],
      );
    },
    [hasChanges, isSaving],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!hasChanges || isSaving) {
        return;
      }

      event.preventDefault();
      confirmDiscardChanges(() => navigation.dispatch(event.data.action));
    });

    return unsubscribe;
  }, [confirmDiscardChanges, hasChanges, isSaving, navigation]);

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

  async function handleSave() {
    if (!profile) {
      setErrorMessage('Your account profile is not available right now.');
      return;
    }

    const trimmedName = form.fullName.trim();
    const trimmedBio = form.bio.trim();

    if (!trimmedName) {
      setErrorMessage('Name is required.');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
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

      const { error } = await updateMyProfile(profile.id, {
        fullName: trimmedName,
        bio: trimmedBio || null,
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
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#B8DBFF', '#D9ECFF', '#F4F8FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.heroSection}>
            <EditProfileHeader onBack={() => confirmDiscardChanges(() => navigation.goBack())} />
            

          <EditProfileAvatarCard
            avatarInitial={avatarInitial}
            avatarPreview={avatarPreview}
            email={profile?.email ?? ''}
            fullName={form.fullName}
            hasExistingAvatar={hasExistingAvatar}
            isPickingImage={isPickingImage}
              onPickImage={() => void handlePickImage()}
              onRemoveAvatar={() => {
                setSelectedImage(null);
                setShouldRemoveAvatar(true);
              }}
              onUndoNewPhoto={() => setSelectedImage(null)}
              selectedImagePending={Boolean(selectedImage)}
              shouldRemoveAvatar={shouldRemoveAvatar}
            />
          </View>

          <View style={styles.bodySheet}>
            <View style={styles.handle} />

            <View style={styles.bodyContent}>
              <EditProfileFormCard
                bio={form.bio}
                errorMessage={errorMessage}
                fullName={form.fullName}
                hasChanges={hasChanges}
                isSaving={isSaving}
                memberSince={memberSince}
                onBioChange={(bio) => setForm((current) => ({ ...current, bio }))}
                onFullNameChange={(fullName) => setForm((current) => ({ ...current, fullName }))}
                onSave={() => void handleSave()}
                role={profile?.role ?? 'Organizer'}
                statusText={statusText}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

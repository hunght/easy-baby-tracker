import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { z } from 'zod';

import { DatePickerField } from '@/components/DatePickerField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StickySaveBar } from '@/components/StickySaveBar';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNotification } from '@/components/NotificationContext';
import {
  BABY_PROFILES_QUERY_KEY,
  BABY_PROFILE_QUERY_KEY,
  babyProfileByIdKey,
} from '@/constants/query-keys';
import {
  BabyProfilePayload,
  Gender,
  getBabyProfileById,
  saveBabyProfile,
} from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { ModalHeader } from '@/components/ModalHeader';

const genderSegments: { key: Gender; labelKey: string }[] = [
  { key: 'unknown', labelKey: 'onboarding.babyProfile.genderOptions.unknown' },
  { key: 'boy', labelKey: 'onboarding.babyProfile.genderOptions.boy' },
  { key: 'girl', labelKey: 'onboarding.babyProfile.genderOptions.girl' },
];

// Zod schema for Gender validation
const genderSchema = z.enum(['unknown', 'boy', 'girl']);

// Type guard using Zod validation
function isGender(value: unknown): value is Gender {
  return genderSchema.safeParse(value).success;
}

// Directory for storing baby profile photos
const PROFILE_PHOTO_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'profile-photos/';

async function ensureProfilePhotoDir() {
  if (!PROFILE_PHOTO_DIR) {
    throw new Error('FileSystem directory unavailable');
  }
  const info = await FileSystem.getInfoAsync(PROFILE_PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROFILE_PHOTO_DIR, { intermediates: true });
  }
  return PROFILE_PHOTO_DIR;
}

async function persistAsset(asset: ImagePicker.ImagePickerAsset) {
  if (!asset.uri) {
    return null;
  }

  const directory = await ensureProfilePhotoDir();
  const extensionFromName =
    asset.fileName?.split('.').pop()?.toLowerCase() ?? asset.uri.split('.').pop()?.split('?')[0];
  const ext = extensionFromName && extensionFromName.length <= 5 ? extensionFromName : 'jpg';
  const dest = `${directory}${Date.now()}-${Math.round(Math.random() * 1_000_000)}.${ext}`;

  await FileSystem.copyAsync({ from: asset.uri, to: dest });
  return dest;
}

export default function ProfileEditScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const { babyId } = useLocalSearchParams<{ babyId?: string }>();
  const numericBabyId = babyId ? Number(babyId) : null;

  const { data: existingProfile, isLoading } = useQuery({
    queryKey: babyProfileByIdKey(numericBabyId ?? -1),
    queryFn: () => getBabyProfileById(numericBabyId!),
    enabled: numericBabyId != null && Number.isFinite(numericBabyId),
  });

  const [nickname, setNickname] = useState(t('common.nicknamePlaceholder'));
  const [gender, setGender] = useState<Gender>('unknown');
  const [birthDate, setBirthDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setGender(existingProfile.gender);
      setBirthDate(new Date(existingProfile.birthDate));
      setDueDate(new Date(existingProfile.dueDate));
      setAvatarUri(existingProfile.avatarUri ?? null);
    }
  }, [existingProfile]);

  // Debug: log avatarUri changes
  useEffect(() => {
    console.log('[ProfileEdit] avatarUri state changed to:', avatarUri);
  }, [avatarUri]);

  const requestPermission = async (type: 'camera' | 'library') => {
    const permission =
      type === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert(
        t('common.permissionDenied') ?? 'Permission needed',
        t('common.permissionDeniedDescription') ?? 'Please grant access in Settings to continue.'
      );
      return false;
    }
    return true;
  };

  const replacePhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    console.log('[ProfileEdit] replacePhoto called with asset:', {
      uri: asset.uri,
      fileName: asset.fileName,
    });
    setPhotoProcessing(true);
    try {
      // Delete old photo if exists
      if (avatarUri) {
        console.log('[ProfileEdit] Deleting old photo:', avatarUri);
        await FileSystem.deleteAsync(avatarUri, { idempotent: true });
      }
      const storedUri = await persistAsset(asset);
      console.log('[ProfileEdit] persistAsset returned:', storedUri);
      if (!storedUri) {
        throw new Error('Unable to store image');
      }
      // Verify the file exists
      const fileInfo = await FileSystem.getInfoAsync(storedUri);
      console.log('[ProfileEdit] File info:', fileInfo);
      if (!fileInfo.exists) {
        throw new Error('Stored file does not exist');
      }
      console.log('[ProfileEdit] Setting avatarUri to:', storedUri);
      setAvatarUri(storedUri);
    } catch (error) {
      console.error('[ProfileEdit] Error replacing photo:', error);
      showNotification(t('common.photoSaveError'), 'error');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    // Request permission while modal is still visible
    const allowed = await requestPermission('camera');
    if (!allowed) return;

    try {
      // Launch camera while modal is still visible (iOS allows this)
      // This avoids the issue where closing modal first causes camera to hang
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      // Close modal after camera interaction completes
      setShowPhotoModal(false);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      await replacePhoto(result.assets[0]);
    } catch (error) {
      console.error('Error in handleTakePhoto:', error);
      setShowPhotoModal(false);
    }
  };

  const handleChoosePhoto = async () => {
    console.log('[ProfileEdit] handleChoosePhoto called');
    // Request permission while modal is still visible
    const allowed = await requestPermission('library');
    console.log('[ProfileEdit] Library permission:', allowed);
    if (!allowed) return;

    try {
      console.log('[ProfileEdit] Launching image library...');
      // Launch image library while modal is still visible
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
        mediaTypes: ['images'],
      });

      console.log('[ProfileEdit] Library result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length,
      });

      // Close modal after library interaction completes
      setShowPhotoModal(false);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[ProfileEdit] No assets selected, returning');
        return;
      }

      console.log('[ProfileEdit] Calling replacePhoto with asset:', result.assets[0].uri);
      await replacePhoto(result.assets[0]);
      console.log('[ProfileEdit] replacePhoto completed, avatarUri should be updated');
    } catch (error) {
      console.error('[ProfileEdit] Error in handleChoosePhoto:', error);
      setShowPhotoModal(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoModal(false);
    if (!avatarUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await FileSystem.deleteAsync(avatarUri, { idempotent: true });
    } catch (error) {
      console.warn('Failed to delete photo', error);
    }
    setAvatarUri(null);
  };

  const handleGenderChange = (value: string | undefined) => {
    if (value && isGender(value)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGender(value);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setIsSaving(true);
      const payload: BabyProfilePayload = {
        nickname,
        gender,
        birthDate: birthDate.toISOString(),
        dueDate: dueDate.toISOString(),
        avatarUri: avatarUri ?? undefined,
        concerns: existingProfile?.concerns ?? [],
      };

      await saveBabyProfile(payload, { babyId: numericBabyId ?? undefined });
      await queryClient.invalidateQueries({ queryKey: BABY_PROFILES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
      if (numericBabyId) {
        await queryClient.invalidateQueries({ queryKey: babyProfileByIdKey(numericBabyId) });
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && numericBabyId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-semibold text-primary">{t('common.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="bg-background">
      <View className="flex-1 bg-background">
        <ModalHeader
          title={numericBabyId ? t('profileEdit.editTitle') : t('profileEdit.createTitle')}
          closeLabel={t('common.close')}
        />

        <ScrollView
          contentContainerClassName="px-5 pb-28 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Photo Section */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPhotoModal(true);
            }}
            disabled={photoProcessing}
            className="mb-6 items-center">
            <View className="relative">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted/30">
                {avatarUri ? (
                  <Image
                    key={avatarUri}
                    source={{ uri: avatarUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                ) : (
                  <Image source={require('@/assets/images/icon.png')} className="h-20 w-20" />
                )}
              </View>
              {/* Camera badge */}
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-accent">
                <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
              </View>
            </View>
            <Text className="mt-3 text-base font-semibold text-accent">
              {avatarUri ? t('profileEdit.changePhoto') : t('common.addPhoto')}
            </Text>
          </Pressable>

          {/* Nickname */}
          <View className="mb-5">
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t('common.nickname')}
            </Label>
            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('common.nicknamePlaceholder')}
              className="h-12 text-base"
            />
          </View>

          {/* Gender - Full width 3-segment toggle */}
          <View className="mb-5">
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t('common.gender')}
            </Label>
            <ToggleGroup
              type="single"
              value={gender}
              onValueChange={handleGenderChange}
              variant="outline"
              className="w-full">
              {genderSegments.map((segment, index) => (
                <ToggleGroupItem
                  key={segment.key}
                  value={segment.key}
                  isFirst={index === 0}
                  isLast={index === genderSegments.length - 1}
                  className="flex-1"
                  aria-label={t(segment.labelKey)}>
                  <Text className="text-base font-semibold">{t(segment.labelKey)}</Text>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </View>

          {/* Birthdate - Full row tappable */}
          <View className="mb-5">
            <DatePickerField
              label={t('common.birthdate')}
              value={birthDate}
              onChange={setBirthDate}
            />
          </View>

          {/* Due Date - Full row tappable */}
          <View className="mb-5">
            <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />
          </View>

          {/* Info Text */}
          <Text className="text-sm leading-relaxed text-muted-foreground">
            {t('profileEdit.info')}
          </Text>
        </ScrollView>

        {/* Photo Selection Modal - Bottom Sheet Style */}
        <Modal
          visible={showPhotoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPhotoModal(false)}>
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setShowPhotoModal(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="rounded-t-3xl bg-card px-5 pb-10 pt-6">
                <Text className="mb-4 text-center text-lg font-bold text-foreground">
                  {t('profileEdit.photoOptions')}
                </Text>

                <Pressable
                  onPress={handleTakePhoto}
                  className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-accent">
                  <MaterialCommunityIcons name="camera" size={22} color="#FFF" />
                  <Text className="text-base font-semibold text-white">{t('diary.takePhoto')}</Text>
                </Pressable>

                <Pressable
                  onPress={handleChoosePhoto}
                  className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-muted">
                  <MaterialCommunityIcons name="image-multiple" size={22} color="#666" />
                  <Text className="text-base font-semibold text-foreground">
                    {t('diary.choosePhoto')}
                  </Text>
                </Pressable>

                {avatarUri && (
                  <Pressable
                    onPress={handleRemovePhoto}
                    className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-red-500/10">
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                    <Text className="text-base font-semibold text-red-500">
                      {t('diary.removePhoto')}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setShowPhotoModal(false)}
                  className="h-14 items-center justify-center rounded-xl">
                  <Text className="text-base font-semibold text-muted-foreground">
                    {t('common.cancel')}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <StickySaveBar
          onPress={handleSave}
          isSaving={isSaving}
          disabled={!nickname.trim()}
          label={numericBabyId ? t('common.saveChanges') : t('common.continue')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

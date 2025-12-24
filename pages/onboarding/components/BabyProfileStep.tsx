import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { DatePickerField } from '@/components/DatePickerField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { BabyProfilePayload, Gender } from '@/database/baby-profile';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';

type BabyProfileStepProps = {
  headerText: string;
  concerns: string[];
  onSave: (profile: BabyProfilePayload) => Promise<void>;
};

const genderSegments: { key: Gender; labelKey: string }[] = [
  { key: 'unknown', labelKey: 'onboarding.babyProfile.genderOptions.unknown' },
  { key: 'boy', labelKey: 'onboarding.babyProfile.genderOptions.boy' },
  { key: 'girl', labelKey: 'onboarding.babyProfile.genderOptions.girl' },
];

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

export function BabyProfileStep({ headerText, concerns, onSave }: BabyProfileStepProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  const [nickname, setNickname] = useState(t('common.nicknamePlaceholder'));
  const [gender, setGender] = useState<Gender>('unknown');
  const [birthDate, setBirthDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChoosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert(
        t('common.permissionDenied') ?? 'Permission needed',
        t('common.permissionDeniedDescription') ?? 'Please grant access in Settings to continue.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true, // Allow cropping for better circular avatars
        aspect: [1, 1],
        quality: 0.8,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const persistedUri = await persistAsset(asset);
        if (persistedUri) {
          setAvatarUri(persistedUri);
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert(t('common.error'), t('common.photoSaveError'));
    }
  };

  const handleContinue = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await onSave({
        nickname,
        gender,
        birthDate: birthDate.toISOString(),
        dueDate: dueDate.toISOString(),
        concerns,
        avatarUri: avatarUri ?? undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}>
      <View
        className="gap-5 rounded-lg bg-card p-6 shadow-sm"
        style={{ backgroundColor: brandColors.colors.lavender + '20' }}>
        <Text className="text-center text-2xl font-bold text-foreground">{headerText}</Text>

        <Text className="text-center text-xs leading-5 text-muted-foreground opacity-80">
          {t('onboarding.babyProfile.info')}
        </Text>

        <View className="items-center py-2">
          <Pressable onPress={handleChoosePhoto} className="items-center">
            <View
              className={`items-center justify-center overflow-hidden rounded-full border-4 border-white bg-muted/30 shadow-sm ${!avatarUri && gender !== 'unknown' ? 'bg-white' : ''}`}
              style={{ width: 108, height: 108 }}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 100, height: 100 }}
                  contentFit="cover"
                />
              ) : gender === 'boy' ? (
                <MaterialCommunityIcons name="face-man-profile" size={80} color="#3B82F6" />
              ) : gender === 'girl' ? (
                <MaterialCommunityIcons name="face-woman-profile" size={80} color="#EC4899" />
              ) : (
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={{ width: 100, height: 100 }}
                />
              )}
            </View>
            <Text className="mt-3 font-medium text-accent">
              {avatarUri ? t('profileEdit.changePhoto') : t('common.addPhoto')}
            </Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="font-semibold text-foreground">{t('common.nickname')}</Text>
          <Input
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('common.nicknamePlaceholder')}
            className="bg-white"
          />
        </View>

        <View className="gap-2">
          <Text className="font-semibold text-foreground">{t('common.gender')}</Text>
          <View className="flex-row gap-3">
            {genderSegments
              .filter((s) => s.key !== 'unknown')
              .map((segment) => {
                const active = gender === segment.key;
                const isBoy = segment.key === 'boy';
                return (
                  <Pressable
                    key={segment.key}
                    onPress={() => setGender(segment.key)}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border p-4 ${
                      active ? 'border-accent bg-accent/10' : 'border-border bg-white'
                    }`}>
                    <Text className="text-xl">{isBoy ? '🚙' : '🧸'}</Text>
                    <Text
                      className={`font-semibold ${
                        active ? 'text-accent-foreground' : 'text-muted-foreground'
                      }`}>
                      {t(segment.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <DatePickerField
              label={t('common.birthdate')}
              value={birthDate}
              onChange={setBirthDate}
            />
          </View>
          <View className="flex-1">
            <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />
          </View>
        </View>

        <Button onPress={handleContinue} disabled={isSaving} className="mt-2">
          <Text className="text-lg font-bold">{t('common.continue')}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { StickySaveBar } from '@/components/StickySaveBar';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { DIARY_ENTRIES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaryEntryPayload } from '@/database/diary';
import { getDiaryEntryById, saveDiaryEntry, updateDiaryEntry } from '@/database/diary';
import { useLocalization } from '@/localization/LocalizationProvider';

const DIARY_PHOTO_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'diary-photos/';

async function ensureDiaryPhotoDir() {
  if (!DIARY_PHOTO_DIR) {
    throw new Error('FileSystem directory unavailable');
  }
  const info = await FileSystem.getInfoAsync(DIARY_PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIARY_PHOTO_DIR, { intermediates: true });
  }
  return DIARY_PHOTO_DIR;
}

async function persistAsset(asset: ImagePicker.ImagePickerAsset) {
  if (!asset.uri) {
    return null;
  }

  const directory = await ensureDiaryPhotoDir();
  const extensionFromName =
    asset.fileName?.split('.').pop()?.toLowerCase() ?? asset.uri.split('.').pop()?.split('?')[0];
  const ext = extensionFromName && extensionFromName.length <= 5 ? extensionFromName : 'jpg';
  const dest = `${directory}${Date.now()}-${Math.round(Math.random() * 1_000_000)}.${ext}`;

  await FileSystem.copyAsync({ from: asset.uri, to: dest });
  return dest;
}

export default function DiaryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading } = useQuery({
    queryKey: [DIARY_ENTRIES_QUERY_KEY, id],
    queryFn: () => (id ? getDiaryEntryById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setTitle(existingData.title ?? '');
      setContent(existingData.content ?? '');
      setPhotoUri(existingData.photoUri ?? null);
    }
  }, [existingData]);

  const mutation = useMutation({
    mutationFn: saveDiaryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      router.back();
    },
    onError: (error) => {
      console.error('Failed to save diary entry:', error);
      showNotification(t('common.diarySaveError'), 'error');
    },
  });

  const hasContent = title.trim().length > 0 || content.trim().length > 0 || photoUri != null;

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
    setPhotoProcessing(true);
    try {
      if (photoUri) {
        await FileSystem.deleteAsync(photoUri, { idempotent: true });
      }
      const storedUri = await persistAsset(asset);
      if (!storedUri) {
        throw new Error('Unable to store image');
      }
      const fileInfo = await FileSystem.getInfoAsync(storedUri);
      if (!fileInfo.exists) {
        throw new Error('Stored file does not exist');
      }
      const imageUri = storedUri.startsWith('file://')
        ? storedUri.replace(/^file:\/\//, '')
        : storedUri;
      setPhotoUri(imageUri);
    } catch (error) {
      console.error('Error replacing photo:', error);
      showNotification(t('common.photoSaveError'), 'error');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    // Request permission while modal is still visible
    const allowed = await requestPermission('camera');
    if (!allowed) {
      return;
    }

    try {
      // Launch camera while modal is still visible (iOS allows this)
      // This avoids the issue where closing modal first causes camera to hang
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
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
    // Request permission while modal is still visible
    const allowed = await requestPermission('library');
    if (!allowed) {
      return;
    }

    try {
      // Launch image library while modal is still visible
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
        mediaTypes: ['images'],
      });

      // Close modal after library interaction completes
      setShowPhotoModal(false);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      await replacePhoto(result.assets[0]);
    } catch (error) {
      console.error('Error in handleChoosePhoto:', error);
      setShowPhotoModal(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoModal(false);
    if (!photoUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    } catch (error) {
      console.warn('Failed to delete photo', error);
    }
    setPhotoUri(null);
  };

  const handleSave = async () => {
    if (!hasContent || isSaving) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    const payload: DiaryEntryPayload = {
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      photoUri: photoUri ?? undefined,
    };

    try {
      if (isEditing && id) {
        await updateDiaryEntry(id, payload);
        queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY });
        showNotification(t('common.saveSuccess'), 'success');
        router.back();
      } else {
        await mutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error(error);
      showNotification(t('common.diarySaveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
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
          title={isEditing ? t('diary.editTitle') : t('diary.title')}
          closeLabel={t('common.close')}
        />

        <ScrollView
          contentContainerClassName="p-5 pb-28 gap-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <View>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder={t('diary.titlePlaceholder')}
              className="h-12 text-base"
            />
          </View>

          {/* Content Input */}
          <View>
            <Input
              className="min-h-[140px] text-base"
              value={content}
              onChangeText={setContent}
              placeholder={t('diary.contentPlaceholder')}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Photo Section - Tappable Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPhotoModal(true);
            }}
            disabled={photoProcessing}
            className="overflow-hidden rounded-2xl border border-border bg-card">
            {photoUri ? (
              <View className="relative">
                <Image
                  key={photoUri}
                  source={{ uri: photoUri }}
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                  transition={200}
                />
                {/* Photo overlay badge */}
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
                  <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                  <Text className="text-xs font-semibold text-white">{t('common.change')}</Text>
                </View>
              </View>
            ) : (
              <View className="h-[160px] items-center justify-center gap-3">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <MaterialCommunityIcons name="image-plus" size={28} color="#7C3AED" />
                </View>
                <Text className="text-base font-semibold text-accent">{t('diary.addPhoto')}</Text>
                <Text className="text-sm text-muted-foreground">{t('diary.photoHint')}</Text>
              </View>
            )}
          </Pressable>
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
                  {t('diary.addPhoto')}
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

                {photoUri && (
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

        <StickySaveBar onPress={handleSave} isSaving={isSaving} disabled={!hasContent} />
      </View>
    </KeyboardAvoidingView>
  );
}

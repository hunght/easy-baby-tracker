import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/ui/NotificationContext';
import { Text } from '@/components/ui/text';

import { DIARY_ENTRIES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaryEntryPayload, DiaryEntryRecord } from '@/database/diary';
import {
  getDiaryEntries,
  getDiaryEntryById,
  saveDiaryEntry,
  updateDiaryEntry,
} from '@/database/diary';
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

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
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

  const { data: entries = [] } = useQuery<DiaryEntryRecord[]>({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    queryFn: () => getDiaryEntries(),
  });

  const mutation = useMutation({
    mutationFn: saveDiaryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTitle('');
      setContent('');
      setPhotoUri(null);
    },
    onError: (error) => {
      console.error('Failed to save diary entry:', error);
      showNotification(t('common.diarySaveError'), 'error');
    },
  });

  const hasContent = title.trim().length > 0 || content.trim().length > 0 || photoUri != null;
  const isSaving = mutation.isPending;

  const formattedEntries = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      date: new Date(entry.createdAt * 1000),
    }));
  }, [entries]);

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
      setPhotoUri(storedUri);
    } catch (error) {
      console.error(error);
      showNotification(t('common.photoSaveError'), 'error');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    const allowed = await requestPermission('camera');
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }
    await replacePhoto(result.assets[0]);
  };

  const handleChoosePhoto = async () => {
    const allowed = await requestPermission('library');
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }
    await replacePhoto(result.assets[0]);
  };

  const handleRemovePhoto = async () => {
    if (!photoUri) return;
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

    const payload: DiaryEntryPayload = {
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      photoUri: photoUri ?? undefined,
    };

    try {
      if (isEditing && id) {
        await updateDiaryEntry(id, payload);
      } else {
        await mutation.mutateAsync(payload);
      }
      // Manually trigger success for update case since we bypassed mutation
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY });
        showNotification(t('common.saveSuccess'), 'success');
        setTimeout(() => router.back(), 500);
      }
    } catch (error) {
      console.error(error);
      showNotification(t('common.diarySaveError'), 'error');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('diary.editTitle') : t('diary.title')}
        onSave={handleSave}
        isSaving={!hasContent || isSaving}
        closeLabel={t('common.close')}
        saveLabel={isSaving ? t('common.saving') : t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-15 gap-5" showsVerticalScrollIndicator={false}>
        <TextInput
          className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          value={title}
          onChangeText={setTitle}
          placeholder={t('diary.titlePlaceholder')}
          placeholderTextColor="#C4C4C4"
        />

        <TextInput
          className="min-h-35 rounded-xl border border-border bg-gray-50 px-4 py-3 text-base text-foreground"
          value={content}
          onChangeText={setContent}
          placeholder={t('diary.contentPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
          textAlignVertical="top"
        />

        <View className="h-55 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-violet-50">
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-full w-full" contentFit="cover" />
          ) : (
            <View className="items-center justify-center gap-2.5">
              <MaterialCommunityIcons name="image-plus" color="#B49BFF" size={32} />
              <Text className="font-semibold text-violet-600">{t('diary.addPhoto')}</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender py-3 ${
              photoProcessing ? 'opacity-60' : ''
            }`}
            onPress={handleTakePhoto}
            disabled={photoProcessing}>
            <MaterialCommunityIcons name="camera" color="#FFF" size={18} />
            <Text className="font-semibold text-white">{t('diary.takePhoto')}</Text>
          </Pressable>
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-lavender py-3 ${
              photoProcessing ? 'opacity-60' : ''
            }`}
            onPress={handleChoosePhoto}
            disabled={photoProcessing}>
            <MaterialCommunityIcons name="image" color="#B49BFF" size={18} />
            <Text className="font-semibold text-lavender">{t('diary.choosePhoto')}</Text>
          </Pressable>
        </View>

        {photoUri && (
          <Pressable
            className="flex-row items-center gap-1.5 self-start"
            onPress={handleRemovePhoto}>
            <MaterialCommunityIcons name="trash-can-outline" color="#FF7A9B" size={18} />
            <Text className="font-semibold text-pink-400">{t('diary.removePhoto')}</Text>
          </Pressable>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">{t('diary.entriesHeading')}</Text>
          <Text className="font-semibold text-violet-600">
            {t('common.entriesCount', { params: { count: formattedEntries.length } })}
          </Text>
        </View>

        {formattedEntries.length === 0 ? (
          <View className="items-center gap-3 rounded-2xl border border-gray-100 p-6">
            <MaterialCommunityIcons name="star-outline" size={36} color="#B49BFF" />
            <Text className="text-center text-violet-600">{t('diary.emptyState')}</Text>
          </View>
        ) : (
          formattedEntries.map((entry) => (
            <View
              key={entry.id}
              className="mt-3 gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-base font-semibold text-foreground">
                  {entry.title ?? t('diary.title')}
                </Text>
                <Text className="text-sm text-gray-400">
                  {entry.date.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {entry.photoUri ? (
                <Image
                  source={{ uri: entry.photoUri }}
                  className="h-40 w-full rounded-xl"
                  contentFit="cover"
                />
              ) : null}
              {entry.content ? (
                <Text className="text-base text-gray-600">{entry.content}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

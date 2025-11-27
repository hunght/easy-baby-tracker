import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { useNotification } from '@/components/ui/NotificationContext';

import { DIARY_ENTRIES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaryEntryPayload, DiaryEntryRecord } from '@/database/diary';
import { getDiaryEntries, getDiaryEntryById, saveDiaryEntry, updateDiaryEntry } from '@/database/diary';
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
    asset.fileName?.split('.').pop()?.toLowerCase() ??
    asset.uri.split('.').pop()?.split('?')[0];
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
        t('common.permissionDeniedDescription') ??
        'Please grant access in Settings to continue.'
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('diary.editTitle') : t('diary.title')}</Text>
        <Pressable onPress={handleSave} disabled={!hasContent || isSaving}>
          <Text
            style={[
              styles.saveButton,
              (!hasContent || isSaving) && styles.saveButtonDisabled,
            ]}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={t('diary.titlePlaceholder')}
          placeholderTextColor="#C4C4C4"
        />

        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder={t('diary.contentPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
        />

        <View style={styles.photoCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons name="image-plus" color="#B49BFF" size={32} />
              <Text style={styles.photoPlaceholderText}>{t('diary.addPhoto')}</Text>
            </View>
          )}
        </View>

        <View style={styles.photoActions}>
          <Pressable
            style={[styles.actionButton, photoProcessing && styles.actionButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={photoProcessing}>
            <MaterialCommunityIcons name="camera" color="#FFF" size={18} />
            <Text style={styles.actionButtonText}>{t('diary.takePhoto')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButtonOutline, photoProcessing && styles.actionButtonDisabled]}
            onPress={handleChoosePhoto}
            disabled={photoProcessing}>
            <MaterialCommunityIcons name="image" color="#B49BFF" size={18} />
            <Text style={styles.actionButtonOutlineText}>{t('diary.choosePhoto')}</Text>
          </Pressable>
        </View>

        {photoUri && (
          <Pressable style={styles.removePhotoButton} onPress={handleRemovePhoto}>
            <MaterialCommunityIcons name="trash-can-outline" color="#FF7A9B" size={18} />
            <Text style={styles.removePhotoText}>{t('diary.removePhoto')}</Text>
          </Pressable>
        )}

        <View style={styles.entriesHeader}>
          <Text style={styles.entriesTitle}>{t('diary.entriesHeading')}</Text>
          <Text style={styles.entriesCount}>
            {t('common.entriesCount', { params: { count: formattedEntries.length } })}
          </Text>
        </View>

        {formattedEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="star-outline" size={36} color="#B49BFF" />
            <Text style={styles.emptyStateText}>{t('diary.emptyState')}</Text>
          </View>
        ) : (
          formattedEntries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{entry.title ?? t('diary.title')}</Text>
                <Text style={styles.entryDate}>
                  {entry.date.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {entry.photoUri ? (
                <Image source={{ uri: entry.photoUri }} style={styles.entryPhoto} contentFit="cover" />
              ) : null}
              {entry.content ? <Text style={styles.entryContent}>{entry.content}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  saveButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  titleInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D2D2D',
    backgroundColor: '#FFF',
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D2D2D',
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
  },
  photoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#F6F2FF',
    height: 220,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoPlaceholderText: {
    color: '#7C6A99',
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B49BFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#B49BFF',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  actionButtonOutlineText: {
    color: '#B49BFF',
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  removePhotoText: {
    color: '#FF7A9B',
    fontWeight: '600',
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  entriesCount: {
    color: '#7C6A99',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    color: '#7C6A99',
    textAlign: 'center',
  },
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFF',
    marginTop: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#2D2D2D',
  },
  entryDate: {
    color: '#A4A4A4',
    fontSize: 13,
  },
  entryPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  entryContent: {
    fontSize: 15,
    color: '#4A4A4A',
  },
});


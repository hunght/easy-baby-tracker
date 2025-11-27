import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNotification } from '@/components/ui/NotificationContext';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { DIAPER_CHANGES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaperChangePayload, DiaperKind, PoopColor } from '@/database/diaper';
import { getDiaperChangeById, saveDiaperChange, updateDiaperChange } from '@/database/diaper';
import { useLocalization } from '@/localization/LocalizationProvider';

type DiaperTypeOption = {
  key: DiaperKind;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const diaperTypes: DiaperTypeOption[] = [
  { key: 'wet', labelKey: 'diaper.types.wet', icon: 'water-outline' },
  { key: 'soiled', labelKey: 'diaper.types.soiled', icon: 'triangle-outline' },
  { key: 'mixed', labelKey: 'diaper.types.mixed', icon: 'water-alert-outline' },
  { key: 'dry', labelKey: 'diaper.types.dry', icon: 'water-off-outline' },
];

const poopColors: { key: PoopColor; labelKey: string; color: string }[] = [
  { key: 'yellow', labelKey: 'diaper.poopColors.yellow', color: '#FFD700' },
  { key: 'brown', labelKey: 'diaper.poopColors.brown', color: '#8B4513' },
  { key: 'olive_green', labelKey: 'diaper.poopColors.olive_green', color: '#808000' },
  { key: 'dark_green', labelKey: 'diaper.poopColors.dark_green', color: '#006400' },
  { key: 'red', labelKey: 'diaper.poopColors.red', color: '#FF0000' },
  { key: 'black', labelKey: 'diaper.poopColors.black', color: '#000000' },
  { key: 'white', labelKey: 'diaper.poopColors.white', color: '#F5F5DC' },
];

export default function DiaperScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [diaperKind, setDiaperKind] = useState<DiaperKind>('wet');
  const [time, setTime] = useState(new Date());
  const [wetness, setWetness] = useState<number | undefined>(undefined);
  const [color, setColor] = useState<PoopColor | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: isLoadingData } = useQuery({
    queryKey: [DIAPER_CHANGES_QUERY_KEY, id],
    queryFn: () => (id ? getDiaperChangeById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setDiaperKind(existingData.kind);
      setTime(new Date(existingData.time * 1000));
      setWetness(existingData.wetness ?? undefined);
      // Cast string to PoopColor if it matches, otherwise undefined
      const loadedColor = existingData.color as PoopColor | null;
      setColor(loadedColor ?? undefined);
      setNotes(existingData.notes ?? '');
    }
  }, [existingData]);


  const mutation = useMutation({
    mutationFn: async (payload: DiaperChangePayload) => {
      if (isEditing && id) {
        await updateDiaperChange(id, payload);
      } else {
        await saveDiaperChange(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAPER_CHANGES_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save diaper change:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const payload = {
        kind: diaperKind,
        time: Math.floor(time.getTime() / 1000),
        wetness: wetness,
        color: color,
        notes: notes || undefined,
      };

      await mutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isLoadingData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF5C8D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('diaper.editTitle') : t('diaper.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Diaper Type Selection */}
        <View style={styles.segmentedControl}>
          {diaperTypes.map((type, index) => (
            <Pressable
              key={type.key}
              onPress={() => setDiaperKind(type.key)}
              style={[
                styles.segment,
                diaperKind === type.key && styles.segmentActive,
                index > 0 && styles.segmentBorder,
              ]}>
              <MaterialCommunityIcons
                name={type.icon}
                size={20}
                color={diaperKind === type.key ? '#FFF' : '#666'}
              />
              <Text style={[styles.segmentText, diaperKind === type.key && styles.segmentTextActive]}>
                {t(type.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Time */}
        <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

        {/* Wetness (Optional) */}
        {diaperKind !== 'dry' && (
          <View style={styles.section}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('common.wetness')}</Text>
              <Text style={styles.optionalLabel}>{t('common.optional')}</Text>
            </View>
            <View style={styles.wetnessContainer}>
              {[1, 2, 3].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setWetness(wetness === level ? undefined : level)}
                  style={styles.wetnessButton}>
                  <MaterialCommunityIcons
                    name="water"
                    size={24}
                    color={wetness && wetness >= level ? '#FF5C8D' : '#E0E0E0'}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Color of Poop (Optional) */}
        {(diaperKind === 'soiled' || diaperKind === 'mixed') && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>{t('common.colorOfPoop')}</Text>
            <Text style={styles.optionalLabel}>{t('common.optional')}</Text>
            <View style={styles.colorContainer}>
              {poopColors.map((colorOption) => (
                <Pressable
                  key={colorOption.key}
                  onPress={() => setColor(color === colorOption.key ? undefined : colorOption.key)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colorOption.color },
                    color === colorOption.key && styles.colorSwatchSelected,
                  ]}>
                  {color === colorOption.key && (
                    <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: '#FF5C8D',
  },
  segmentBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  segmentText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#FFF',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  optionalLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  wetnessContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  wetnessButton: {
    padding: 8,
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderColor: '#FF5C8D',
    borderWidth: 3,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#2D2D2D',
    marginTop: 12,
  },
});



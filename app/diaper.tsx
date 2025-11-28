import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { TimePickerField } from '@/components/TimePickerField';
import { DIAPER_CHANGES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaperChangePayload, DiaperKind, PoopColor } from '@/database/diaper';
import { getDiaperChangeById, saveDiaperChange, updateDiaperChange } from '@/database/diaper';
import { useLocalization } from '@/localization/LocalizationProvider';

type DiaperTypeOption = {
  key: DiaperKind;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

// Type guard to check if a value is a valid PoopColor
function isPoopColor(value: unknown): value is PoopColor {
  if (typeof value !== 'string') {
    return false;
  }
  const validColors: string[] = [
    'yellow',
    'brown',
    'olive_green',
    'dark_green',
    'red',
    'black',
    'white',
  ];
  return validColors.includes(value);
}

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
      // Use type guard to safely check if color is valid PoopColor
      const loadedColor = isPoopColor(existingData.color) ? existingData.color : undefined;
      setColor(loadedColor);
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#FF5C8D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('diaper.editTitle') : t('diaper.title')}
        onSave={handleSave}
        isSaving={isSaving}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Diaper Type Selection */}
        <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-card">
          {diaperTypes.map((type, index) => (
            <Pressable
              key={type.key}
              onPress={() => setDiaperKind(type.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${
                diaperKind === type.key ? 'bg-accent' : ''
              } ${index > 0 ? 'border-l border-border' : ''}`}>
              <MaterialCommunityIcons
                name={type.icon}
                size={20}
                color={diaperKind === type.key ? '#FFF' : '#666'}
              />
              <Text
                className={`text-sm font-semibold ${diaperKind === type.key ? 'text-white' : 'text-muted-foreground'}`}>
                {t(type.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Time */}
        <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

        {/* Wetness (Optional) */}
        {diaperKind !== 'dry' && (
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.wetness')}
              </Text>
              <Text className="mt-0.5 text-sm text-gray-400">{t('common.optional')}</Text>
            </View>
            <View className="mt-3 flex-row gap-4">
              {[1, 2, 3].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setWetness(wetness === level ? undefined : level)}
                  className="p-2">
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
          <View className="mb-6">
            <Text className="text-base font-medium text-muted-foreground">
              {t('common.colorOfPoop')}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-400">{t('common.optional')}</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {poopColors.map((colorOption) => (
                <Pressable
                  key={colorOption.key}
                  onPress={() => setColor(color === colorOption.key ? undefined : colorOption.key)}
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    color === colorOption.key
                      ? 'border-[3px] border-accent'
                      : 'border-2 border-border'
                  }`}
                  style={{ backgroundColor: colorOption.color }}>
                  {color === colorOption.key && (
                    <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        <Input
          className="mt-3 min-h-20"
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
}

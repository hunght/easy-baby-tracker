import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/ui/NotificationContext';
import { Text } from '@/components/ui/text';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { GROWTH_RECORDS_QUERY_KEY } from '@/constants/query-keys';
import type { GrowthRecordPayload } from '@/database/growth';
import { getGrowthRecordById, saveGrowthRecord, updateGrowthRecord } from '@/database/growth';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function GrowthScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [time, setTime] = useState(new Date());
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [GROWTH_RECORDS_QUERY_KEY, id],
    queryFn: () => (id ? getGrowthRecordById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setTime(new Date(existingData.time * 1000));
      setWeightKg(existingData.weightKg ? existingData.weightKg.toString().replace('.', ',') : '');
      setHeightCm(existingData.heightCm ? existingData.heightCm.toString().replace('.', ',') : '');
      setHeadCircumferenceCm(
        existingData.headCircumferenceCm
          ? existingData.headCircumferenceCm.toString().replace('.', ',')
          : ''
      );
      setNotes(existingData.notes ?? '');
    }
  }, [existingData]);

  const parseNumericValue = (value: string): number | undefined => {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? undefined : parsed;
  };

  const formatNumericValue = (value: string): string => {
    // Allow empty string, numbers, and comma as decimal separator
    if (value === '') return '';
    // Replace comma with dot for parsing, but allow user to type comma
    return value;
  };

  const mutation = useMutation({
    mutationFn: async (payload: GrowthRecordPayload) => {
      if (isEditing && id) {
        await updateGrowthRecord(id, payload);
      } else {
        await saveGrowthRecord(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROWTH_RECORDS_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save growth record:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSave = async () => {
    if (isSaving) return;

    // At least one measurement should be provided
    const weight = parseNumericValue(weightKg);
    const height = parseNumericValue(heightCm);
    const headCircumference = parseNumericValue(headCircumferenceCm);

    if (!weight && !height && !headCircumference) {
      return; // Don't save if no measurements provided
    }

    setIsSaving(true);
    try {
      const payload = {
        time: Math.floor(time.getTime() / 1000),
        weightKg: weight,
        heightCm: height,
        headCircumferenceCm: headCircumference,
        notes: notes || undefined,
      };

      await mutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = () => {
    const weight = parseNumericValue(weightKg);
    const height = parseNumericValue(heightCm);
    const headCircumference = parseNumericValue(headCircumferenceCm);
    return weight !== undefined || height !== undefined || headCircumference !== undefined;
  };

  const displayValue = (value: string): string => {
    if (!value) return '0,00';
    const num = parseNumericValue(value);
    return num !== undefined ? num.toFixed(2).replace('.', ',') : '0,00';
  };

  return (
    <View className="flex-1 bg-white">
      <ModalHeader
        title={isEditing ? t('growth.editTitle') : t('growth.title')}
        onSave={handleSave}
        isSaving={isSaving || !canSave()}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Time */}
        <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

        <View className="my-4 h-px bg-border" />

        {/* Weight */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.weight')}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-base font-semibold text-accent">{displayValue(weightKg)}</Text>
            <Text className="text-base text-foreground">{t('common.unitKg')}</Text>
          </View>
        </View>
        <TextInput
          className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
          value={weightKg}
          onChangeText={(text) => setWeightKg(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View className="my-4 h-px bg-border" />

        {/* Height */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.height')}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-base font-semibold text-accent">{displayValue(heightCm)}</Text>
            <Text className="text-base text-foreground">{t('common.unitCm')}</Text>
          </View>
        </View>
        <TextInput
          className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
          value={heightCm}
          onChangeText={(text) => setHeightCm(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View className="my-4 h-px bg-border" />

        {/* Head Circumference */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">
            {t('common.headCircumference')}
          </Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-base font-semibold text-accent">
              {displayValue(headCircumferenceCm)}
            </Text>
            <Text className="text-base text-foreground">{t('common.unitCm')}</Text>
          </View>
        </View>
        <TextInput
          className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
          value={headCircumferenceCm}
          onChangeText={(text) => setHeadCircumferenceCm(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View className="my-4 h-px bg-border" />

        {/* Notes */}
        <TextInput
          className="mt-3 min-h-20 rounded-xl border border-border bg-gray-50 px-4 py-3 text-base text-foreground"
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNotification } from '@/components/ui/NotificationContext';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('growth.editTitle') : t('growth.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving || !canSave()}>
          <Text style={[styles.saveButton, (isSaving || !canSave()) && styles.saveButtonDisabled]}>
            {t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Time */}
        <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

        <View style={styles.divider} />

        {/* Weight */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.weight')}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{displayValue(weightKg)}</Text>
            <Text style={styles.unitText}>{t('common.unitKg')}</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={weightKg}
          onChangeText={(text) => setWeightKg(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View style={styles.divider} />

        {/* Height */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.height')}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{displayValue(heightCm)}</Text>
            <Text style={styles.unitText}>{t('common.unitCm')}</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={heightCm}
          onChangeText={(text) => setHeightCm(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View style={styles.divider} />

        {/* Head Circumference */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.headCircumference')}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{displayValue(headCircumferenceCm)}</Text>
            <Text style={styles.unitText}>{t('common.unitCm')}</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={headCircumferenceCm}
          onChangeText={(text) => setHeadCircumferenceCm(formatNumericValue(text))}
          placeholder={t('growth.placeholder')}
          placeholderTextColor="#C4C4C4"
          keyboardType="decimal-pad"
        />

        <View style={styles.divider} />

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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  valueText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  unitText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#2D2D2D',
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


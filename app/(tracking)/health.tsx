import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TimePickerField } from '@/components/TimePickerField';
import { HEALTH_RECORDS_QUERY_KEY } from '@/constants/query-keys';
import type { HealthRecordPayload, HealthRecordType, MedicineType } from '@/database/health';
import { getHealthRecordById, saveHealthRecord, updateHealthRecord } from '@/database/health';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';

type HealthTabOption = {
  key: HealthRecordType;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const healthTabs: HealthTabOption[] = [
  { key: 'temperature', labelKey: 'health.tabs.temperature', icon: 'pencil-outline' },
  { key: 'medicine', labelKey: 'health.tabs.medicine', icon: 'pill' },
  { key: 'symptoms', labelKey: 'health.tabs.symptoms', icon: 'magnify' },
];

export default function HealthScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const brandColors = useBrandColor();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState<HealthRecordType>('temperature');
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Temperature state
  const [temperature, setTemperature] = useState(36.8);

  // Medicine state
  const [medicineType, setMedicineType] = useState<MedicineType>('medication');
  const [medication, setMedication] = useState('');

  // Symptoms state
  const [symptoms, setSymptoms] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [HEALTH_RECORDS_QUERY_KEY, id],
    queryFn: () => (id ? getHealthRecordById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setActiveTab(existingData.type);
      setTime(new Date(existingData.time * 1000));
      setNotes(existingData.notes ?? '');

      if (existingData.type === 'temperature') {
        setTemperature(existingData.temperature ?? 36.8);
      } else if (existingData.type === 'medicine') {
        setMedicineType(existingData.medicineType ?? 'medication');
        setMedication(existingData.medication ?? '');
      } else if (existingData.type === 'symptoms') {
        setSymptoms(existingData.symptoms ?? '');
      }
    }
  }, [existingData]);

  const _mutation = useMutation({
    mutationFn: async (payload: HealthRecordPayload) => {
      // This is just a placeholder, the actual call is in handleSave
      // We can't easily use mutationFn here because we need to switch between save and update
      // But we can wrap it
      if (isEditing && id) {
        return updateHealthRecord(id, payload);
      } else {
        return saveHealthRecord(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_RECORDS_QUERY_KEY });
      router.back();
    },
  });

  const handleSave = async () => {
    if (isSaving) return;

    // Validation
    if (activeTab === 'temperature' && !temperature) return;
    if (activeTab === 'medicine' && !medication.trim()) return;
    if (activeTab === 'symptoms' && !symptoms.trim()) return;

    setIsSaving(true);
    try {
      const payload: HealthRecordPayload = {
        type: activeTab,
        time: Math.floor(time.getTime() / 1000),
        notes: notes || undefined,
      };

      if (activeTab === 'temperature') {
        payload.temperature = temperature;
      } else if (activeTab === 'medicine') {
        payload.medicineType = medicineType;
        payload.medication = medication.trim();
      } else if (activeTab === 'symptoms') {
        payload.symptoms = symptoms.trim();
      }

      if (isEditing && id) {
        await updateHealthRecord(id, payload);
      } else {
        await saveHealthRecord(payload);
      }

      queryClient.invalidateQueries({ queryKey: HEALTH_RECORDS_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error('Failed to save health record:', error);
      showNotification(t('common.saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = () => {
    if (activeTab === 'temperature') return temperature > 0;
    if (activeTab === 'medicine') return medication.trim().length > 0;
    if (activeTab === 'symptoms') return symptoms.trim().length > 0;
    return false;
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('health.editTitle') : t('health.title')}
        onSave={handleSave}
        isSaving={isSaving || !canSave()}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Tab Selection */}
        <View className="mb-6">
          <ToggleGroup
            type="single"
            value={activeTab}
            onValueChange={(value) => {
              if (
                value &&
                (value === 'temperature' || value === 'medicine' || value === 'symptoms')
              ) {
                setActiveTab(value);
              }
            }}
            variant="outline"
            className="w-full">
            {healthTabs.map((tab, index) => (
              <ToggleGroupItem
                key={tab.key}
                value={tab.key}
                isFirst={index === 0}
                isLast={index === healthTabs.length - 1}
                className="flex-1 flex-row items-center justify-center gap-1.5"
                aria-label={t(tab.labelKey)}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.key ? brandColors.colors.white : '#666666'}
                />
                <Text>{t(tab.labelKey)}</Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </View>

        {/* Time */}
        <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

        {/* Temperature Tab */}
        {activeTab === 'temperature' && (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.temperature')}
              </Text>
              <Text className="text-base font-semibold text-accent">
                {temperature.toFixed(1)} °C
              </Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={34}
              maximumValue={42}
              step={0.1}
              value={temperature}
              onValueChange={setTemperature}
              minimumTrackTintColor={brandColors.colors.accent}
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor={brandColors.colors.white}
            />
            <View className="mb-6 flex-row justify-between px-1">
              {[34, 35, 36, 37, 38, 39, 40, 41, 42].map((value) => (
                <Text key={value} className="text-xs text-muted-foreground">
                  {value}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Medicine Tab */}
        {activeTab === 'medicine' && (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.medicineType')}
                </Text>
                <MaterialCommunityIcons name="information-outline" size={16} color="#999999" />
              </View>
            </View>
            <View className="mb-6">
              <ToggleGroup
                type="single"
                value={medicineType}
                onValueChange={(value) => {
                  if (value && (value === 'medication' || value === 'vaccine')) {
                    setMedicineType(value);
                  }
                }}
                variant="outline"
                className="w-full">
                <ToggleGroupItem
                  value="medication"
                  isFirst={true}
                  isLast={false}
                  className="flex-1 flex-row items-center justify-center gap-1.5"
                  aria-label={t('health.medicineTypes.medication')}>
                  <MaterialCommunityIcons
                    name="pill"
                    size={18}
                    color={medicineType === 'medication' ? brandColors.colors.white : '#666666'}
                  />
                  <Text>{t('health.medicineTypes.medication')}</Text>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="vaccine"
                  isFirst={false}
                  isLast={true}
                  className="flex-1 flex-row items-center justify-center gap-1.5"
                  aria-label={t('health.medicineTypes.vaccine')}>
                  <MaterialCommunityIcons
                    name="needle"
                    size={18}
                    color={medicineType === 'vaccine' ? brandColors.colors.white : '#666666'}
                  />
                  <Text>{t('health.medicineTypes.vaccine')}</Text>
                </ToggleGroupItem>
              </ToggleGroup>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.medication')}
              </Text>
              <Text className="text-base font-semibold text-accent">
                {medication || t('common.undefined')}
              </Text>
            </View>
            <Input
              className="mb-6"
              value={medication}
              onChangeText={setMedication}
              placeholder={t('health.medicationPlaceholder')}
            />
          </>
        )}

        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.symptoms')}
              </Text>
            </View>
            <Input
              className="mb-6 min-h-[120px]"
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder={t('health.symptomsPlaceholder')}
              multiline
              textAlignVertical="top"
            />
          </>
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

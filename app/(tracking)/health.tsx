import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { StickySaveBar } from '@/components/StickySaveBar';
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

// Temperature presets for quick selection
const temperaturePresets = [36.5, 37.0, 37.5, 38.0, 38.5, 39.0];

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

  const handleTabChange = (value: string | undefined) => {
    if (value && (value === 'temperature' || value === 'medicine' || value === 'symptoms')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(value);
    }
  };

  const handleMedicineTypeChange = (value: string | undefined) => {
    if (value && (value === 'medication' || value === 'vaccine')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMedicineType(value);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Validation
    if (activeTab === 'temperature' && !temperature) return;
    if (activeTab === 'medicine' && !medication.trim()) return;
    if (activeTab === 'symptoms' && !symptoms.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  // Determine temperature status color
  const getTemperatureStatus = () => {
    if (temperature < 36.0) return { color: '#3B82F6', label: t('health.tempLow') };
    if (temperature <= 37.5) return { color: '#22C55E', label: t('health.tempNormal') };
    if (temperature <= 38.5) return { color: '#F59E0B', label: t('health.tempMild') };
    return { color: '#EF4444', label: t('health.tempHigh') };
  };

  const tempStatus = getTemperatureStatus();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="bg-background">
      <View className="flex-1 bg-background">
        <ModalHeader
          title={isEditing ? t('health.editTitle') : t('health.title')}
          closeLabel={t('common.close')}
        />

        <ScrollView
          contentContainerClassName="p-5 pb-28"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Tab Selection */}
          <View className="mb-6">
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={handleTabChange}
              variant="outline"
              className="w-full">
              {healthTabs.map((tab, index) => (
                <ToggleGroupItem
                  key={tab.key}
                  value={tab.key}
                  isFirst={index === 0}
                  isLast={index === healthTabs.length - 1}
                  className="flex-1 flex-row items-center justify-center"
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
              {/* Temperature Display */}
              <View className="mb-4 items-center rounded-2xl border border-border bg-card p-6">
                <Text className="text-5xl font-bold" style={{ color: tempStatus.color }}>
                  {temperature.toFixed(1)}°C
                </Text>
                <Text className="mt-2 text-base font-medium" style={{ color: tempStatus.color }}>
                  {tempStatus.label}
                </Text>
              </View>

              {/* Quick Temperature Presets */}
              <View className="mb-4 flex-row flex-wrap justify-between gap-2">
                {temperaturePresets.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTemperature(preset);
                    }}
                    className={`h-12 w-[30%] items-center justify-center rounded-xl border ${
                      temperature === preset
                        ? 'border-accent bg-accent'
                        : 'border-border bg-muted/30'
                    }`}>
                    <Text
                      className={`text-base font-semibold ${
                        temperature === preset ? 'text-white' : 'text-foreground'
                      }`}>
                      {preset.toFixed(1)}°
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Slider for fine-tuning */}
              <Slider
                style={{ width: '100%', height: 48 }}
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
                {[34, 36, 38, 40, 42].map((value) => (
                  <Text key={value} className="text-xs text-muted-foreground">
                    {value}°
                  </Text>
                ))}
              </View>
            </>
          )}

          {/* Medicine Tab */}
          {activeTab === 'medicine' && (
            <>
              <View className="mb-3">
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.medicineType')}
                </Text>
              </View>
              <View className="mb-6">
                <ToggleGroup
                  type="single"
                  value={medicineType}
                  onValueChange={handleMedicineTypeChange}
                  variant="outline"
                  className="w-full">
                  <ToggleGroupItem
                    value="medication"
                    isFirst={true}
                    isLast={false}
                    className="flex-1 flex-row items-center justify-center"
                    aria-label={t('health.medicineTypes.medication')}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={20}
                      color={medicineType === 'medication' ? brandColors.colors.white : '#666666'}
                    />
                    <Text>{t('health.medicineTypes.medication')}</Text>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="vaccine"
                    isFirst={false}
                    isLast={true}
                    className="flex-1 flex-row items-center justify-center"
                    aria-label={t('health.medicineTypes.vaccine')}>
                    <MaterialCommunityIcons
                      name="needle"
                      size={20}
                      color={medicineType === 'vaccine' ? brandColors.colors.white : '#666666'}
                    />
                    <Text>{t('health.medicineTypes.vaccine')}</Text>
                  </ToggleGroupItem>
                </ToggleGroup>
              </View>

              <View className="mb-3">
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.medication')}
                </Text>
              </View>
              <Input
                className="mb-6 h-12"
                value={medication}
                onChangeText={setMedication}
                placeholder={t('health.medicationPlaceholder')}
              />
            </>
          )}

          {/* Symptoms Tab */}
          {activeTab === 'symptoms' && (
            <>
              <View className="mb-3">
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.symptoms')}
                </Text>
              </View>
              <Input
                className="mb-6 min-h-[150px]"
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
            className="min-h-20"
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notesPlaceholder')}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <StickySaveBar onPress={handleSave} isSaving={isSaving} disabled={!canSave()} />
      </View>
    </KeyboardAvoidingView>
  );
}

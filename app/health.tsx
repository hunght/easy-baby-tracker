import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/ui/NotificationContext';
import { Text } from '@/components/ui/text';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { HEALTH_RECORDS_QUERY_KEY } from '@/constants/query-keys';
import type { HealthRecordPayload, HealthRecordType, MedicineType } from '@/database/health';
import { getHealthRecordById, saveHealthRecord, updateHealthRecord } from '@/database/health';
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
        <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-white">
          {healthTabs.map((tab, index) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${
                activeTab === tab.key ? 'bg-accent' : ''
              } ${index > 0 ? 'border-l border-border' : ''}`}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? '#FFF' : '#666'}
              />
              <Text
                className={`text-sm font-semibold ${activeTab === tab.key ? 'text-white' : 'text-muted-foreground'}`}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          ))}
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
              minimumTrackTintColor="#FF5C8D"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#FFF"
            />
            <View className="mb-6 flex-row justify-between px-1">
              {[34, 35, 36, 37, 38, 39, 40, 41, 42].map((value) => (
                <Text key={value} className="text-xs text-gray-400">
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
                <MaterialCommunityIcons name="information-outline" size={16} color="#999" />
              </View>
            </View>
            <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-card">
              <Pressable
                onPress={() => setMedicineType('medication')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${
                  medicineType === 'medication' ? 'bg-accent' : ''
                }`}>
                <MaterialCommunityIcons
                  name="pill"
                  size={18}
                  color={medicineType === 'medication' ? '#FFF' : '#666'}
                />
                <Text
                  className={`text-sm font-semibold ${
                    medicineType === 'medication' ? 'text-white' : 'text-muted-foreground'
                  }`}>
                  {t('health.medicineTypes.medication')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMedicineType('vaccine')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 border-l border-border py-3 ${
                  medicineType === 'vaccine' ? 'bg-accent' : ''
                }`}>
                <MaterialCommunityIcons
                  name="needle"
                  size={18}
                  color={medicineType === 'vaccine' ? '#FFF' : '#666'}
                />
                <Text
                  className={`text-sm font-semibold ${medicineType === 'vaccine' ? 'text-white' : 'text-muted-foreground'}`}>
                  {t('health.medicineTypes.vaccine')}
                </Text>
              </Pressable>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.medication')}
              </Text>
              <Text className="text-base font-semibold text-accent">
                {medication || t('common.undefined')}
              </Text>
            </View>
            <TextInput
              className="mb-6 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              value={medication}
              onChangeText={setMedication}
              placeholder={t('health.medicationPlaceholder')}
              placeholderTextColor="#C4C4C4"
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
            <TextInput
              className="min-h-30 mb-6 rounded-xl border border-border bg-gray-50 px-4 py-3 text-base text-foreground"
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder={t('health.symptomsPlaceholder')}
              placeholderTextColor="#C4C4C4"
              multiline
              textAlignVertical="top"
            />
          </>
        )}

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

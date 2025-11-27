import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNotification } from '@/components/ui/NotificationContext';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('health.editTitle') : t('health.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving || !canSave()}>
          <Text style={[styles.saveButton, (isSaving || !canSave()) && styles.saveButtonDisabled]}>
            {t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tab Selection */}
        <View style={styles.tabControl}>
          {healthTabs.map((tab, index) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
                index > 0 && styles.tabBorder,
              ]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? '#FFF' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
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
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('common.temperature')}</Text>
              <Text style={styles.temperatureText}>{temperature.toFixed(1)} °C</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={34}
              maximumValue={42}
              step={0.1}
              value={temperature}
              onValueChange={setTemperature}
              minimumTrackTintColor="#FF5C8D"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#FFF"
            />
            <View style={styles.sliderLabels}>
              {[34, 35, 36, 37, 38, 39, 40, 41, 42].map((value) => (
                <Text key={value} style={styles.sliderLabel}>
                  {value}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Medicine Tab */}
        {activeTab === 'medicine' && (
          <>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>{t('common.medicineType')}</Text>
                <MaterialCommunityIcons name="information-outline" size={16} color="#999" />
              </View>
            </View>
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setMedicineType('medication')}
                style={[
                  styles.segment,
                  medicineType === 'medication' && styles.segmentActive,
                ]}>
                <MaterialCommunityIcons
                  name="pill"
                  size={18}
                  color={medicineType === 'medication' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.segmentText,
                    medicineType === 'medication' && styles.segmentTextActive,
                  ]}>
                  {t('health.medicineTypes.medication')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMedicineType('vaccine')}
                style={[
                  styles.segment,
                  medicineType === 'vaccine' && styles.segmentActive,
                  styles.segmentBorder,
                ]}>
                <MaterialCommunityIcons
                  name="needle"
                  size={18}
                  color={medicineType === 'vaccine' ? '#FFF' : '#666'}
                />
                <Text
                  style={[styles.segmentText, medicineType === 'vaccine' && styles.segmentTextActive]}>
                  {t('health.medicineTypes.vaccine')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('common.medication')}</Text>
              <Text style={styles.undefinedText}>{medication || t('common.undefined')}</Text>
            </View>
            <TextInput
              style={styles.input}
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
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('common.symptoms')}</Text>
            </View>
            <TextInput
              style={styles.symptomsInput}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder={t('health.symptomsPlaceholder')}
              placeholderTextColor="#C4C4C4"
              multiline
            />
          </>
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
  tabControl: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FF5C8D',
  },
  tabBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFF',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  temperatureText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  undefinedText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#999',
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
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginBottom: 24,
    fontSize: 16,
    color: '#2D2D2D',
  },
  symptomsInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#2D2D2D',
    marginBottom: 24,
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



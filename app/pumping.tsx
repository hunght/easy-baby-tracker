import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateTimePickerModal } from '@/components/ui/DateTimePickerModal';
import { useNotification } from '@/components/ui/NotificationContext';
import { PUMPING_INVENTORY_QUERY_KEY, PUMPINGS_QUERY_KEY } from '@/constants/query-keys';
import type { PumpingPayload } from '@/database/pumping';
import { getPumpingById, getPumpingInventory, savePumping, updatePumping } from '@/database/pumping';
import { useLocalization } from '@/localization/LocalizationProvider';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PumpingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Amounts
  const [leftAmountMl, setLeftAmountMl] = useState(15);
  const [rightAmountMl, setRightAmountMl] = useState(15);

  // Timers
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);
  const [leftTimerActive, setLeftTimerActive] = useState(false);
  const [rightTimerActive, setRightTimerActive] = useState(false);
  const leftTimerRef = useRef<number | null>(null);
  const rightTimerRef = useRef<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [PUMPINGS_QUERY_KEY, id],
    queryFn: () => (id ? getPumpingById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setStartTime(new Date(existingData.startTime * 1000));
      setNotes(existingData.notes ?? '');
      setLeftAmountMl(existingData.leftAmountMl ?? 0);
      setRightAmountMl(existingData.rightAmountMl ?? 0);
      setLeftDuration(existingData.leftDuration ?? 0);
      setRightDuration(existingData.rightDuration ?? 0);
    }
  }, [existingData]);

  // Fetch inventory
  const { data: inventory = 0 } = useQuery<number>({
    queryKey: PUMPING_INVENTORY_QUERY_KEY,
    queryFn: () => getPumpingInventory(),
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (leftTimerRef.current) clearInterval(leftTimerRef.current);
      if (rightTimerRef.current) clearInterval(rightTimerRef.current);
    };
  }, []);

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setStartTime(selectedDate);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const toggleLeftTimer = () => {
    if (leftTimerActive) {
      if (leftTimerRef.current) {
        clearInterval(leftTimerRef.current);
        leftTimerRef.current = null;
      }
      setLeftTimerActive(false);
    } else {
      setLeftTimerActive(true);
      leftTimerRef.current = setInterval(() => {
        setLeftDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const toggleRightTimer = () => {
    if (rightTimerActive) {
      if (rightTimerRef.current) {
        clearInterval(rightTimerRef.current);
        rightTimerRef.current = null;
      }
      setRightTimerActive(false);
    } else {
      setRightTimerActive(true);
      rightTimerRef.current = setInterval(() => {
        setRightDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const mutation = useMutation({
    mutationFn: async (payload: PumpingPayload) => {
      if (isEditing && id) {
        await updatePumping(id, payload);
      } else {
        await savePumping(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUMPINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUMPING_INVENTORY_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save pumping:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const totalAmount = leftAmountMl + rightAmountMl;
  const totalDuration = leftDuration + rightDuration;

  const handleSave = async () => {
    if (isSaving || totalAmount === 0) return;

    setIsSaving(true);
    try {
      const payload = {
        startTime: Math.floor(startTime.getTime() / 1000),
        amountMl: totalAmount,
        leftAmountMl: leftAmountMl > 0 ? leftAmountMl : undefined,
        rightAmountMl: rightAmountMl > 0 ? rightAmountMl : undefined,
        leftDuration: leftDuration > 0 ? leftDuration : undefined,
        rightDuration: rightDuration > 0 ? rightDuration : undefined,
        duration: totalDuration > 0 ? totalDuration : undefined,
        notes: notes || undefined,
      };

      await mutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('pumping.editTitle') : t('pumping.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving || totalAmount === 0}>
          <Text style={[styles.saveButton, (isSaving || totalAmount === 0) && styles.saveButtonDisabled]}>
            {t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Inventory */}
        <View style={styles.inventoryBox}>
          <MaterialCommunityIcons name="package-variant" size={20} color="#666" />
          <Text style={styles.inventoryLabel}>{t('common.inventory')}</Text>
          <Text style={styles.inventoryAmount}>
            {inventory.toFixed(1)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Starts */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.starts')}</Text>
          <Pressable onPress={() => setShowTimePicker(true)}>
            <Text style={styles.setTimeButton}>{t('common.setTime')}</Text>
          </Pressable>
        </View>

        <DateTimePickerModal
          visible={showTimePicker}
          value={startTime}
          onClose={() => setShowTimePicker(false)}
          onChange={handleTimeChange}
        />

        {/* Amount */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.amount')}</Text>
          <Text style={styles.amountText}>
            {totalAmount.toFixed(1)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Left Amount */}
        <View style={styles.sideSection}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('pumping.left')}</Text>
            <Text style={styles.amountText}>
              {leftAmountMl.toFixed(2)} {t('common.unitMl')}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={leftAmountMl}
            onValueChange={setLeftAmountMl}
            minimumTrackTintColor="#FF5C8D"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FFF"
          />
          <View style={styles.sliderLabels}>
            {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
              <Text key={value} style={styles.sliderLabel}>
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Right Amount */}
        <View style={styles.sideSection}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('pumping.right')}</Text>
            <Text style={styles.amountText}>
              {rightAmountMl.toFixed(2)} {t('common.unitMl')}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={rightAmountMl}
            onValueChange={setRightAmountMl}
            minimumTrackTintColor="#FF5C8D"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FFF"
          />
          <View style={styles.sliderLabels}>
            {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
              <Text key={value} style={styles.sliderLabel}>
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Duration */}
        {isEditing ? (
          // Edit Mode: Manual Inputs
          <View style={styles.manualInputContainer}>
            <View style={styles.manualInputRow}>
              <Text style={styles.fieldLabel}>{t('common.leftShort')}</Text>
              <View style={styles.durationInputWrapper}>
                <TextInput
                  style={styles.durationInput}
                  value={Math.floor(leftDuration / 60).toString()}
                  onChangeText={(text) => {
                    const mins = parseInt(text) || 0;
                    setLeftDuration(mins * 60);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text style={styles.unitText}>{t('common.unitMin')}</Text>
              </View>
            </View>
            <View style={styles.manualInputRow}>
              <Text style={styles.fieldLabel}>{t('common.rightShort')}</Text>
              <View style={styles.durationInputWrapper}>
                <TextInput
                  style={styles.durationInput}
                  value={Math.floor(rightDuration / 60).toString()}
                  onChangeText={(text) => {
                    const mins = parseInt(text) || 0;
                    setRightDuration(mins * 60);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text style={styles.unitText}>{t('common.unitMin')}</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('common.totalDuration')}</Text>
              <Text style={styles.durationText}>
                {formatTime(totalDuration)}
              </Text>
            </View>
          </View>
        ) : (
          // Create Mode: Timers
          <>
            <View style={styles.fieldRow}>
              <View>
                <Text style={styles.fieldLabel}>{t('common.duration')}</Text>
                <Text style={styles.optionalLabel}>{t('common.optional')}</Text>
              </View>
              <Text style={styles.durationText}>
                {t('common.seconds', { params: { value: totalDuration } })}
              </Text>
            </View>

            {/* Timers */}
            <View style={styles.timersContainer}>
              <View style={styles.timerWrapper}>
                <Pressable style={styles.timerButton} onPress={toggleLeftTimer}>
                  <MaterialCommunityIcons
                    name={leftTimerActive ? 'pause' : 'play'}
                    size={24}
                    color="#FFF"
                  />
                </Pressable>
                <Text style={styles.timerLabel}>
                  {t('common.leftShort')}: {formatTime(leftDuration)}
                </Text>
              </View>

              <View style={styles.timerWrapper}>
                <Pressable style={styles.timerButton} onPress={toggleRightTimer}>
                  <MaterialCommunityIcons
                    name={rightTimerActive ? 'pause' : 'play'}
                    size={24}
                    color="#FFF"
                  />
                </Pressable>
                <Text style={styles.timerLabel}>
                  {t('common.rightShort')}: {formatTime(rightDuration)}
                </Text>
              </View>
            </View>
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
  inventoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  inventoryLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  inventoryAmount: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
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
  setTimeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  durationText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  sideSection: {
    marginBottom: 24,
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
  },
  sliderLabel: {
    fontSize: 10,
    color: '#999',
  },
  timersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  timerWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  timerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF5C8D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    fontSize: 16,
    color: '#2D2D2D',
    fontWeight: '500',
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
  manualInputContainer: {
    gap: 12,
    marginBottom: 24,
  },
  manualInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    color: '#2D2D2D',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
  },
});


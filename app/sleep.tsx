import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateTimePickerModal } from '@/components/ui/DateTimePickerModal';
import { useNotification } from '@/components/ui/NotificationContext';
import { SLEEP_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import type { SleepSessionKind, SleepSessionPayload } from '@/database/sleep';
import { getSleepSessionById, saveSleepSession, updateSleepSession } from '@/database/sleep';
import { useLocalization } from '@/localization/LocalizationProvider';

const sleepKinds: { key: SleepSessionKind; labelKey: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'nap', labelKey: 'sleep.kinds.nap', icon: 'white-balance-sunny' },
  { key: 'night', labelKey: 'sleep.kinds.night', icon: 'weather-night' },
];

function formatClock(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [hrs, mins, secs].map((value) => String(value).padStart(2, '0'));
  return parts.join(':');
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function calculateDuration(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

type PickerTarget = 'start' | 'end' | null;

export default function SleepScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [sleepKind, setSleepKind] = useState<SleepSessionKind>('nap');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [SLEEP_SESSIONS_QUERY_KEY, id],
    queryFn: () => (id ? getSleepSessionById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setSleepKind(existingData.kind);
      setStartTime(new Date(existingData.startTime * 1000));
      if (existingData.endTime) {
        setEndTime(new Date(existingData.endTime * 1000));
      }
      setNotes(existingData.notes ?? '');
      // If there is a duration but no end time (e.g. ongoing?), or just to sync elapsed
      if (existingData.duration) {
        setElapsedSeconds(existingData.duration);
      }
    }
  }, [existingData]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: SleepSessionPayload) => {
      if (isEditing && id) {
        await updateSleepSession(id, payload);
      } else {
        await saveSleepSession(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SLEEP_SESSIONS_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save sleep session:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const openPicker = (target: Exclude<PickerTarget, null>) => {
    if (timerActive && target === 'start') {
      return;
    }
    setPickerTarget(target);
  };

  const closePicker = () => {
    setPickerTarget(null);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      closePicker();
    }

    if (!selectedDate || !pickerTarget) {
      if (Platform.OS === 'ios' && event.type === 'dismissed') {
        closePicker();
      }
      return;
    }

    if (pickerTarget === 'start') {
      setStartTime(selectedDate);
      if (!timerActive) {
        setElapsedSeconds(endTime ? calculateDuration(selectedDate, endTime) : 0);
      }
    } else if (pickerTarget === 'end') {
      setEndTime(selectedDate);
      if (!timerActive) {
        setElapsedSeconds(calculateDuration(startTime, selectedDate));
      }
    }

    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      closePicker();
    }
  };

  const startTimer = () => {
    if (timerActive) return;
    const now = new Date();
    setStartTime(now);
    setEndTime(null);
    setElapsedSeconds(0);
    setTimerActive(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const current = calculateDuration(now, new Date());
        return current >= 0 ? current : prev;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (!timerActive) {
      return { finalEnd: endTime, duration: endTime ? calculateDuration(startTime, endTime) : elapsedSeconds };
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalEnd = new Date();
    const duration = calculateDuration(startTime, finalEnd);
    setTimerActive(false);
    setEndTime(finalEnd);
    setElapsedSeconds(duration);
    return { finalEnd, duration };
  };

  const handleTimerPress = () => {
    if (timerActive) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const clearEndTime = () => {
    if (timerActive) return;
    setEndTime(null);
    setElapsedSeconds(0);
  };

  const resolvedDuration = (() => {
    if (timerActive) {
      return elapsedSeconds;
    }
    if (endTime) {
      return calculateDuration(startTime, endTime);
    }
    return elapsedSeconds;
  })();

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const { finalEnd, duration } = stopTimer();
      const normalizedDuration = finalEnd ? Math.max(0, duration) : undefined;

      const payload = {
        kind: sleepKind,
        startTime: Math.floor(startTime.getTime() / 1000),
        endTime: finalEnd ? Math.floor(finalEnd.getTime() / 1000) : undefined,
        duration: normalizedDuration && normalizedDuration > 0 ? normalizedDuration : undefined,
        notes: notes || undefined,
      };

      await mutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const pickerValue = pickerTarget === 'start' ? startTime : endTime ?? new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('sleep.editTitle') : t('sleep.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.segmentedControl}>
          {sleepKinds.map((kind, index) => (
            <Pressable
              key={kind.key}
              onPress={() => setSleepKind(kind.key)}
              style={[
                styles.segment,
                sleepKind === kind.key && styles.segmentActive,
                index > 0 && styles.segmentBorder,
              ]}>
              <MaterialCommunityIcons
                name={kind.icon}
                size={20}
                color={sleepKind === kind.key ? '#FFF' : '#666'}
              />
              <Text style={[styles.segmentText, sleepKind === kind.key && styles.segmentTextActive]}>
                {t(kind.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        {!isEditing && (
          <View style={styles.timerCard}>
            <Text style={styles.timerValue}>{formatClock(resolvedDuration)}</Text>
            <Pressable
              style={[styles.timerButton, timerActive ? styles.timerButtonStop : styles.timerButtonStart]}
              onPress={handleTimerPress}>
              <MaterialCommunityIcons
                name={timerActive ? 'pause' : 'play'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.timerButtonText}>
                {t(timerActive ? 'sleep.timer.stop' : 'sleep.timer.start')}
              </Text>
            </Pressable>
            <Text style={styles.timerHint}>{t('sleep.timerHint')}</Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <View style={styles.fieldRow}>
            <View>
              <Text style={styles.fieldLabel}>{t('common.starts')}</Text>
              <Text style={styles.fieldValue}>{formatDateTime(startTime)}</Text>
            </View>
            <Pressable onPress={() => openPicker('start')} disabled={timerActive}>
              <Text style={[styles.setTimeButton, timerActive && styles.disabledText]}>{t('common.setTime')}</Text>
            </Pressable>
          </View>

          <View style={styles.fieldRow}>
            <View>
              <Text style={styles.fieldLabel}>{t('sleep.ends')}</Text>
              <Text style={styles.fieldValue}>{endTime ? formatDateTime(endTime) : t('sleep.unset')}</Text>
            </View>
            <View style={styles.endActions}>
              {endTime && !timerActive && (
                <Pressable onPress={clearEndTime}>
                  <Text style={styles.clearButton}>{t('sleep.clearEnd')}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => openPicker('end')}>
                <Text style={styles.setTimeButton}>{t('common.setTime')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('common.duration')}</Text>
            <Text style={styles.durationText}>{formatClock(resolvedDuration)}</Text>
          </View>
        </View>

        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
        />
      </ScrollView>

      <DateTimePickerModal
        visible={!!pickerTarget}
        value={pickerValue}
        onClose={closePicker}
        onChange={handlePickerChange}
      />
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
    gap: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
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
    backgroundColor: '#B49BFF',
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
  timerCard: {
    borderRadius: 16,
    backgroundColor: '#F6F2FF',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  timerButtonStart: {
    backgroundColor: '#B49BFF',
  },
  timerButtonStop: {
    backgroundColor: '#FF7A9B',
  },
  timerButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  timerHint: {
    fontSize: 13,
    color: '#7C6A99',
    textAlign: 'center',
  },
  fieldGroup: {
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    gap: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    color: '#2D2D2D',
    marginTop: 4,
  },
  setTimeButton: {
    color: '#B49BFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.6,
  },
  endActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  clearButton: {
    color: '#FF7A9B',
    fontSize: 13,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#2D2D2D',
  },
});


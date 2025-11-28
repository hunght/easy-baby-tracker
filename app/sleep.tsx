import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { DateTimePickerModal } from '@/components/ui/DateTimePickerModal';
import { useNotification } from '@/components/ui/NotificationContext';
import { Text } from '@/components/ui/text';
import { SLEEP_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import type { SleepSessionKind, SleepSessionPayload } from '@/database/sleep';
import { getSleepSessionById, saveSleepSession, updateSleepSession } from '@/database/sleep';
import { useLocalization } from '@/localization/LocalizationProvider';

const sleepKinds: {
  key: SleepSessionKind;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
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
      return {
        finalEnd: endTime,
        duration: endTime ? calculateDuration(startTime, endTime) : elapsedSeconds,
      };
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

  const pickerValue = pickerTarget === 'start' ? startTime : (endTime ?? new Date());

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('sleep.editTitle') : t('sleep.title')}
        onSave={handleSave}
        isSaving={isSaving}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10 gap-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row overflow-hidden rounded-xl border border-border bg-card">
          {sleepKinds.map((kind, index) => (
            <Pressable
              key={kind.key}
              onPress={() => setSleepKind(kind.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${
                sleepKind === kind.key ? 'bg-lavender' : ''
              } ${index > 0 ? 'border-l border-border' : ''}`}>
              <MaterialCommunityIcons
                name={kind.icon}
                size={20}
                color={sleepKind === kind.key ? '#FFF' : '#666'}
              />
              <Text
                className={`text-sm font-semibold ${sleepKind === kind.key ? 'text-white' : 'text-muted-foreground'}`}>
                {t(kind.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        {!isEditing && (
          <View className="items-center gap-3 rounded-2xl bg-violet-50 p-5">
            <Text className="text-4xl font-bold text-foreground">
              {formatClock(resolvedDuration)}
            </Text>
            <Pressable
              className={`flex-row items-center gap-2.5 rounded-pill px-5 py-3 ${
                timerActive ? 'bg-pink-400' : 'bg-lavender'
              }`}
              onPress={handleTimerPress}>
              <MaterialCommunityIcons
                name={timerActive ? 'pause' : 'play'}
                size={22}
                color="#FFF"
              />
              <Text className="text-base font-semibold text-white">
                {t(timerActive ? 'sleep.timer.stop' : 'sleep.timer.start')}
              </Text>
            </Pressable>
            <Text className="text-center text-sm text-violet-600">{t('sleep.timerHint')}</Text>
          </View>
        )}

        <View className="gap-4.5 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.starts')}
              </Text>
              <Text className="mt-1 text-base text-foreground">{formatDateTime(startTime)}</Text>
            </View>
            <Pressable onPress={() => openPicker('start')} disabled={timerActive}>
              <Text
                className={`text-base font-semibold text-lavender ${timerActive ? 'opacity-60' : ''}`}>
                {t('common.setTime')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-muted-foreground">{t('sleep.ends')}</Text>
              <Text className="mt-1 text-base text-foreground">
                {endTime ? formatDateTime(endTime) : t('sleep.unset')}
              </Text>
            </View>
            <View className="items-end gap-1">
              {endTime && !timerActive && (
                <Pressable onPress={clearEndTime}>
                  <Text className="text-sm font-semibold text-pink-400">{t('sleep.clearEnd')}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => openPicker('end')}>
                <Text className="text-base font-semibold text-lavender">{t('common.setTime')}</Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-base font-medium text-muted-foreground">
              {t('common.duration')}
            </Text>
            <Text className="text-lg font-semibold text-foreground">
              {formatClock(resolvedDuration)}
            </Text>
          </View>
        </View>

        <TextInput
          className="min-h-25 rounded-xl border border-border bg-gray-50 px-4 py-3 text-base text-foreground"
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
          textAlignVertical="top"
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

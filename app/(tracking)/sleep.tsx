import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, KeyboardAvoidingView } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { StickySaveBar } from '@/components/StickySaveBar';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SLEEP_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import type { SleepSessionKind, SleepSessionPayload } from '@/database/sleep';
import { getSleepSessionById, saveSleepSession, updateSleepSession } from '@/database/sleep';
import { useBrandColor } from '@/hooks/use-brand-color';
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
  const brandColors = useBrandColor();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleSleepKindChange = (value: string | undefined) => {
    if (value && (value === 'nap' || value === 'night')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSleepKind(value);
    }
  };

  const startTimer = () => {
    if (timerActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="bg-background">
      <View className="flex-1 bg-background">
        <ModalHeader
          title={isEditing ? t('sleep.editTitle') : t('sleep.title')}
          closeLabel={t('common.close')}
        />

        <ScrollView
          contentContainerClassName="p-5 pb-28 gap-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Sleep Type Selection */}
          <ToggleGroup
            type="single"
            value={sleepKind}
            onValueChange={handleSleepKindChange}
            variant="outline"
            className="w-full">
            {sleepKinds.map((kind, index) => (
              <ToggleGroupItem
                key={kind.key}
                value={kind.key}
                isFirst={index === 0}
                isLast={index === sleepKinds.length - 1}
                className="flex-1 flex-row items-center justify-center"
                aria-label={t(kind.labelKey)}>
                <MaterialCommunityIcons
                  name={kind.icon}
                  size={22}
                  color={sleepKind === kind.key ? brandColors.colors.white : '#666666'}
                />
                <Text className="text-base">{t(kind.labelKey)}</Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Timer Section - Large button for one-handed use */}
          {!isEditing && (
            <View className="items-center gap-5 rounded-2xl border border-border bg-card p-6">
              <Text className="text-5xl font-bold text-foreground">
                {formatClock(resolvedDuration)}
              </Text>
              <Pressable
                className={`h-[88px] w-[88px] items-center justify-center rounded-full ${
                  timerActive ? 'bg-red-500' : 'bg-lavender'
                }`}
                onPress={handleTimerPress}
                style={{
                  shadowColor: timerActive ? '#EF4444' : brandColors.colors.lavender,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}>
                <MaterialCommunityIcons
                  name={timerActive ? 'pause' : 'play'}
                  size={40}
                  color="#FFF"
                />
              </Pressable>
              <Text className="text-center text-sm text-muted-foreground">
                {t(timerActive ? 'sleep.timer.stop' : 'sleep.timer.start')}
              </Text>
            </View>
          )}

          {/* Time Settings Card */}
          <View className="gap-4 rounded-2xl border border-border bg-card p-4">
            {/* Start Time */}
            <Pressable
              onPress={() => openPicker('start')}
              disabled={timerActive}
              className={`flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-4 ${timerActive ? 'opacity-60' : ''}`}>
              <View>
                <Text className="text-sm font-medium text-muted-foreground">
                  {t('common.starts')}
                </Text>
                <Text className="mt-1 text-lg font-semibold text-foreground">
                  {formatDateTime(startTime)}
                </Text>
              </View>
              <MaterialCommunityIcons name="clock-edit-outline" size={24} color="#666" />
            </Pressable>

            {/* End Time */}
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => openPicker('end')}
                className="flex-1 flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-4">
                <View>
                  <Text className="text-sm font-medium text-muted-foreground">
                    {t('sleep.ends')}
                  </Text>
                  <Text className="mt-1 text-lg font-semibold text-foreground">
                    {endTime ? formatDateTime(endTime) : t('sleep.unset')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="clock-edit-outline" size={24} color="#666" />
              </Pressable>
              {endTime && !timerActive && (
                <Pressable
                  onPress={clearEndTime}
                  className="h-14 w-14 items-center justify-center rounded-xl bg-red-500/20">
                  <MaterialCommunityIcons name="close" size={24} color="#EF4444" />
                </Pressable>
              )}
            </View>

            {/* Duration */}
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.duration')}
              </Text>
              <Text className="text-xl font-bold text-accent">{formatClock(resolvedDuration)}</Text>
            </View>
          </View>

          {/* Notes */}
          <Input
            className="min-h-[100px]"
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notesPlaceholder')}
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

        <StickySaveBar onPress={handleSave} isSaving={isSaving} />
      </View>
    </KeyboardAvoidingView>
  );
}

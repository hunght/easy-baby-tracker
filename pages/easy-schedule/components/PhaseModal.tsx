import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import { adjustSchedulePhaseTiming } from '@/database/easy-formula-rules';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';

import type { BabyProfileRecord } from '@/database/baby-profile';

const MINUTES_IN_DAY = 1440;

function minutesToDate(minutes: number): Date {
  const dayOffset = Math.floor(minutes / MINUTES_IN_DAY);
  const minutesInDay = minutes % MINUTES_IN_DAY;
  const hours = Math.floor(minutesInDay / 60);
  const mins = minutesInDay % 60;
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, mins, 0, 0);
  return date;
}

function minutesToTimeString(minutes: number): string {
  const normalizedMinutes = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

type PhaseModalProps = {
  phaseData: {
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null;
  onClose: () => void;
  onAdjustmentSaved: () => void;
  babyProfile: BabyProfileRecord | null;
};

export function PhaseModal({ phaseData, onClose, babyProfile }: PhaseModalProps) {
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());
  const [currentStartMinutes, setCurrentStartMinutes] = useState(0);
  const [currentEndMinutes, setCurrentEndMinutes] = useState(0);

  const visible = phaseData !== null;

  // Initialize values when modal opens or phase changes
  useEffect(() => {
    if (phaseData) {
      const startTime = minutesToTimeString(phaseData.timing.startMinutes);
      const endTime = minutesToTimeString(phaseData.timing.endMinutes);
      setStartTimeValue(startTime);
      setEndTimeValue(endTime);
      setStartTimeDate(minutesToDate(phaseData.timing.startMinutes));
      setEndTimeDate(minutesToDate(phaseData.timing.endMinutes));
      setCurrentStartMinutes(phaseData.timing.startMinutes);
      setCurrentEndMinutes(phaseData.timing.endMinutes);
    }
  }, [phaseData]);

  const handleStartTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStartTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // Calculate the time difference and adjust end time accordingly
      const newStartMinutes = date.getHours() * 60 + date.getMinutes();
      const timeDiff = newStartMinutes - currentStartMinutes;

      // Update end time by the same difference
      const newEndMinutes = currentEndMinutes + timeDiff;
      const newEndTime = minutesToTimeString(newEndMinutes);
      const newEndDate = minutesToDate(newEndMinutes);

      setStartTimeValue(timeString);
      setEndTimeValue(newEndTime);
      setEndTimeDate(newEndDate);
      setCurrentStartMinutes(newStartMinutes);
      setCurrentEndMinutes(newEndMinutes);
    }
  };

  const handleEndTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEndTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEndTimeValue(timeString);
      setCurrentEndMinutes(date.getHours() * 60 + date.getMinutes());
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!startTimeValue || !endTimeValue || !phaseData || !babyProfile) {
        throw new Error('Missing required data');
      }

      return await adjustSchedulePhaseTiming(
        babyProfile.id,
        phaseData.item.order,
        startTimeValue,
        endTimeValue
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BABY_PROFILE_QUERY_KEY,
      });

      const oldStartTime = minutesToTimeString(phaseData?.timing.startMinutes ?? 0);
      const oldEndTime = minutesToTimeString(phaseData?.timing.endMinutes ?? 0);

      const startChanged = oldStartTime !== startTimeValue;
      const endChanged = oldEndTime !== endTimeValue;

      const changes: string[] = [];
      if (startChanged) {
        changes.push(
          t('easySchedule.phaseModal.startTimeChanged', {
            defaultValue: `Start time: ${oldStartTime} → ${startTimeValue}`,
            params: { old: oldStartTime, new: startTimeValue },
          })
        );
      }
      if (endChanged) {
        changes.push(
          t('easySchedule.phaseModal.endTimeChanged', {
            defaultValue: `End time: ${oldEndTime} → ${endTimeValue}`,
            params: { old: oldEndTime, new: endTimeValue },
          })
        );
      }

      const activityLabel =
        phaseData?.item.activityType === 'E'
          ? t('easySchedule.activityLabels.eat')
          : phaseData?.item.activityType === 'A'
            ? t('easySchedule.activityLabels.activity')
            : phaseData?.item.activityType === 'S'
              ? t('easySchedule.activityLabels.sleep').replace('{{number}}', '')
              : t('easySchedule.activityLabels.yourTime');

      const notificationMessage =
        t('easySchedule.phaseModal.adjustmentSuccess', {
          defaultValue: `Schedule adjusted: ${activityLabel}`,
          params: { activity: activityLabel },
        }) + (changes.length > 0 ? `\n${changes.join('\n')}` : '');

      showNotification(notificationMessage, 'success');
      onClose();
    },
    onError: (error) => {
      console.error('Failed to save adjustment:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleApply = () => {
    if (!startTimeValue || !endTimeValue || !phaseData) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const oldStartTime = minutesToTimeString(phaseData.timing.startMinutes);
    const oldEndTime = minutesToTimeString(phaseData.timing.endMinutes);

    const startChanged = oldStartTime !== startTimeValue;
    const endChanged = oldEndTime !== endTimeValue;

    if (startChanged || endChanged) {
      mutation.mutate();
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStartPicker(false);
    setShowEndPicker(false);
    onClose();
  };

  // Get activity icon and color
  const getActivityStyle = () => {
    switch (phaseData?.item.activityType) {
      case 'E':
        return { icon: 'silverware-fork-knife' as const, color: '#F97316', bg: 'bg-orange-500/10' };
      case 'A':
        return { icon: 'play-circle' as const, color: '#3B82F6', bg: 'bg-blue-500/10' };
      case 'S':
        return { icon: 'moon-waning-crescent' as const, color: '#8B5CF6', bg: 'bg-purple-500/10' };
      default:
        return { icon: 'account' as const, color: '#10B981', bg: 'bg-emerald-500/10' };
    }
  };

  // Calculate new duration
  const newDuration = currentEndMinutes - currentStartMinutes;

  // Early return after all hooks
  if (!phaseData) {
    return (
      <Modal transparent visible={false} animationType="fade" onRequestClose={handleClose}>
        <View />
      </Modal>
    );
  }

  const activityStyle = getActivityStyle();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Pressable className="flex-1 justify-end bg-black/50" onPress={handleClose}>
        {/* Bottom Sheet Content */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="rounded-t-3xl bg-card pb-8 pt-6">
            {/* Drag Handle */}
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </View>

            {/* Header */}
            <View className="mb-6 px-5">
              <View className="flex-row items-center gap-4">
                <View
                  className={`h-14 w-14 items-center justify-center rounded-2xl ${activityStyle.bg}`}>
                  <MaterialCommunityIcons
                    name={activityStyle.icon}
                    size={28}
                    color={activityStyle.color}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-foreground">{phaseData.item.label}</Text>
                  <Text className="text-base text-muted-foreground">
                    {formatDuration(
                      newDuration > 0
                        ? newDuration
                        : phaseData.timing.endMinutes - phaseData.timing.startMinutes
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Time Selection Cards */}
            <View className="mb-4 gap-3 px-5">
              {/* Start Time Card */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowStartPicker(true);
                }}
                className="flex-row items-center justify-between rounded-2xl border border-border bg-background p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                    <MaterialCommunityIcons name="clock-start" size={22} color="#666" />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground">
                      {t('easySchedule.phaseModal.startTime')}
                    </Text>
                    <Text className="text-lg font-bold text-foreground">{startTimeValue}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
              </Pressable>

              {/* End Time Card */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowEndPicker(true);
                }}
                className="flex-row items-center justify-between rounded-2xl border border-border bg-background p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                    <MaterialCommunityIcons name="clock-end" size={22} color="#666" />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground">
                      {t('easySchedule.phaseModal.endTime')}
                    </Text>
                    <Text className="text-lg font-bold text-foreground">{endTimeValue}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
              </Pressable>
            </View>

            {/* Notice */}
            <View className="mx-5 mb-6 flex-row items-start gap-2 rounded-xl bg-accent/10 p-3">
              <MaterialCommunityIcons name="information-outline" size={18} color="#7C3AED" />
              <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                {t('easySchedule.phaseModal.todayOnlyNotice', {
                  defaultValue: 'Changes apply only for today and will reset tomorrow',
                })}
              </Text>
            </View>

            {/* Action Buttons - Sticky Bottom */}
            <View className="flex-row gap-3 px-5">
              <Pressable
                onPress={handleClose}
                className="h-14 flex-1 items-center justify-center rounded-2xl border border-border bg-muted/30">
                <Text className="text-base font-semibold text-foreground">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleApply}
                disabled={mutation.isPending}
                className={`h-14 flex-1 items-center justify-center rounded-2xl ${
                  mutation.isPending ? 'bg-muted' : 'bg-accent'
                }`}>
                <Text
                  className={`text-base font-bold ${mutation.isPending ? 'text-muted-foreground' : 'text-white'}`}>
                  {mutation.isPending ? t('common.saving') : t('common.apply')}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>

      {/* Time Pickers */}
      <DateTimePickerModal
        visible={showStartPicker}
        value={startTimeDate}
        mode="time"
        onClose={() => setShowStartPicker(false)}
        onChange={handleStartTimeChange}
      />
      <DateTimePickerModal
        visible={showEndPicker}
        value={endTimeDate}
        mode="time"
        onClose={() => setShowEndPicker(false)}
        onChange={handleEndTimeChange}
      />
    </Modal>
  );
}

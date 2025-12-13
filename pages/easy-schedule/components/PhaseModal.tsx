import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import { recalculateScheduleFromItem } from '@/lib/easy-schedule-generator';
import { cloneFormulaRuleForDate } from '@/database/easy-formula-rules';

import type { BabyProfileRecord } from '@/database/baby-profile';

const MINUTES_IN_DAY = 1440;

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

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
  scheduleItems: EasyScheduleItem[];
  currentFormulaRuleId: string; // ID of the current formula rule to clone
};

export function PhaseModal({
  phaseData,
  onClose,
  onAdjustmentSaved: _onAdjustmentSaved,
  babyProfile,
  scheduleItems,
  currentFormulaRuleId,
}: PhaseModalProps) {
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const brandColors = useBrandColor();
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
      setEndTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEndTimeValue(timeString);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!startTimeValue || !endTimeValue || !phaseData || !babyProfile) {
        throw new Error('Missing required data');
      }

      const today = getTodayDateString();

      // Recalculate schedule with the new adjustment
      const recalculatedItems = recalculateScheduleFromItem(
        scheduleItems,
        phaseData.item.order,
        startTimeValue,
        endTimeValue
      );

      // Convert schedule items back to phases format
      // Each EASY cycle has 4 items: E, A, S, Y
      // We need to group them into phases: { eat, activity, sleep }
      const phases: { eat: number; activity: number; sleep: number }[] = [];

      for (let i = 0; i < recalculatedItems.length; i += 4) {
        const eatItem = recalculatedItems[i];
        const activityItem = recalculatedItems[i + 1];
        const sleepItem = recalculatedItems[i + 2];
        // Skip Y item (i + 3) as it overlaps with S

        if (eatItem && activityItem && sleepItem) {
          phases.push({
            eat: eatItem.durationMinutes,
            activity: activityItem.durationMinutes,
            sleep: sleepItem.durationMinutes,
          });
        }
      }

      // Clone the formula rule for today with adjusted phases
      if (phases.length > 0) {
        await cloneFormulaRuleForDate(babyProfile.id, currentFormulaRuleId, today, phases);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh day-specific rule
      const today = getTodayDateString();
      queryClient.invalidateQueries({
        queryKey: ['formulaRule', 'date', babyProfile?.id, today],
      });

      // Calculate old values for notification
      const oldStartTime = minutesToTimeString(phaseData?.timing.startMinutes ?? 0);
      const oldEndTime = minutesToTimeString(phaseData?.timing.endMinutes ?? 0);

      // Check if anything changed
      const startChanged = oldStartTime !== startTimeValue;
      const endChanged = oldEndTime !== endTimeValue;

      // Show success notification with details
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

    // Calculate old values to check if anything changed
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
    setShowStartPicker(false);
    setShowEndPicker(false);
    onClose();
  };

  // Early return after all hooks - guard against null phaseData
  if (!phaseData) {
    return (
      <Modal transparent visible={false} animationType="fade" onRequestClose={handleClose}>
        <View />
      </Modal>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 justify-center bg-black/50 p-6 dark:bg-black/70">
        <View className="rounded-lg bg-card p-5 dark:bg-card">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">{phaseData.item.label}</Text>
            <TouchableOpacity onPress={handleClose} testID="modal-close">
              <Ionicons name="close" size={22} color={brandColors.colors.black} />
            </TouchableOpacity>
          </View>
          <Text className="text-base font-semibold text-foreground">
            {phaseData.item.startTime} → {phaseData.endTimeLabel}
          </Text>
          <Text className="mb-4 text-[13px] text-muted-foreground">{phaseData.durationLabel}</Text>

          <View className="mb-4 flex-row items-start gap-2 rounded-md bg-accent/10 p-3 dark:bg-accent/20">
            <Ionicons name="information-circle" size={18} color={brandColors.colors.accent} />
            <Text className="flex-1 text-xs text-muted-foreground">
              {t('easySchedule.phaseModal.todayOnlyNotice', {
                defaultValue: 'Changes apply only for today and will reset tomorrow',
              })}
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-xs font-medium text-muted-foreground">
                {t('easySchedule.phaseModal.startTime')}
              </Text>
              <Pressable onPress={() => setShowStartPicker(true)}>
                <Input
                  value={startTimeValue}
                  placeholder="HH:mm"
                  editable={false}
                  pointerEvents="none"
                />
              </Pressable>
              <DateTimePickerModal
                visible={showStartPicker}
                value={startTimeDate}
                mode="time"
                onClose={() => setShowStartPicker(false)}
                onChange={handleStartTimeChange}
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-muted-foreground">
                {t('easySchedule.phaseModal.endTime')}
              </Text>
              <Pressable onPress={() => setShowEndPicker(true)}>
                <Input
                  value={endTimeValue}
                  placeholder="HH:mm"
                  editable={false}
                  pointerEvents="none"
                />
              </Pressable>
              <DateTimePickerModal
                visible={showEndPicker}
                value={endTimeDate}
                mode="time"
                onClose={() => setShowEndPicker(false)}
                onChange={handleEndTimeChange}
              />
            </View>
          </View>

          <View className="mt-4 flex-row justify-end gap-3">
            <TouchableOpacity
              className="items-center rounded-md border border-border px-4 py-2.5"
              onPress={handleClose}>
              <Text className="font-semibold text-foreground">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center rounded-md bg-lavender px-4 py-2.5"
              onPress={handleApply}>
              <Text className="text-lavender-foreground font-semibold">{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Alert, Modal, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import {
  requestNotificationPermissions,
  scheduleEasyScheduleReminder,
} from '@/lib/notification-scheduler';

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

type PhaseModalProps = {
  visible: boolean;
  selectedPhase: {
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null;
  baseMinutes: number;
  onClose: () => void;
  onAdjustmentApplied: (newWakeTime: string) => void;
};

export function PhaseModal({
  visible,
  selectedPhase,
  baseMinutes,
  onClose,
  onAdjustmentApplied,
}: PhaseModalProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();
  const [adjustPickerVisible, setAdjustPickerVisible] = useState(false);
  const [adjustPickerValue, setAdjustPickerValue] = useState(new Date());

  if (!selectedPhase) return null;

  const handleScheduleReminder = async () => {
    const targetDate = minutesToDate(selectedPhase.timing.endMinutes);
    const now = new Date();
    const secondsUntil = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

    if (secondsUntil <= 0) {
      Alert.alert(t('easySchedule.reminder.pastTitle'), t('easySchedule.reminder.pastMessage'));
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert(
        t('easySchedule.reminder.permissionDeniedTitle'),
        t('easySchedule.reminder.permissionDeniedBody')
      );
      return;
    }

    try {
      const notificationId = await scheduleEasyScheduleReminder({
        targetDate,
        activityType: selectedPhase.item.activityType,
        label: selectedPhase.item.label,
        notificationTitle: t('easySchedule.reminder.notificationTitle'),
        notificationBody: t('easySchedule.reminder.notificationBody', {
          params: { label: selectedPhase.item.label, time: selectedPhase.endTimeLabel },
        }),
      });

      if (notificationId) {
        Alert.alert(
          t('easySchedule.reminder.scheduledTitle'),
          t('easySchedule.reminder.scheduledBody', { params: { time: selectedPhase.endTimeLabel } })
        );
      } else {
        Alert.alert(t('common.error'), t('easySchedule.reminder.scheduleError'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : String(error));
    }
  };

  const openAdjustPicker = () => {
    setAdjustPickerValue(minutesToDate(selectedPhase.timing.startMinutes));
    setAdjustPickerVisible(true);
  };

  const handleAdjustPickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setAdjustPickerValue(date);
    }
  };

  const applyAdjustment = () => {
    const dayOffset = Math.floor(selectedPhase.timing.startMinutes / MINUTES_IN_DAY);
    const pickedMinutes = adjustPickerValue.getHours() * 60 + adjustPickerValue.getMinutes();
    const absoluteMinutes = dayOffset * MINUTES_IN_DAY + pickedMinutes;
    const delta = absoluteMinutes - selectedPhase.timing.startMinutes;
    const newFirstMinutes = baseMinutes + delta;
    const newWakeTime = minutesToTimeString(newFirstMinutes);

    onAdjustmentApplied(newWakeTime);
    setAdjustPickerVisible(false);
    onClose();
  };

  const handleClose = () => {
    setAdjustPickerVisible(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 justify-center bg-black/50 p-6 dark:bg-black/70">
        <View className="rounded-lg bg-card p-5 dark:bg-card">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">{selectedPhase.item.label}</Text>
            <TouchableOpacity onPress={handleClose} testID="modal-close">
              <Ionicons name="close" size={22} color={brandColors.colors.black} />
            </TouchableOpacity>
          </View>
          <Text className="text-base font-semibold text-foreground">
            {selectedPhase.item.startTime} → {selectedPhase.endTimeLabel}
          </Text>
          <Text className="mb-4 text-[13px] text-muted-foreground">
            {selectedPhase.durationLabel}
          </Text>
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-lg bg-lavender py-3"
              onPress={handleScheduleReminder}>
              <Ionicons name="alarm-outline" size={18} color={brandColors.colors.white} />
              <Text className="text-lavender-foreground font-semibold">
                {t('easySchedule.phaseModal.setReminder')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-lg border border-border py-3"
              onPress={openAdjustPicker}>
              <Ionicons name="time-outline" size={18} color={brandColors.colors.lavender} />
              <Text className="font-semibold text-lavender">
                {t('easySchedule.phaseModal.adjustTime')}
              </Text>
            </TouchableOpacity>
          </View>
          {adjustPickerVisible && (
            <View className="mt-5 rounded-lg border border-border bg-card p-4">
              <Text className="mb-2 text-center text-sm font-semibold text-foreground">
                {t('easySchedule.phaseModal.adjustHeading')}
              </Text>
              <DateTimePicker
                value={adjustPickerValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleAdjustPickerChange}
              />
              <View className="mt-3 flex-row justify-between gap-3">
                <TouchableOpacity
                  className="flex-1 items-center rounded-md border border-border py-2.5"
                  onPress={() => setAdjustPickerVisible(false)}>
                  <Text className="font-semibold text-foreground">{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center rounded-md bg-lavender py-2.5"
                  onPress={applyAdjustment}>
                  <Text className="text-lavender-foreground font-semibold">
                    {t('common.apply')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

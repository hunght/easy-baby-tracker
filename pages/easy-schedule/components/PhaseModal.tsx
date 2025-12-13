import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import { saveScheduleAdjustment, getTodayDateString } from '@/database/easy-schedule-adjustments';


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

type PhaseModalProps = {
  phaseData: {
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null;
  baseMinutes: number;
  onClose: () => void;
  onAdjustmentSaved: () => void;
  babyProfile: BabyProfileRecord | null;
  labels: {
    eat: string;
    activity: string;
    sleep: (napNumber: number) => string;
    yourTime: string;
  };
};

export function PhaseModal({
  phaseData,
  baseMinutes: _baseMinutes,
  onClose,
  onAdjustmentSaved,
  babyProfile,
  labels: _labels,
}: PhaseModalProps) {
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const brandColors = useBrandColor();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());

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
    }
  }, [phaseData]);

  if (!phaseData) return null;

  const handleStartTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setStartTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setStartTimeValue(timeString);
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

  const handleApply = async () => {
    if (!startTimeValue || !endTimeValue || !phaseData || !babyProfile) {
      return;
    }

    // Calculate old values for notification
    const oldStartTime = minutesToTimeString(phaseData.timing.startMinutes);
    const oldEndTime = minutesToTimeString(phaseData.timing.endMinutes);

    // Check if anything changed
    const startChanged = oldStartTime !== startTimeValue;
    const endChanged = oldEndTime !== endTimeValue;

    if (startChanged || endChanged) {
      try {
        // Save adjustment to database for today only
        const today = getTodayDateString();
        await saveScheduleAdjustment({
          babyId: babyProfile.id,
          adjustmentDate: today,
          itemOrder: phaseData.item.order,
          startTime: startTimeValue,
          endTime: endTimeValue,
        });

        // Notify parent to refresh schedule
        onAdjustmentSaved();

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

        const notificationMessage =
          t('easySchedule.phaseModal.adjustmentSuccess', {
            defaultValue: `Schedule adjusted for today: ${phaseData.item.label}`,
            params: { activity: phaseData.item.label },
          }) + (changes.length > 0 ? `\n${changes.join(', ')}` : '');

        showNotification(notificationMessage, 'success');
      } catch (error) {
        console.error('Failed to save schedule adjustment:', error);
        showNotification(
          t('common.saveError', { defaultValue: 'Failed to save adjustment' }),
          'error'
        );
      }
    }

    setShowStartPicker(false);
    setShowEndPicker(false);
    onClose();
  };

  const handleClose = () => {
    setShowStartPicker(false);
    setShowEndPicker(false);
    onClose();
  };

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

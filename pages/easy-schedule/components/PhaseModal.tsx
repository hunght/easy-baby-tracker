import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Modal, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';

type PhaseModalProps = {
  visible: boolean;
  selectedPhase: {
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null;
  adjustPickerVisible: boolean;
  adjustPickerValue: Date;
  onClose: () => void;
  onScheduleReminder: (
    item: EasyScheduleItem,
    targetMinutes: number,
    endTimeLabel: string
  ) => void;
  onOpenAdjustPicker: () => void;
  onAdjustPickerChange: (event: DateTimePickerEvent, date?: Date) => void;
  onApplyAdjustment: () => void;
  onCancelAdjustment: () => void;
};

export function PhaseModal({
  visible,
  selectedPhase,
  adjustPickerVisible,
  adjustPickerValue,
  onClose,
  onScheduleReminder,
  onOpenAdjustPicker,
  onAdjustPickerChange,
  onApplyAdjustment,
  onCancelAdjustment,
}: PhaseModalProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  if (!selectedPhase) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/50 p-6 dark:bg-black/70">
        <View className="rounded-lg bg-card p-5 dark:bg-card">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">{selectedPhase.item.label}</Text>
            <TouchableOpacity onPress={onClose} testID="modal-close">
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
              onPress={() =>
                onScheduleReminder(
                  selectedPhase.item,
                  selectedPhase.timing.endMinutes,
                  selectedPhase.endTimeLabel
                )
              }>
              <Ionicons name="alarm-outline" size={18} color={brandColors.colors.white} />
              <Text className="text-lavender-foreground font-semibold">
                {t('easySchedule.phaseModal.setReminder')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-lg border border-border py-3"
              onPress={onOpenAdjustPicker}>
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
                onChange={onAdjustPickerChange}
              />
              <View className="mt-3 flex-row justify-between gap-3">
                <TouchableOpacity
                  className="flex-1 items-center rounded-md border border-border py-2.5"
                  onPress={onCancelAdjustment}>
                  <Text className="font-semibold text-foreground">{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center rounded-md bg-lavender py-2.5"
                  onPress={onApplyAdjustment}>
                  <Text className="text-lavender-foreground font-semibold">{t('common.apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

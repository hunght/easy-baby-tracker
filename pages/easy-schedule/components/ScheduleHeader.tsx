import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyFormulaRule } from '@/lib/easy-schedule-generator';

type ScheduleHeaderProps = {
  formulaRule: EasyFormulaRule;
  firstWakeTime: string;
  onWakeTimeChange: (time: string) => void;
};

export function ScheduleHeader({
  formulaRule,
  firstWakeTime,
  onWakeTimeChange,
}: ScheduleHeaderProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const openTimePicker = () => {
    const [hours, minutes] = firstWakeTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setShowTimePicker(true);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      onWakeTimeChange(newTime);
    }
  };

  return (
    <>
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
        <Pressable onPress={() => router.back()} testID="btn-close" accessibilityRole="button">
          <Text className="text-base font-semibold text-accent">{t('common.close')}</Text>
        </Pressable>

        <Pressable
          className="mx-3 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2"
          accessibilityRole="button"
          accessibilityLabel={t('easySchedule.viewDetails')}
          onPress={() =>
            router.push({
              pathname: '/(easy-schedule)/easy-schedule-select',
            })
          }>
          <View className="flex-1">
            <Text
              className="text-center text-sm font-semibold text-foreground"
              numberOfLines={1}
              ellipsizeMode="tail">
              {t(formulaRule.labelKey)}
            </Text>
            <Text
              className="text-center text-[11px] text-muted-foreground"
              numberOfLines={1}
              ellipsizeMode="tail">
              {t(formulaRule.ageRangeKey)}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={brandColors.colors.lavender} />
        </Pressable>

        <TouchableOpacity onPress={openTimePicker} className="p-1" accessibilityRole="button">
          <Ionicons name="time-outline" size={24} color={brandColors.colors.lavender} />
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <View className="rounded-t-lg bg-card pt-3">
          <Text className="mb-2 text-center text-sm font-semibold text-foreground">
            {t('easySchedule.firstWakeTimeTitle')}
          </Text>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        </View>
      )}
    </>
  );
}

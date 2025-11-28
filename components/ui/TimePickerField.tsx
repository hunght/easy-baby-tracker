import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { DateTimePickerModal } from './DateTimePickerModal';

type TimePickerFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
  isEditing?: boolean;
  label?: string;
};

export function TimePickerField({
  value,
  onChange,
  isEditing = false,
  label,
}: TimePickerFieldProps) {
  const { t } = useLocalization();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const showHint = !isEditing;

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-medium text-muted-foreground">
            {label || t('common.time')}
          </Text>
          <Text className="mt-1 text-[15px] text-foreground">{formatDateTime(value)}</Text>
          {showHint && (
            <Text className="mt-0.5 text-xs italic text-[#999]">{t('common.defaultsToNow')}</Text>
          )}
        </View>
        <Pressable onPress={() => setShowTimePicker(true)}>
          <Text className="text-base font-semibold text-accent">{t('common.setTime')}</Text>
        </Pressable>
      </View>
      <DateTimePickerModal
        visible={showTimePicker}
        value={value}
        onClose={() => setShowTimePicker(false)}
        onChange={handleTimeChange}
      />
    </View>
  );
}

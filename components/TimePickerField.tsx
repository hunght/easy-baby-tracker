import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { DateTimePickerModal } from './DateTimePickerModal';

type TimePickerFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
  isEditing?: boolean;
  label?: string;
  timeOnly?: boolean; // If true, only show time picker (no date)
};

export function TimePickerField({
  value,
  onChange,
  isEditing = false,
  label,
  timeOnly = false,
}: TimePickerFieldProps) {
  const { t } = useLocalization();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDateTime = (date: Date) => {
    if (timeOnly) {
      // Only show time for reminders
      return date.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
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

  const showHint = !isEditing && !timeOnly;

  // For timeOnly mode, show inline compact row
  if (timeOnly) {
    return (
      <View>
        <Pressable
          onPress={() => setShowTimePicker(true)}
          className="flex-row items-center justify-between py-2 active:opacity-70">
          <View className="flex-row items-center gap-3">
            <Clock size={20} color="#9CA3AF" />
            <Text className="text-base font-medium text-foreground">
              {label || t('common.time')}
            </Text>
          </View>
          <Text className="text-lg font-semibold text-accent">{formatDateTime(value)}</Text>
        </Pressable>
        <DateTimePickerModal
          visible={showTimePicker}
          value={value}
          onClose={() => setShowTimePicker(false)}
          onChange={handleTimeChange}
          mode="time"
        />
      </View>
    );
  }

  // Default mode with label on top
  return (
    <View className="mb-3">
      <Pressable
        onPress={() => setShowTimePicker(true)}
        className="flex-row items-center justify-between active:opacity-70">
        <View>
          <Text className="text-base font-medium text-muted-foreground">
            {label || t('common.time')}
          </Text>
          <Text className="mt-1 text-base text-foreground">{formatDateTime(value)}</Text>
          {showHint && (
            <Text className="mt-0.5 text-xs italic text-muted-foreground">
              {t('common.defaultsToNow')}
            </Text>
          )}
        </View>
        <Text className="text-base font-semibold text-accent">{t('common.setTime')}</Text>
      </Pressable>
      <DateTimePickerModal
        visible={showTimePicker}
        value={value}
        onClose={() => setShowTimePicker(false)}
        onChange={handleTimeChange}
        mode="datetime"
      />
    </View>
  );
}

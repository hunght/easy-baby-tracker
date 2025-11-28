import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { DateTimePickerModal } from './DateTimePickerModal';

type TimeFieldProps = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  showNowThreshold?: number; // Minutes threshold to show "Now" (default: 5)
  mode?: 'date' | 'time' | 'datetime';
  showHelperText?: boolean; // Show helper text explaining the states
};

export type TimeState = 'now' | 'past' | 'future';

export function TimeField({
  label,
  value,
  onChange,
  showNowThreshold = 5,
  mode = 'datetime',
  showHelperText = false,
}: TimeFieldProps) {
  const { t } = useLocalization();
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Determine time state
  const getTimeState = (): TimeState => {
    const now = new Date();
    const diff = value.getTime() - now.getTime();
    const thresholdMs = showNowThreshold * 60 * 1000;

    if (Math.abs(diff) <= thresholdMs) {
      return 'now';
    } else if (diff < 0) {
      return 'past';
    } else {
      return 'future';
    }
  };

  const timeState = getTimeState();
  const isNow = timeState === 'now';

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

  const displayText = isNow ? t('common.now') : value.toLocaleString();

  const getStateInfo = () => {
    switch (timeState) {
      case 'now':
        return {
          icon: 'clock-outline' as const,
          label: t('common.timeField.state.now'),
          color: '#4CAF50',
          helperText: t('common.timeField.helper.now'),
        };
      case 'past':
        return {
          icon: 'clock-edit-outline' as const,
          label: t('common.timeField.state.past'),
          color: '#FF9800',
          helperText: t('common.timeField.helper.past'),
        };
      case 'future':
        return {
          icon: 'clock-alert-outline' as const,
          label: t('common.timeField.state.future'),
          color: '#2196F3',
          helperText: t('common.timeField.helper.future'),
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <>
      <View className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{label}</Text>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-accent">{displayText}</Text>
            <View
              className="flex-row items-center gap-1 rounded-xl px-2 py-1"
              style={{ backgroundColor: stateInfo.color }}>
              <MaterialCommunityIcons name={stateInfo.icon} size={12} color="#FFF" />
              <Text className="text-[11px] font-semibold text-white">{stateInfo.label}</Text>
            </View>
          </Pressable>
        </View>

        {showHelperText && (
          <View
            className="mt-2 rounded border-l-[3px] bg-[#F9F9F9] py-2 pl-3"
            style={{ borderLeftColor: stateInfo.color }}>
            <Text className="text-[13px] leading-[18px] text-muted-foreground">
              {stateInfo.helperText}
            </Text>
          </View>
        )}
      </View>

      <DateTimePickerModal
        visible={showTimePicker}
        value={value}
        onClose={() => setShowTimePicker(false)}
        onChange={handleTimeChange}
        mode={mode}
      />
    </>
  );
}

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLocalization } from '@/localization/LocalizationProvider';

type DateTimePickerModalProps = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
};

type AndroidPickerStep = 'date' | 'time' | null;

export function DateTimePickerModal({
  visible,
  value,
  onClose,
  onChange,
  mode = 'datetime',
}: DateTimePickerModalProps) {
  const { t } = useLocalization();
  const [androidStep, setAndroidStep] = useState<AndroidPickerStep>(null);
  const [intermediateDate, setIntermediateDate] = useState<Date>(value);

  // Reset state when visibility changes
  useEffect(() => {
    if (visible) {
      setIntermediateDate(value);
      // For datetime mode on Android, start with date picker
      if (Platform.OS === 'android' && mode === 'datetime') {
        setAndroidStep('date');
      } else if (Platform.OS === 'android' && (mode === 'date' || mode === 'time')) {
        setAndroidStep(mode);
      } else {
        setAndroidStep(null);
      }
    } else {
      setAndroidStep(null);
    }
  }, [visible, value, mode]);

  if (!visible) {
    return null;
  }

  // On Android, handle date/time selection sequentially for datetime mode
  if (Platform.OS === 'android') {
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === 'dismissed') {
        setAndroidStep(null);
        onClose();
        return;
      }

      if (event.type === 'set' && selectedDate) {
        if (mode === 'datetime' && androidStep === 'date') {
          // Date selected, now show time picker
          setIntermediateDate(selectedDate);
          setAndroidStep('time');
        } else {
          // Single mode (date or time) or time step completed
          onChange(event, selectedDate);
          if (event.type === 'set') {
            setAndroidStep(null);
            onClose();
          }
        }
      }
    };

    const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
      if (event.type === 'dismissed') {
        setAndroidStep(null);
        onClose();
        return;
      }

      if (event.type === 'set' && selectedTime && intermediateDate) {
        // Merge date and time into final Date object
        const finalDate = new Date(
          intermediateDate.getFullYear(),
          intermediateDate.getMonth(),
          intermediateDate.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          selectedTime.getSeconds()
        );

        // Create a synthetic event for consistency, preserving original event structure
        const syntheticEvent: DateTimePickerEvent = {
          type: 'set',
          nativeEvent: {
            timestamp: finalDate.getTime(),
            utcOffset: event.nativeEvent?.utcOffset ?? new Date().getTimezoneOffset() * -1 * 60, // Convert to seconds, negate because getTimezoneOffset returns opposite sign
          },
        };

        onChange(syntheticEvent, finalDate);
        setAndroidStep(null);
        onClose();
      }
    };

    // Determine which picker to show
    if (mode === 'datetime') {
      if (androidStep === 'date') {
        return (
          <DateTimePicker
            value={intermediateDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        );
      } else if (androidStep === 'time') {
        return (
          <DateTimePicker
            value={intermediateDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        );
      }
      // Should not reach here, but return null as fallback
      return null;
    } else {
      // Single mode (date or time)
      return (
        <DateTimePicker value={value} mode={mode} display="default" onChange={handleDateChange} />
      );
    }
  }

  // On iOS, show the modal with spinner
  return (
    <Modal transparent={true} animationType="slide" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[20px] bg-background pb-8">
          <View className="flex-row justify-end border-b border-border p-2">
            <Button variant="ghost" onPress={onClose}>
              <Text className="font-semibold">{t('common.done')}</Text>
            </Button>
          </View>
          <DateTimePicker value={value} mode={mode} display="spinner" onChange={onChange} />
        </View>
      </View>
    </Modal>
  );
}

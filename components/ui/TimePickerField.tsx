import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.container}>
      <View style={styles.fieldRow}>
        <View>
          <Text style={styles.fieldLabel}>{label || t('common.time')}</Text>
          <Text style={styles.timeValue}>{formatDateTime(value)}</Text>
          {showHint && (
            <Text style={styles.timeHint}>{t('common.defaultsToNow')}</Text>
          )}
        </View>
        <Pressable onPress={() => setShowTimePicker(true)}>
          <Text style={styles.setTimeButton}>{t('common.setTime')}</Text>
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 15,
    color: '#2D2D2D',
    marginTop: 4,
  },
  timeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  setTimeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
});


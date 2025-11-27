import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.container}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Pressable onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
            <Text style={styles.setTimeButton}>{displayText}</Text>
            <View style={[styles.stateBadge, { backgroundColor: stateInfo.color }]}>
              <MaterialCommunityIcons name={stateInfo.icon} size={12} color="#FFF" />
              <Text style={styles.stateBadgeText}>{stateInfo.label}</Text>
            </View>
          </Pressable>
        </View>

        {showHelperText && (
          <View style={[styles.helperContainer, { borderLeftColor: stateInfo.color }]}>
            <Text style={styles.helperText}>{stateInfo.helperText}</Text>
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
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setTimeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  stateBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  helperContainer: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    paddingVertical: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});


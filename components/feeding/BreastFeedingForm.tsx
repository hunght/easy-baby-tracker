import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

type BreastFeedingFormProps = {
  isEditing: boolean;
  isPast: boolean;
  initialLeftDuration?: number;
  initialRightDuration?: number;
  onDataChange: (data: { leftDuration: number; rightDuration: number; duration: number }) => void;
};

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function BreastFeedingForm({
  isEditing,
  isPast,
  initialLeftDuration = 0,
  initialRightDuration = 0,
  onDataChange,
}: BreastFeedingFormProps) {
  const { t } = useLocalization();
  const [leftDuration, setLeftDuration] = useState(initialLeftDuration);
  const [rightDuration, setRightDuration] = useState(initialRightDuration);
  const [leftTimerActive, setLeftTimerActive] = useState(false);
  const [rightTimerActive, setRightTimerActive] = useState(false);
  const leftTimerRef = useRef<number | null>(null);
  const rightTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (leftTimerRef.current) clearInterval(leftTimerRef.current);
      if (rightTimerRef.current) clearInterval(rightTimerRef.current);
    };
  }, []);

  // Notify parent of data changes
  useEffect(() => {
    const totalDuration = leftDuration + rightDuration;
    onDataChange({
      leftDuration,
      rightDuration,
      duration: totalDuration,
    });
  }, [leftDuration, rightDuration, onDataChange]);

  const toggleLeftTimer = () => {
    if (leftTimerActive) {
      if (leftTimerRef.current) {
        clearInterval(leftTimerRef.current);
        leftTimerRef.current = null;
      }
      setLeftTimerActive(false);
    } else {
      setLeftTimerActive(true);
      leftTimerRef.current = setInterval(() => {
        setLeftDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const toggleRightTimer = () => {
    if (rightTimerActive) {
      if (rightTimerRef.current) {
        clearInterval(rightTimerRef.current);
        rightTimerRef.current = null;
      }
      setRightTimerActive(false);
    } else {
      setRightTimerActive(true);
      rightTimerRef.current = setInterval(() => {
        setRightDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  if (isEditing || isPast) {
    // Edit Mode or Past Time: Manual Inputs (forgot to record)
    return (
      <View style={styles.manualInputContainer}>
        <View style={styles.manualInputRow}>
          <Text style={styles.fieldLabel}>{t('common.leftShort')}</Text>
          <View style={styles.durationInputWrapper}>
            <TextInput
              style={styles.durationInput}
              value={Math.floor(leftDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setLeftDuration(mins * 60 + (leftDuration % 60));
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.unitText}>{t('common.unitMin')}</Text>
          </View>
        </View>
        <View style={styles.manualInputRow}>
          <Text style={styles.fieldLabel}>{t('common.rightShort')}</Text>
          <View style={styles.durationInputWrapper}>
            <TextInput
              style={styles.durationInput}
              value={Math.floor(rightDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setRightDuration(mins * 60 + (rightDuration % 60));
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.unitText}>{t('common.unitMin')}</Text>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('common.totalDuration')}</Text>
          <Text style={styles.durationText}>{formatTime(leftDuration + rightDuration)}</Text>
        </View>
      </View>
    );
  }

  // Create Mode (Now): Timers
  return (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.duration')}</Text>
        <Text style={styles.durationText}>
          {t('common.seconds', { params: { value: leftDuration + rightDuration } })}
        </Text>
      </View>

      <View style={styles.timersContainer}>
        <View style={styles.timerWrapper}>
          <Pressable style={styles.timerButton} onPress={toggleLeftTimer}>
            <MaterialCommunityIcons
              name={leftTimerActive ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text style={styles.timerLabel}>
            {t('common.leftShort')}: {formatTime(leftDuration)}
          </Text>
        </View>

        <View style={styles.timerWrapper}>
          <Pressable style={styles.timerButton} onPress={toggleRightTimer}>
            <MaterialCommunityIcons
              name={rightTimerActive ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text style={styles.timerLabel}>
            {t('common.rightShort')}: {formatTime(rightDuration)}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  manualInputContainer: {
    gap: 12,
    marginBottom: 24,
  },
  manualInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    color: '#2D2D2D',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
  },
  timersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  timerWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  timerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF5C8D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    fontSize: 16,
    color: '#2D2D2D',
    fontWeight: '500',
  },
});


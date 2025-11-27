import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

type SolidsFeedingFormProps = {
  isEditing: boolean;
  isPast: boolean;
  initialIngredient?: string;
  initialAmountGrams?: number;
  initialDuration?: number;
  onDataChange: (data: { ingredient: string; amountGrams: number; duration: number }) => void;
};

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function SolidsFeedingForm({
  isEditing,
  isPast,
  initialIngredient = '',
  initialAmountGrams = 60,
  initialDuration = 0,
  onDataChange,
}: SolidsFeedingFormProps) {
  const { t } = useLocalization();
  const [ingredient, setIngredient] = useState(initialIngredient);
  const [amountGrams, setAmountGrams] = useState(initialAmountGrams);
  const [solidsDuration, setSolidsDuration] = useState(initialDuration);
  const [solidsTimerActive, setSolidsTimerActive] = useState(false);
  const solidsTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (solidsTimerRef.current) clearInterval(solidsTimerRef.current);
    };
  }, []);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange({
      ingredient,
      amountGrams,
      duration: solidsDuration,
    });
  }, [ingredient, amountGrams, solidsDuration, onDataChange]);

  const toggleSolidsTimer = () => {
    if (solidsTimerActive) {
      if (solidsTimerRef.current) {
        clearInterval(solidsTimerRef.current);
        solidsTimerRef.current = null;
      }
      setSolidsTimerActive(false);
    } else {
      setSolidsTimerActive(true);
      solidsTimerRef.current = setInterval(() => {
        setSolidsDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  return (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.ingredient')}</Text>
        <Text style={styles.ingredientText}>{ingredient || t('common.undefined')}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={ingredient}
        onChangeText={setIngredient}
        placeholder={t('feeding.ingredientPlaceholder')}
        placeholderTextColor="#C4C4C4"
      />

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.amount')}</Text>
        <Text style={styles.amountText}>
          {amountGrams.toFixed(1)} {t('common.unitG')}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={350}
        step={5}
        value={amountGrams}
        onValueChange={setAmountGrams}
        minimumTrackTintColor="#FF5C8D"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#FFF"
      />
      <View style={styles.sliderLabels}>
        {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
          <Text key={value} style={styles.sliderLabel}>
            {value}
          </Text>
        ))}
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.duration')}</Text>
        {isEditing || isPast ? (
          <View style={styles.durationInputWrapper}>
            <TextInput
              style={styles.durationInput}
              value={Math.floor(solidsDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setSolidsDuration(mins * 60);
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.unitText}>{t('common.unitMin')}</Text>
          </View>
        ) : (
          <Text style={styles.durationText}>
            {t('common.seconds', { params: { value: solidsDuration } })}
          </Text>
        )}
      </View>
      {!isEditing && !isPast && (
        <View style={styles.timerWrapper}>
          <Pressable style={styles.timerButton} onPress={toggleSolidsTimer}>
            <MaterialCommunityIcons
              name={solidsTimerActive ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text style={styles.timerLabel}>{formatTime(solidsDuration)}</Text>
        </View>
      )}
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
  ingredientText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  durationText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginBottom: 24,
    fontSize: 16,
    color: '#2D2D2D',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#999',
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


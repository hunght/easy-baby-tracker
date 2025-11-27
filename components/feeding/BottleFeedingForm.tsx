import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { IngredientType } from '@/database/feeding';
import { useLocalization } from '@/localization/LocalizationProvider';

type BottleFeedingFormProps = {
  isEditing: boolean;
  isPast: boolean;
  initialIngredientType?: IngredientType;
  initialAmountMl?: number;
  initialDuration?: number;
  onDataChange: (data: {
    ingredientType: IngredientType;
    amountMl: number;
    duration: number;
  }) => void;
};

const ingredientTypes: { key: IngredientType; labelKey: string }[] = [
  { key: 'breast_milk', labelKey: 'feeding.ingredientTypes.breast_milk' },
  { key: 'formula', labelKey: 'feeding.ingredientTypes.formula' },
  { key: 'others', labelKey: 'feeding.ingredientTypes.others' },
];

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function BottleFeedingForm({
  isEditing,
  isPast,
  initialIngredientType = 'breast_milk',
  initialAmountMl = 60,
  initialDuration = 0,
  onDataChange,
}: BottleFeedingFormProps) {
  const { t } = useLocalization();
  const [ingredientType, setIngredientType] = useState<IngredientType>(initialIngredientType);
  const [amountMl, setAmountMl] = useState(initialAmountMl);
  const [bottleDuration, setBottleDuration] = useState(initialDuration);
  const [bottleTimerActive, setBottleTimerActive] = useState(false);
  const bottleTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (bottleTimerRef.current) clearInterval(bottleTimerRef.current);
    };
  }, []);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange({
      ingredientType,
      amountMl,
      duration: bottleDuration,
    });
  }, [ingredientType, amountMl, bottleDuration, onDataChange]);

  const toggleBottleTimer = () => {
    if (bottleTimerActive) {
      if (bottleTimerRef.current) {
        clearInterval(bottleTimerRef.current);
        bottleTimerRef.current = null;
      }
      setBottleTimerActive(false);
    } else {
      setBottleTimerActive(true);
      bottleTimerRef.current = setInterval(() => {
        setBottleDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  return (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.ingredient')}</Text>
      </View>
      <View style={styles.segmentedControl}>
        {ingredientTypes.map((ing, index) => (
          <Pressable
            key={ing.key}
            onPress={() => setIngredientType(ing.key)}
            style={[
              styles.segment,
              ingredientType === ing.key && styles.segmentActive,
              index > 0 && styles.segmentBorder,
            ]}>
            <Text
              style={[styles.segmentText, ingredientType === ing.key && styles.segmentTextActive]}>
              {t(ing.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('common.amount')}</Text>
        <Text style={styles.amountText}>
          {amountMl.toFixed(1)} {t('common.unitMl')}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={350}
        step={5}
        value={amountMl}
        onValueChange={setAmountMl}
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
              value={Math.floor(bottleDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setBottleDuration(mins * 60);
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.unitText}>{t('common.unitMin')}</Text>
          </View>
        ) : (
          <Text style={styles.durationText}>
            {t('common.seconds', { params: { value: bottleDuration } })}
          </Text>
        )}
      </View>
      {!isEditing && !isPast && (
        <View style={styles.timerWrapper}>
          <Pressable style={styles.timerButton} onPress={toggleBottleTimer}>
            <MaterialCommunityIcons
              name={bottleTimerActive ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text style={styles.timerLabel}>{formatTime(bottleDuration)}</Text>
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
  amountText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  durationText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: '#FF5C8D',
  },
  segmentBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  segmentText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#FFF',
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


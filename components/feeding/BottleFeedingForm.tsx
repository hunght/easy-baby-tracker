import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

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
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">
          {t('common.ingredient')}
        </Text>
      </View>
      <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-white">
        {ingredientTypes.map((ing, index) => (
          <Pressable
            key={ing.key}
            onPress={() => setIngredientType(ing.key)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${
              ingredientType === ing.key ? 'bg-accent' : ''
            } ${index > 0 ? 'border-l border-border' : ''}`}>
            <Text
              className={`text-sm font-semibold ${
                ingredientType === ing.key ? 'text-white' : 'text-muted-foreground'
              }`}>
              {t(ing.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
        <Text className="text-base font-semibold text-accent">
          {amountMl.toFixed(1)} {t('common.unitMl')}
        </Text>
      </View>
      <Slider
        className="mb-2 h-10 w-full"
        minimumValue={0}
        maximumValue={350}
        step={5}
        value={amountMl}
        onValueChange={setAmountMl}
        minimumTrackTintColor="#FF5C8D"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#FFF"
      />
      <View className="mb-6 flex-row justify-between px-1">
        {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
          <Text key={value} className="text-[10px] text-[#999]">
            {value}
          </Text>
        ))}
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.duration')}</Text>
        {isEditing || isPast ? (
          <View className="flex-row items-center gap-2">
            <TextInput
              className="w-[60px] rounded-lg border border-border bg-[#F9F9F9] px-3 py-2 text-center text-base text-foreground"
              value={Math.floor(bottleDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setBottleDuration(mins * 60);
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
          </View>
        ) : (
          <Text className="text-base text-foreground">
            {t('common.seconds', { params: { value: bottleDuration } })}
          </Text>
        )}
      </View>
      {!isEditing && !isPast && (
        <View className="items-center gap-3">
          <Pressable
            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-accent"
            onPress={toggleBottleTimer}>
            <MaterialCommunityIcons
              name={bottleTimerActive ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text className="text-base font-medium text-foreground">
            {formatTime(bottleDuration)}
          </Text>
        </View>
      )}
    </>
  );
}

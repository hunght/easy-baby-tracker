import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Input } from '@/components/ui/input';
import type { IngredientType } from '@/database/feeding';
import { useBrandColor } from '@/hooks/use-brand-color';
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
  const brandColors = useBrandColor();
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

  const handleIngredientChange = (type: IngredientType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredientType(type);
  };

  const toggleBottleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  // Quick amount presets for one-handed use
  const amountPresets = [30, 60, 90, 120, 150, 180];

  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">
          {t('common.ingredient')}
        </Text>
      </View>
      {/* Ingredient Type Selection - Larger touch targets */}
      <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-card">
        {ingredientTypes.map((ing, index) => (
          <Pressable
            key={ing.key}
            onPress={() => handleIngredientChange(ing.key)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-4 ${
              ingredientType === ing.key ? 'bg-accent' : ''
            } ${index > 0 ? 'border-l border-border' : ''}`}>
            <Text
              className={`text-sm font-semibold ${
                ingredientType === ing.key ? 'text-accent-foreground' : 'text-muted-foreground'
              }`}>
              {t(ing.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
        <Text className="text-lg font-bold text-accent">
          {amountMl.toFixed(0)} {t('common.unitMl')}
        </Text>
      </View>

      {/* Quick Amount Presets - One-handed friendly */}
      <View className="mb-4 flex-row flex-wrap justify-between gap-2">
        {amountPresets.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAmountMl(preset);
            }}
            className={`h-11 w-[30%] items-center justify-center rounded-xl border ${
              amountMl === preset ? 'border-accent bg-accent' : 'border-border bg-muted/30'
            }`}>
            <Text
              className={`text-sm font-semibold ${
                amountMl === preset ? 'text-white' : 'text-foreground'
              }`}>
              {preset} ml
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Slider for fine-tuning */}
      <Slider
        className="mb-2 h-12 w-full"
        minimumValue={0}
        maximumValue={350}
        step={5}
        value={amountMl}
        onValueChange={setAmountMl}
        minimumTrackTintColor={brandColors.colors.accent}
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor={brandColors.colors.white}
      />
      <View className="mb-6 flex-row justify-between px-1">
        {[0, 100, 200, 300].map((value) => (
          <Text key={value} className="text-xs text-muted-foreground">
            {value}
          </Text>
        ))}
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.duration')}</Text>
        {isEditing || isPast ? (
          <View className="flex-row items-center gap-2">
            <Input
              className="h-11 w-20 text-center text-lg"
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
          <Text className="text-lg font-semibold text-accent">{formatTime(bottleDuration)}</Text>
        )}
      </View>

      {/* Timer Button - Large for one-handed use */}
      {!isEditing && !isPast && (
        <View className="items-center gap-4 py-4">
          <Pressable
            className={`h-[88px] w-[88px] items-center justify-center rounded-full ${bottleTimerActive ? 'bg-red-500' : 'bg-accent'}`}
            onPress={toggleBottleTimer}
            style={{
              shadowColor: bottleTimerActive ? '#EF4444' : brandColors.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <MaterialCommunityIcons
              name={bottleTimerActive ? 'pause' : 'play'}
              size={36}
              color="#FFF"
            />
          </Pressable>
          <Text className="text-sm text-muted-foreground">
            {bottleTimerActive ? t('common.tapToPause') : t('common.tapToStart')}
          </Text>
        </View>
      )}
    </>
  );
}

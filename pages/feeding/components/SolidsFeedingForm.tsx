import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { useBrandColor } from '@/hooks/use-brand-color';
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
  const brandColors = useBrandColor();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  // Quick amount presets for one-handed use
  const amountPresets = [30, 50, 75, 100, 125, 150];

  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">
          {t('common.ingredient')}
        </Text>
      </View>
      <Input
        className="mb-6 h-12"
        value={ingredient}
        onChangeText={setIngredient}
        placeholder={t('feeding.ingredientPlaceholder')}
      />

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
        <Text className="text-lg font-bold text-accent">
          {amountGrams.toFixed(0)} {t('common.unitG')}
        </Text>
      </View>

      {/* Quick Amount Presets - One-handed friendly */}
      <View className="mb-4 flex-row flex-wrap justify-between gap-2">
        {amountPresets.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAmountGrams(preset);
            }}
            className={`h-11 w-[30%] items-center justify-center rounded-xl border ${
              amountGrams === preset ? 'border-accent bg-accent' : 'border-border bg-muted/30'
            }`}>
            <Text
              className={`text-sm font-semibold ${
                amountGrams === preset ? 'text-white' : 'text-foreground'
              }`}>
              {preset} g
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
        value={amountGrams}
        onValueChange={setAmountGrams}
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
              value={Math.floor(solidsDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setSolidsDuration(mins * 60);
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
          </View>
        ) : (
          <Text className="text-lg font-semibold text-accent">{formatTime(solidsDuration)}</Text>
        )}
      </View>

      {/* Timer Button - Large for one-handed use */}
      {!isEditing && !isPast && (
        <View className="items-center gap-4 py-4">
          <Pressable
            className={`h-[88px] w-[88px] items-center justify-center rounded-full ${solidsTimerActive ? 'bg-red-500' : 'bg-accent'}`}
            onPress={toggleSolidsTimer}
            style={{
              shadowColor: solidsTimerActive ? '#EF4444' : brandColors.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <MaterialCommunityIcons
              name={solidsTimerActive ? 'pause' : 'play'}
              size={36}
              color="#FFF"
            />
          </Pressable>
          <Text className="text-sm text-muted-foreground">
            {solidsTimerActive ? t('common.tapToPause') : t('common.tapToStart')}
          </Text>
        </View>
      )}
    </>
  );
}

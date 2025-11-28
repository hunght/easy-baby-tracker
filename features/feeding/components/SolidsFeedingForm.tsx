import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">
          {t('common.ingredient')}
        </Text>
        <Text className="text-base font-semibold text-accent">
          {ingredient || t('common.undefined')}
        </Text>
      </View>
      <Input
        className="mb-6"
        value={ingredient}
        onChangeText={setIngredient}
        placeholder={t('feeding.ingredientPlaceholder')}
      />

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
        <Text className="text-base font-semibold text-accent">
          {amountGrams.toFixed(1)} {t('common.unitG')}
        </Text>
      </View>
      <Slider
        className="mb-2 h-10 w-full"
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
        {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
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
              className="w-[60px] text-center"
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
          <Text className="text-base text-foreground">
            {t('common.seconds', { params: { value: solidsDuration } })}
          </Text>
        )}
      </View>
      {!isEditing && !isPast && (
        <View className="items-center gap-3">
          <Pressable
            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-accent"
            onPress={toggleSolidsTimer}>
            <MaterialCommunityIcons
              name={solidsTimerActive ? 'pause' : 'play'}
              size={24}
              color={brandColors.colors.white}
            />
          </Pressable>
          <Text className="text-base font-medium text-foreground">
            {formatTime(solidsDuration)}
          </Text>
        </View>
      )}
    </>
  );
}

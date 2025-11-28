import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { useBrandColor } from '@/hooks/use-brand-color';
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
  const brandColors = useBrandColor();
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
      <View className="mb-6 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">
            {t('common.leftShort')}
          </Text>
          <View className="flex-row items-center gap-2">
            <Input
              className="w-[60px] text-center"
              value={Math.floor(leftDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setLeftDuration(mins * 60 + (leftDuration % 60));
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">
            {t('common.rightShort')}
          </Text>
          <View className="flex-row items-center gap-2">
            <Input
              className="w-[60px] text-center"
              value={Math.floor(rightDuration / 60).toString()}
              onChangeText={(text) => {
                const mins = parseInt(text) || 0;
                setRightDuration(mins * 60 + (rightDuration % 60));
              }}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">
            {t('common.totalDuration')}
          </Text>
          <Text className="text-base text-foreground">
            {formatTime(leftDuration + rightDuration)}
          </Text>
        </View>
      </View>
    );
  }

  // Create Mode (Now): Timers
  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.duration')}</Text>
        <Text className="text-base text-foreground">
          {t('common.seconds', { params: { value: leftDuration + rightDuration } })}
        </Text>
      </View>

      <View className="my-6 flex-row justify-around">
        <View className="items-center gap-3">
          <Pressable
            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-accent"
            onPress={toggleLeftTimer}>
            <MaterialCommunityIcons
              name={leftTimerActive ? 'pause' : 'play'}
              size={24}
              color={brandColors.colors.white}
            />
          </Pressable>
          <Text className="text-base font-medium text-foreground">
            {t('common.leftShort')}: {formatTime(leftDuration)}
          </Text>
        </View>

        <View className="items-center gap-3">
          <Pressable
            className="h-[70px] w-[70px] items-center justify-center rounded-full bg-accent"
            onPress={toggleRightTimer}>
            <MaterialCommunityIcons
              name={rightTimerActive ? 'pause' : 'play'}
              size={24}
              color={brandColors.colors.white}
            />
          </Pressable>
          <Text className="text-base font-medium text-foreground">
            {t('common.rightShort')}: {formatTime(rightDuration)}
          </Text>
        </View>
      </View>
    </>
  );
}

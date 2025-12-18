import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
    // Haptic feedback on timer toggle
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (leftTimerActive) {
      if (leftTimerRef.current) {
        clearInterval(leftTimerRef.current);
        leftTimerRef.current = null;
      }
      setLeftTimerActive(false);
    } else {
      // Stop right timer if active (only one side at a time)
      if (rightTimerActive) {
        if (rightTimerRef.current) {
          clearInterval(rightTimerRef.current);
          rightTimerRef.current = null;
        }
        setRightTimerActive(false);
      }
      setLeftTimerActive(true);
      leftTimerRef.current = setInterval(() => {
        setLeftDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const toggleRightTimer = () => {
    // Haptic feedback on timer toggle
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (rightTimerActive) {
      if (rightTimerRef.current) {
        clearInterval(rightTimerRef.current);
        rightTimerRef.current = null;
      }
      setRightTimerActive(false);
    } else {
      // Stop left timer if active (only one side at a time)
      if (leftTimerActive) {
        if (leftTimerRef.current) {
          clearInterval(leftTimerRef.current);
          leftTimerRef.current = null;
        }
        setLeftTimerActive(false);
      }
      setRightTimerActive(true);
      rightTimerRef.current = setInterval(() => {
        setRightDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  if (isEditing || isPast) {
    // Edit Mode or Past Time: Manual Inputs (forgot to record)
    return (
      <View className="mb-6 gap-4">
        {/* Left Duration - Full-width tappable row */}
        <View className="flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
          <Text className="text-base font-medium text-foreground">{t('common.leftShort')}</Text>
          <View className="flex-row items-center gap-2">
            <Input
              className="h-11 w-20 text-center text-lg"
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

        {/* Right Duration - Full-width tappable row */}
        <View className="flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
          <Text className="text-base font-medium text-foreground">{t('common.rightShort')}</Text>
          <View className="flex-row items-center gap-2">
            <Input
              className="h-11 w-20 text-center text-lg"
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

        {/* Total Duration */}
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-base font-medium text-muted-foreground">
            {t('common.totalDuration')}
          </Text>
          <Text className="text-lg font-semibold text-accent">
            {formatTime(leftDuration + rightDuration)}
          </Text>
        </View>
      </View>
    );
  }

  // Create Mode (Now): Large Timer Buttons for one-handed use
  return (
    <>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base font-medium text-muted-foreground">{t('common.duration')}</Text>
        <Text className="text-lg font-semibold text-accent">
          {formatTime(leftDuration + rightDuration)}
        </Text>
      </View>

      {/* Large Timer Buttons - Optimized for one-handed use */}
      <View className="mb-6 flex-row justify-around py-4">
        {/* Left Timer */}
        <View className="items-center gap-4">
          <Pressable
            className={`h-[88px] w-[88px] items-center justify-center rounded-full ${leftTimerActive ? 'bg-red-500' : 'bg-accent'}`}
            onPress={toggleLeftTimer}
            style={{
              shadowColor: leftTimerActive ? '#EF4444' : brandColors.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <MaterialCommunityIcons
              name={leftTimerActive ? 'pause' : 'play'}
              size={36}
              color="#FFF"
            />
          </Pressable>
          <View className="items-center">
            <Text className="text-sm font-medium text-muted-foreground">
              {t('common.leftShort')}
            </Text>
            <Text className="text-xl font-bold text-foreground">{formatTime(leftDuration)}</Text>
          </View>
        </View>

        {/* Right Timer */}
        <View className="items-center gap-4">
          <Pressable
            className={`h-[88px] w-[88px] items-center justify-center rounded-full ${rightTimerActive ? 'bg-red-500' : 'bg-accent'}`}
            onPress={toggleRightTimer}
            style={{
              shadowColor: rightTimerActive ? '#EF4444' : brandColors.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <MaterialCommunityIcons
              name={rightTimerActive ? 'pause' : 'play'}
              size={36}
              color="#FFF"
            />
          </Pressable>
          <View className="items-center">
            <Text className="text-sm font-medium text-muted-foreground">
              {t('common.rightShort')}
            </Text>
            <Text className="text-xl font-bold text-foreground">{formatTime(rightDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Tip for one-handed use */}
      <Text className="text-center text-xs italic text-muted-foreground">
        {t('feeding.timerTip')}
      </Text>
    </>
  );
}

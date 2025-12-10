import { Ionicons } from '@expo/vector-icons';
import { Alert, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';

import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import { useColorScheme } from '@/hooks/use-color-scheme.web';

type SchedulePhaseCardProps = {
  item: EasyScheduleItem;
  endTime: string;
  duration: string;
  isCurrentPhase: boolean;
  isPastPhase: boolean;
  progressRatio: number;
  onPress: () => void;
};

export function SchedulePhaseCard({
  item,
  endTime,
  duration,
  isCurrentPhase,
  isPastPhase,
  progressRatio,
  onPress,
}: SchedulePhaseCardProps) {
  const brandColors = useBrandColor();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'E':
        return '🍼';
      case 'A':
        return '🧸';
      case 'S':
        return '😴';
      case 'Y':
        return '☕';
      default:
        return '•';
    }
  };

  const getPhaseStyles = (type: string) => {
    const lightMap: Record<string, string> = {
      E: '#FFF2F6',
      A: '#EBF8F1',
      S: '#EFF3FF',
    };

    const darkMap: Record<string, string> = {
      E: 'rgba(255, 138, 184, 0.15)',
      A: 'rgba(127, 227, 204, 0.15)',
      S: 'rgba(91, 127, 255, 0.15)',
    };

    return {
      container: {
        backgroundColor: isDark
          ? (darkMap[type] ?? 'rgba(245, 247, 250, 0.1)')
          : (lightMap[type] ?? '#F5F7FA'),
      },
    };
  };

  const showPhaseInfo = () => {
    Alert.alert(item.label, `${item.startTime} → ${endTime}\n${duration}`);
  };

  const phaseStyles = getPhaseStyles(item.activityType);
  const clampedProgress = Math.min(Math.max(progressRatio, 0), 1);

  return (
    <TouchableOpacity
      className={`relative min-h-[94px] flex-1 items-start justify-center overflow-hidden rounded-lg px-2.5 py-2.5 ${
        isCurrentPhase
          ? 'border border-lavender shadow-md shadow-lavender/15 dark:shadow-lavender/30'
          : 'border border-transparent'
      } ${!isCurrentPhase && isPastPhase ? 'opacity-60' : ''}`}
      style={{ backgroundColor: phaseStyles.container.backgroundColor }}
      activeOpacity={0.9}
      onPress={onPress}>
      {isCurrentPhase && (
        <View
          pointerEvents="none"
          className="bg-lavender/16 absolute bottom-0 left-0 top-0 z-0 dark:bg-lavender/25"
          style={{ width: `${clampedProgress * 100}%` }}
        />
      )}
      <TouchableOpacity
        onPress={showPhaseInfo}
        className="absolute right-1.5 top-1.5 z-[2] p-1"
        accessibilityRole="button"
        accessibilityLabel={item.label}>
        <Ionicons name="information-circle-outline" size={16} color={brandColors.colors.lavender} />
      </TouchableOpacity>
      <Text className="mb-1 text-lg">{getActivityIcon(item.activityType)}</Text>
      <View className="w-full">
        <Text className="text-sm font-semibold text-foreground">
          {item.startTime} → {endTime}
        </Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">{duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

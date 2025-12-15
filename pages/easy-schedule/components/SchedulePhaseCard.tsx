import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalization } from '@/localization/LocalizationProvider';

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
  const { t } = useLocalization();
  const colorScheme = useColorScheme();
  const isDark = (colorScheme ?? 'light') === 'dark';

  const getActivityLabel = (type: string): string => {
    const getUppercaseWord = (text: string): string => {
      const words = text.split(/\s+/);
      const uppercaseWord = words.find((word) => {
        const cleaned = word.replace(/[#{{}}\d]/g, '');
        return cleaned === cleaned.toUpperCase() && cleaned.length > 0;
      });
      return uppercaseWord?.replace(/[#{{}}\d]/g, '') || '';
    };

    switch (type) {
      case 'E': {
        const label = t('easySchedule.activityLabels.eat');
        return getUppercaseWord(label) || 'EAT';
      }
      case 'A': {
        const label = t('easySchedule.activityLabels.activity');
        return getUppercaseWord(label) || 'PLAY';
      }
      case 'S': {
        const label = t('easySchedule.activityLabels.sleep').replace('{{number}}', '');
        return getUppercaseWord(label) || 'SLEEP';
      }
      case 'Y':
        return 'YOURS';
      default:
        return '';
    }
  };

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

  const phaseStyles = getPhaseStyles(item.activityType);
  const clampedProgress = Math.min(Math.max(progressRatio, 0), 1);

  return (
    <Pressable
      className={`relative min-h-[94px] flex-1 items-start justify-center overflow-hidden rounded-lg px-2.5 py-2.5 ${
        isCurrentPhase ? 'border border-lavender' : 'border border-transparent'
      } ${!isCurrentPhase && isPastPhase ? 'opacity-60' : ''}`}
      style={{
        backgroundColor: phaseStyles.container.backgroundColor,
        ...(isCurrentPhase && {
          shadowColor: isDark ? 'rgba(199, 185, 255, 0.30)' : 'rgba(199, 185, 255, 0.15)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 4,
        }),
      }}
      onPress={onPress}>
      {isCurrentPhase && (
        <View
          className="bg-lavender/16 absolute bottom-0 left-0 top-0 dark:bg-lavender/25"
          style={{ width: `${clampedProgress * 100}%`, pointerEvents: 'none', zIndex: 0 }}
        />
      )}
      <View className="relative mb-1 flex-row items-center gap-1.5" style={{ zIndex: 1 }}>
        <Text className="text-lg">{getActivityIcon(item.activityType)}</Text>
        <Text className="text-xs font-semibold text-foreground">
          {getActivityLabel(item.activityType)}
        </Text>
      </View>
      <View className="relative w-full" style={{ zIndex: 1 }}>
        <Text className="text-sm font-semibold text-foreground">
          {item.startTime} → {endTime}
        </Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">{duration}</Text>
      </View>
    </Pressable>
  );
}

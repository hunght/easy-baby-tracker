import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { SchedulePhaseCard } from './SchedulePhaseCard';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';

type ScheduleGroupProps = {
  phases: EasyScheduleItem[];
  baseMinutes: number;
  locale: string;
  onPhasePress: (
    item: EasyScheduleItem,
    timing: { startMinutes: number; endMinutes: number },
    endTimeLabel: string,
    durationLabel: string
  ) => void;
};

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, mins] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(minutes: number, locale: string): string {
  if (minutes < 60) {
    return `${minutes}${locale === 'vi' ? 'p' : 'm'}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}${locale === 'vi' ? 'g' : 'h'}`;
  }
  return `${hours}${locale === 'vi' ? 'g' : 'h'}${mins}${locale === 'vi' ? 'p' : 'm'}`;
}

export function ScheduleGroup({
  phases,
  baseMinutes,
  locale,
  onPhasePress,
}: ScheduleGroupProps) {
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate timing map
  const phaseTimingMap = new Map<number, { startMinutes: number; endMinutes: number }>();
  let offset = 0;
  phases.forEach((item) => {
    const startMinutes = baseMinutes + offset;
    const endMinutes = startMinutes + item.durationMinutes;
    phaseTimingMap.set(item.order, { startMinutes, endMinutes });
    offset += item.durationMinutes;
  });

  const MINUTES_IN_DAY = 1440;
  const spansOvernight = Array.from(phaseTimingMap.values()).some(
    (timing) => timing.endMinutes > MINUTES_IN_DAY
  );

  const normalizedCurrentMinutes =
    currentMinutes >= baseMinutes
      ? currentMinutes
      : spansOvernight
        ? currentMinutes + MINUTES_IN_DAY
        : currentMinutes;

  return (
    <View className="flex-row justify-between gap-2 rounded-lg border border-border bg-card p-3 dark:bg-card/50">
      {phases.map((item) => {
        const endTime = calculateEndTime(item.startTime, item.durationMinutes);
        const duration = formatDuration(item.durationMinutes, locale);
        const timing = phaseTimingMap.get(item.order);
        const startMinutes = timing?.startMinutes ?? timeStringToMinutes(item.startTime);
        const endMinutes = timing?.endMinutes ?? startMinutes + item.durationMinutes;
        const isCurrentPhase =
          normalizedCurrentMinutes >= startMinutes && normalizedCurrentMinutes < endMinutes;
        const isPastPhase = normalizedCurrentMinutes >= endMinutes;
        const totalPhaseMinutes = endMinutes - startMinutes;
        const progressRatio =
          isCurrentPhase && totalPhaseMinutes > 0
            ? (normalizedCurrentMinutes - startMinutes) / totalPhaseMinutes
            : 0;

        return (
          <SchedulePhaseCard
            key={item.order}
            item={item}
            endTime={endTime}
            duration={duration}
            isCurrentPhase={isCurrentPhase}
            isPastPhase={isPastPhase}
            progressRatio={progressRatio}
            onPress={() => onPhasePress(item, { startMinutes, endMinutes }, endTime, duration)}
          />
        );
      })}
    </View>
  );
}

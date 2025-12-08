import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { SLEEP_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import { getSleepSessions } from '@/database/sleep';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useBrandColor } from '@/hooks/use-brand-color';

const screenWidth = Dimensions.get('window').width;

interface SleepChartsProps {
  startDate?: number;
  endDate?: number;
}

export function SleepCharts({ startDate, endDate }: SleepChartsProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  const { data: sessions = [] } = useQuery({
    queryKey: [...SLEEP_SESSIONS_QUERY_KEY, { startDate, endDate }],
    queryFn: () => getSleepSessions({ startDate, endDate, limit: 1000 }),
  });

  const { sleepData, avgSleep, avgNap } = useMemo(() => {
    const dailySleep: Record<string, { nap: number; night: number }> = {};
    let totalNapDuration = 0;
    let napCount = 0;
    let totalSleepDuration = 0;
    let dayCount = 0; // Approximate unique days

    sessions.forEach((s) => {
      if (!s.duration) return;

      const dateKey = new Date(s.startTime * 1000).toLocaleDateString();
      if (!dailySleep[dateKey]) {
        dailySleep[dateKey] = { nap: 0, night: 0 };
        dayCount++;
      }

      const hours = s.duration / 3600;

      if (s.kind === 'nap') {
        dailySleep[dateKey].nap += hours;
        totalNapDuration += hours;
        napCount++;
      } else {
        dailySleep[dateKey].night += hours;
      }
      totalSleepDuration += hours;
    });

    const sData = Object.entries(dailySleep)
      .map(([date, counts]) => ({
        stacks: [
          { value: counts.night, color: brandColors.colors.info, marginBottom: 2 },
          { value: counts.nap, color: brandColors.colors.secondary, marginBottom: 2 },
        ],
        label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      }))
      .slice(-7);

    return {
      sleepData: sData,
      avgSleep: dayCount > 0 ? parseFloat((totalSleepDuration / dayCount).toFixed(1)) : 0,
      avgNap: napCount > 0 ? parseFloat((totalNapDuration / napCount).toFixed(1)) : 0,
    };
  }, [sessions]);

  return (
    <View>
      <View className="flex-row">
        <View className="mr-2 flex-1">
          <SummaryCard
            title={t('sleep.avgTotal')}
            value={`${avgSleep} h`}
            icon="moon-outline"
            color={brandColors.colors.info}
          />
        </View>
        <View className="ml-2 flex-1">
          <SummaryCard
            title={t('sleep.avgNap')}
            value={`${avgNap} h`}
            icon="sunny-outline"
            color={brandColors.colors.secondary}
          />
        </View>
      </View>

      <ChartCard title={t('sleep.duration')} subtitle="Blue: Night, Orange: Nap">
        {sleepData.length > 0 ? (
          <BarChart
            stackData={sleepData}
            barWidth={30}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: 'gray' }}
            width={screenWidth - 80}
            isAnimated
          />
        ) : (
          <Text className="my-5 italic text-muted-foreground">{t('common.noData')}</Text>
        )}
      </ChartCard>
    </View>
  );
}

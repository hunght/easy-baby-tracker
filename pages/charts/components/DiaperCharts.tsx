import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { DIAPER_CHANGES_QUERY_KEY } from '@/constants/query-keys';
import { getDiaperChanges } from '@/database/diaper';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useBrandColor } from '@/hooks/use-brand-color';

const screenWidth = Dimensions.get('window').width;

interface DiaperChartsProps {
  startDate?: number;
  endDate?: number;
}

export function DiaperCharts({ startDate, endDate }: DiaperChartsProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  const { data: changes = [] } = useQuery({
    queryKey: [...DIAPER_CHANGES_QUERY_KEY, { startDate, endDate }],
    queryFn: () => getDiaperChanges({ startDate, endDate, limit: 1000 }),
  });

  const { diaperData, avgChanges, totalChanges } = useMemo(() => {
    const dailyChanges: Record<string, { wet: number; soiled: number; mixed: number }> = {};
    let dayCount = 0;

    changes.forEach((c) => {
      const dateKey = new Date(c.time * 1000).toLocaleDateString();
      if (!dailyChanges[dateKey]) {
        dailyChanges[dateKey] = { wet: 0, soiled: 0, mixed: 0 };
        dayCount++;
      }

      if (c.kind === 'wet') dailyChanges[dateKey].wet++;
      else if (c.kind === 'soiled') dailyChanges[dateKey].soiled++;
      else if (c.kind === 'mixed') dailyChanges[dateKey].mixed++;
    });

    const dData = Object.entries(dailyChanges)
      .map(([date, counts]) => ({
        stacks: [
          { value: counts.wet, color: brandColors.colors.info, marginBottom: 2 },
          { value: counts.soiled, color: brandColors.colors.destructive, marginBottom: 2 },
          { value: counts.mixed, color: brandColors.colors.secondary, marginBottom: 2 },
        ],
        label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      }))
      .slice(-7);

    return {
      diaperData: dData,
      avgChanges: dayCount > 0 ? Math.round(changes.length / dayCount) : 0,
      totalChanges: changes.length,
    };
  }, [changes, brandColors]);

  return (
    <View>
      <View className="mb-2 flex-row">
        <View className="mr-2 flex-1">
          <SummaryCard
            title={t('diaper.avgDaily')}
            value={avgChanges}
            icon="water-outline"
            color={brandColors.colors.info}
          />
        </View>
        <View className="ml-2 flex-1">
          <SummaryCard
            title={t('diaper.total')}
            value={totalChanges}
            icon="layers-outline"
            color={brandColors.colors.destructive}
          />
        </View>
      </View>

      <ChartCard title={t('diaper.frequency')} subtitle={t('diaper.chartSubtitle')}>
        {diaperData.length > 0 ? (
          <BarChart
            stackData={diaperData}
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

import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { GROWTH_RECORDS_QUERY_KEY } from '@/constants/query-keys';
import { getGrowthRecords } from '@/database/growth';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useBrandColor } from '@/hooks/use-brand-color';

const screenWidth = Dimensions.get('window').width;

interface GrowthChartsProps {
  startDate?: number;
  endDate?: number;
}

export function GrowthCharts({ startDate, endDate }: GrowthChartsProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  const { data: records = [] } = useQuery({
    queryKey: [...GROWTH_RECORDS_QUERY_KEY, { startDate, endDate }],
    queryFn: () => getGrowthRecords({ startDate, endDate, limit: 100 }),
  });

  const { weightData, heightData, latestWeight, latestHeight } = useMemo(() => {
    // Process Weight
    const wData = records
      .filter((r) => r.weightKg != null)
      .map((r) => ({
        value: r.weightKg ?? 0,
        label: new Date(r.time * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        dataPointText: r.weightKg?.toString(),
      }))
      .reverse();

    // Process Height
    const hData = records
      .filter((r) => r.heightCm != null)
      .map((r) => ({
        value: r.heightCm ?? 0,
        label: new Date(r.time * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        dataPointText: r.heightCm?.toString(),
      }))
      .reverse();

    return {
      weightData: wData,
      heightData: hData,
      latestWeight: wData.length > 0 ? wData[wData.length - 1].value : 0,
      latestHeight: hData.length > 0 ? hData[hData.length - 1].value : 0,
    };
  }, [records]);

  return (
    <View>
      <View className="flex-row">
        <View className="mr-2 flex-1">
          <SummaryCard
            title={t('growth.weight')}
            value={`${latestWeight} kg`}
            icon="scale-outline"
            color={brandColors.colors.accent}
          />
        </View>
        <View className="ml-2 flex-1">
          <SummaryCard
            title={t('growth.height')}
            value={`${latestHeight} cm`}
            icon="resize-outline"
            color={brandColors.colors.info}
          />
        </View>
      </View>

      <ChartCard title={t('growth.weightTrend')}>
        {weightData.length > 0 ? (
          <LineChart
            data={weightData}
            color={brandColors.colors.info}
            thickness={3}
            dataPointsColor={brandColors.colors.info}
            startFillColor={brandColors.colors.info}
            endFillColor={brandColors.colors.info + '10'}
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={20}
            noOfSections={5}
            yAxisColor="lightgray"
            xAxisColor="lightgray"
            yAxisTextStyle={{ color: 'gray' }}
            width={screenWidth - 80}
            curved
            isAnimated
            areaChart
          />
        ) : (
          <Text className="my-5 italic text-muted-foreground">{t('common.noData')}</Text>
        )}
      </ChartCard>

      <ChartCard title={t('growth.heightTrend')}>
        {heightData.length > 0 ? (
          <LineChart
            data={heightData}
            color={brandColors.colors.accent}
            thickness={3}
            dataPointsColor={brandColors.colors.accent}
            startFillColor={brandColors.colors.accent}
            endFillColor={brandColors.colors.accent + '10'}
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={20}
            noOfSections={5}
            yAxisColor="lightgray"
            xAxisColor="lightgray"
            yAxisTextStyle={{ color: 'gray' }}
            width={screenWidth - 80}
            curved
            isAnimated
            areaChart
          />
        ) : (
          <Text className="my-5 italic text-muted-foreground">{t('common.noData')}</Text>
        )}
      </ChartCard>
    </View>
  );
}

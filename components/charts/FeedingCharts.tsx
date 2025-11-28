import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { FEEDINGS_QUERY_KEY } from '@/constants/query-keys';
import { getBrandColor } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { getFeedings } from '@/database/feeding';
import { useLocalization } from '@/localization/LocalizationProvider';

const screenWidth = Dimensions.get('window').width;

interface FeedingChartsProps {
  startDate?: number;
  endDate?: number;
}

export function FeedingCharts({ startDate, endDate }: FeedingChartsProps) {
  const { t } = useLocalization();
  const { colorScheme } = useTheme();

  const { data: feedings = [] } = useQuery({
    queryKey: [...FEEDINGS_QUERY_KEY, { startDate, endDate }],
    queryFn: () => getFeedings({ startDate, endDate, limit: 1000 }),
  });

  const { volumeData, durationData, avgVolume, totalFeedings } = useMemo(() => {
    // Process Volume (Bottle/Pumped)
    const dailyVolume: Record<string, number> = {};
    let totalVol = 0;
    let volCount = 0;

    // Process Duration (Breastfeeding)
    const dailyDuration: Record<string, number> = {};

    feedings.forEach((f) => {
      const dateKey = new Date(f.startTime * 1000).toLocaleDateString();

      if (f.amountMl) {
        dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + f.amountMl;
        totalVol += f.amountMl;
        volCount++;
      }

      if (f.type === 'breast' && f.duration) {
        // Duration in minutes
        const mins = Math.round(f.duration / 60);
        dailyDuration[dateKey] = (dailyDuration[dateKey] || 0) + mins;
      }
    });

    // Format Volume Data
    const vData = Object.entries(dailyVolume)
      .map(([date, vol]) => ({
        value: vol,
        label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
        frontColor: getBrandColor('primary', colorScheme),
        topLabelComponent: () => (
          <View style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: 'gray' }}>{Math.round(vol)}</Text>
          </View>
        ),
      }))
      .slice(-7);

    // Format Duration Data
    const dData = Object.entries(dailyDuration)
      .map(([date, dur]) => ({
        value: dur,
        label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
        dataPointText: dur.toString(),
        textColor: getBrandColor('secondary', colorScheme),
      }))
      .slice(-7);

    return {
      volumeData: vData,
      durationData: dData,
      avgVolume: volCount > 0 ? Math.round(totalVol / volCount) : 0,
      totalFeedings: feedings.length,
    };
  }, [feedings, colorScheme]);

  return (
    <View>
      <View className="mb-2 flex-row">
        <View className="mr-2 flex-1">
          <SummaryCard
            title={t('feeding.avgVolume')}
            value={`${avgVolume} ml`}
            icon="water-outline"
            color={getBrandColor('primary', colorScheme)}
          />
        </View>
        <View className="ml-2 flex-1">
          <SummaryCard
            title={t('feeding.total')}
            value={totalFeedings}
            icon="restaurant-outline"
            color={getBrandColor('accent', colorScheme)}
          />
        </View>
      </View>

      <ChartCard title={t('feeding.volume')}>
        {volumeData.length > 0 ? (
          <BarChart
            data={volumeData}
            barWidth={30}
            noOfSections={4}
            barBorderRadius={4}
            frontColor={getBrandColor('primary', colorScheme)}
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

      <ChartCard title={t('feeding.duration')}>
        {durationData.length > 0 ? (
          <LineChart
            data={durationData}
            color={getBrandColor('secondary', colorScheme)}
            thickness={3}
            dataPointsColor={getBrandColor('secondary', colorScheme)}
            startFillColor={getBrandColor('secondary', colorScheme)}
            endFillColor={getBrandColor('secondary', colorScheme) + '10'}
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={20}
            noOfSections={4}
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

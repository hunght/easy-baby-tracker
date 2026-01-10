import { useQuery } from 'convex/react';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { api } from '@/convex/_generated/api';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useBrandColor } from '@/hooks/use-brand-color';

const screenWidth = Dimensions.get('window').width;

interface FeedingChartsProps {
  startDate?: number;
  endDate?: number;
}

export function FeedingCharts({ startDate, endDate }: FeedingChartsProps) {
  const { t } = useLocalization();
  const brandColors = useBrandColor();

  // Get active baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

  const feedings = useQuery(
    api.feedings.list,
    babyProfile?._id ? { babyId: babyProfile._id, startDate, endDate, limit: 1000 } : "skip"
  ) ?? [];

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
        frontColor: brandColors.colors.primary,
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
        textColor: brandColors.colors.secondary,
      }))
      .slice(-7);

    return {
      volumeData: vData,
      durationData: dData,
      avgVolume: volCount > 0 ? Math.round(totalVol / volCount) : 0,
      totalFeedings: feedings.length,
    };
  }, [feedings, brandColors]);

  return (
    <View>
      <View className="mb-2 flex-row">
        <View className="mr-2 flex-1">
          <SummaryCard
            title={t('feeding.avgVolume')}
            value={`${avgVolume} ml`}
            icon="water-outline"
            color={brandColors.colors.primary}
          />
        </View>
        <View className="ml-2 flex-1">
          <SummaryCard
            title={t('feeding.total')}
            value={totalFeedings}
            icon="restaurant-outline"
            color={brandColors.colors.accent}
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
            frontColor={brandColors.colors.primary}
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
            color={brandColors.colors.secondary}
            thickness={3}
            dataPointsColor={brandColors.colors.secondary}
            startFillColor={brandColors.colors.secondary}
            endFillColor={brandColors.colors.secondary + '10'}
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

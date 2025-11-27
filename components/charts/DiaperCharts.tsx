import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ChartCard } from './ChartCard';
import { SummaryCard } from './SummaryCard';

import { DIAPER_CHANGES_QUERY_KEY } from '@/constants/query-keys';
import { BrandColors } from '@/constants/theme';
import { getDiaperChanges } from '@/database/diaper';
import { useLocalization } from '@/localization/LocalizationProvider';

const screenWidth = Dimensions.get('window').width;

interface DiaperChartsProps {
    startDate?: number;
    endDate?: number;
}

export function DiaperCharts({ startDate, endDate }: DiaperChartsProps) {
    const { t } = useLocalization();

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
                    { value: counts.wet, color: BrandColors.info, marginBottom: 2 },
                    { value: counts.soiled, color: BrandColors.warning, marginBottom: 2 },
                    { value: counts.mixed, color: BrandColors.secondary, marginBottom: 2 },
                ],
                label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            }))
            .slice(-7);

        return {
            diaperData: dData,
            avgChanges: dayCount > 0 ? Math.round(changes.length / dayCount) : 0,
            totalChanges: changes.length,
        };
    }, [changes]);

    return (
        <View>
            <View style={styles.summaryRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <SummaryCard
                        title={t('diaper.avgDaily')}
                        value={avgChanges}
                        icon="water-outline"
                        color={BrandColors.info}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <SummaryCard
                        title={t('diaper.total')}
                        value={totalChanges}
                        icon="layers-outline"
                        color={BrandColors.warning}
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
                    <Text style={styles.noData}>{t('common.noData')}</Text>
                )}
            </ChartCard>
        </View>
    );
}

const styles = StyleSheet.create({
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    noData: {
        color: '#8B8B8B',
        fontStyle: 'italic',
        marginVertical: 20,
    },
});

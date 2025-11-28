import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';

import { TabPageHeader } from '@/components/TabPageHeader';
import { DiaperCharts } from '@/features/charts/components/DiaperCharts';
import { FeedingCharts } from '@/features/charts/components/FeedingCharts';
import { GrowthCharts } from '@/features/charts/components/GrowthCharts';
import { SleepCharts } from '@/features/charts/components/SleepCharts';
import { useLocalization } from '@/localization/LocalizationProvider';

type ChartCategory = 'feeding' | 'sleep' | 'growth' | 'diaper';

export default function ChartsScreen() {
  const { t } = useLocalization();
  const [selectedCategory, setSelectedCategory] = useState<ChartCategory>('feeding');

  const categories: { id: ChartCategory; label: string }[] = [
    { id: 'feeding', label: t('tracking.tiles.feeding.label') },
    { id: 'sleep', label: t('tracking.tiles.sleep.label') },
    { id: 'growth', label: t('tracking.tiles.growth.label') },
    { id: 'diaper', label: t('tracking.tiles.diaper.label') },
  ];

  const renderContent = () => {
    switch (selectedCategory) {
      case 'feeding':
        return <FeedingCharts />;
      case 'sleep':
        return <SleepCharts />;
      case 'growth':
        return <GrowthCharts />;
      case 'diaper':
        return <DiaperCharts />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('charts.title')} />

      <View className="border-b border-border py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 gap-3">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Badge
                key={cat.id}
                asChild
                variant={active ? 'default' : 'outline'}
                className={active ? 'bg-primary' : ''}>
                <Pressable
                  onPress={() => setSelectedCategory(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t('charts.accessibility.selectCategory', {
                    defaultValue: 'Show %{category} charts',
                    params: { category: cat.label },
                  })}>
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-primary-foreground' : ''}`}>
                    {cat.label}
                  </Text>
                </Pressable>
              </Badge>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5">
        {renderContent()}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}

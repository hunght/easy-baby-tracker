import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

import { TabPageHeader } from '@/components/TabPageHeader';
import { DiaperCharts } from '@/components/charts/DiaperCharts';
import { FeedingCharts } from '@/components/charts/FeedingCharts';
import { GrowthCharts } from '@/components/charts/GrowthCharts';
import { SleepCharts } from '@/components/charts/SleepCharts';
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

      <View className="py-3 border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-3">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={[
                  'px-4 py-2 rounded-full border',
                  active ? 'bg-primary border-primary' : 'bg-accent border-border',
                ].join(' ')}
                role="button"
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text className={active ? 'text-primary-foreground text-sm font-semibold' : 'text-muted-foreground text-sm font-semibold'}>
                  {cat.label}
                </Text>
              </Pressable>
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


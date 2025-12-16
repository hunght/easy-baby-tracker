import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { TimelineActivityType } from '@/database/timeline';
import { FeatureKey, useFeatureFlags } from '@/context/FeatureFlagContext';

const FILTERS: { label: string; value: TimelineActivityType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Feeding', value: 'feeding' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Diaper', value: 'diaper' },
  { label: 'Health', value: 'health' },
  { label: 'Growth', value: 'growth' },
  { label: 'Pumping', value: 'pumping' },
  { label: 'Diary', value: 'diary' },
];

type Props = {
  selectedFilter: TimelineActivityType | 'all';
  onSelectFilter: (filter: TimelineActivityType | 'all') => void;
};

export const TimelineFilters = ({ selectedFilter, onSelectFilter }: Props) => {
  const { features } = useFeatureFlags();

  const visibleFilters = React.useMemo(() => {
    return FILTERS.filter((f) => {
      if (f.value === 'all') return true;
      return features[f.value as FeatureKey];
    });
  }, [features]);

  return (
    <View className="bg-background py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2">
        {visibleFilters.map((filter) => {
          const isSelected = selectedFilter === filter.value;
          return (
            <Badge
              key={filter.value}
              variant={isSelected ? 'default' : 'outline'}
              className="h-8 px-4"
              accessibilityState={{ selected: isSelected }}>
              <Pressable key={filter.value} onPress={() => onSelectFilter(filter.value)}>
                <Text className={isSelected ? 'text-primary-foreground' : 'text-foreground'}>
                  {filter.label}
                </Text>
              </Pressable>
            </Badge>
          );
        })}
      </ScrollView>
    </View>
  );
};

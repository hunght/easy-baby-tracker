import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { TimelineActivityType } from '@/database/timeline';

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
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {FILTERS.map((filter) => {
                    const isSelected = selectedFilter === filter.value;
                    return (
                        <Badge
                            key={filter.value}
                            variant={isSelected ? 'default' : 'outline'}
                            onPress={() => onSelectFilter(filter.value)}
                            className="h-8 px-4"
                            accessibilityState={{ selected: isSelected }}
                        >
                            <Text className={isSelected ? 'text-primary-foreground' : 'text-foreground'}>
                                {filter.label}
                            </Text>
                        </Badge>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F6F2FF',
        paddingVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
});

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
                        <TouchableOpacity
                            key={filter.value}
                            style={[styles.chip, isSelected && styles.selectedChip]}
                            onPress={() => onSelectFilter(filter.value)}
                        >
                            <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
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
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedChip: {
        backgroundColor: '#6200EE',
        borderColor: '#6200EE',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    selectedChipText: {
        color: 'white',
    },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
}

export function SummaryCard({ title, value, icon, color = BrandColors.primary }: SummaryCardProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                {icon && <Ionicons name={icon} size={24} color={color} />}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    value: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    title: {
        fontSize: 14,
        color: '#8B8B8B',
        marginTop: 2,
    },
});

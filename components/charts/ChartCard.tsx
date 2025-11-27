import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';


interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

export function ChartCard({ title, subtitle, children, style }: ChartCardProps) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    subtitle: {
        fontSize: 14,
        color: '#8B8B8B',
        marginTop: 4,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

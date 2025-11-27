import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TimelineActivity } from '@/database/timeline';
import {
    DiaperCard,
    DiaryCard,
    FeedingCard,
    GrowthCard,
    HealthCard,
    PumpingCard,
    SleepCard,
} from './ActivityCards';

export const TimelineItem = ({
    item,
    onDelete,
}: {
    item: TimelineActivity;
    onDelete?: (item: TimelineActivity) => void;
}) => {
    const router = useRouter();
    const date = new Date(item.timestamp * 1000);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const renderCard = () => {
        switch (item.type) {
            case 'diaper':
                return <DiaperCard data={item.data} />;
            case 'feeding':
                return <FeedingCard data={item.data} />;
            case 'sleep':
                return <SleepCard data={item.data} />;
            case 'growth':
                return <GrowthCard data={item.data} />;
            case 'health':
                return <HealthCard data={item.data} />;
            case 'pumping':
                return <PumpingCard data={item.data} />;
            case 'diary':
                return <DiaryCard data={item.data} />;
            default:
                return null;
        }
    };

    const handlePress = () => {
        // @ts-ignore - Dynamic routing
        router.push({
            pathname: `/${item.type}`,
            params: { id: item.data.id },
        });
    };

    const handleLongPress = () => {
        if (!onDelete) return;

        Alert.alert(
            'Delete Activity',
            'Are you sure you want to delete this activity? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(item),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{timeString}</Text>
                <View style={styles.line} />
            </View>
            <View style={styles.cardContainer}>
                <Pressable onPress={handlePress} onLongPress={handleLongPress}>
                    {renderCard()}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    timeContainer: {
        width: 60,
        alignItems: 'center',
        paddingTop: 16,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        marginBottom: 8,
    },
    line: {
        width: 1,
        flex: 1,
        backgroundColor: '#E0E0E0',
    },
    cardContainer: {
        flex: 1,
        paddingBottom: 16,
    },
});

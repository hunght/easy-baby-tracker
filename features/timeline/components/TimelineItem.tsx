import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

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
    <View className="flex-row px-4">
      <View className="w-[60px] items-center pt-4">
        <Text className="mb-2 text-xs font-semibold text-[#888]">{timeString}</Text>
        <View className="w-px flex-1 bg-border" />
      </View>
      <View className="flex-1 pb-4">
        <Pressable onPress={handlePress} onLongPress={handleLongPress}>
          {renderCard()}
        </Pressable>
      </View>
    </View>
  );
};

import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type { TimelineActivity, TimelineActivityType } from "@/database/timeline";
import type { DiaperChangeRecord } from "@/database/diaper";
import type { FeedingRecord } from "@/database/feeding";
import type { SleepSessionRecord } from "@/database/sleep";
import type { GrowthRecord } from "@/database/growth";
import type { HealthRecord } from "@/database/health";
import type { PumpingRecord } from "@/database/pumping";
import type { DiaryEntryRecord } from "@/database/diary";
import {
  DiaperCard,
  DiaryCard,
  FeedingCard,
  GrowthCard,
  HealthCard,
  PumpingCard,
  SleepCard,
} from "./ActivityCards";

export type TimelineItemData = {
  id: string;
  type: TimelineActivityType;
  time: number;
  data: Record<string, unknown>;
};

export const TimelineItem = ({
  item,
  onDelete,
}: {
  item: TimelineItemData;
  onDelete?: (item: TimelineItemData) => void;
}) => {
  const router = useRouter();
  const date = new Date(item.time * 1000);
  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderCard = () => {
    switch (item.type) {
      case "diaper":
        return <DiaperCard data={item.data as unknown as DiaperChangeRecord} />;
      case "feeding":
        return <FeedingCard data={item.data as unknown as FeedingRecord} />;
      case "sleep":
        return <SleepCard data={item.data as unknown as SleepSessionRecord} />;
      case "growth":
        return <GrowthCard data={item.data as unknown as GrowthRecord} />;
      case "health":
        return <HealthCard data={item.data as unknown as HealthRecord} />;
      case "pumping":
        return <PumpingCard data={item.data as unknown as PumpingRecord} />;
      case "diary":
        return <DiaryCard data={item.data as unknown as DiaryEntryRecord} />;
      default:
        return null;
    }
  };

  const handlePress = () => {
    // @ts-ignore - Dynamic routing
    router.push({
      pathname: `/${item.type}`,
      params: { id: item.id },
    });
  };

  const handleLongPress = () => {
    if (!onDelete) return;

    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item),
        },
      ]
    );
  };

  return (
    <View className="flex-row px-4">
      <View className="w-[60px] items-center pt-4">
        <Text className="mb-2 text-xs font-semibold text-muted-foreground">
          {timeString}
        </Text>
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

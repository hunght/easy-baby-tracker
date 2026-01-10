import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useCallback } from "react";
import { ActivityIndicator, SectionList, View } from "react-native";

import { TimelineFilters } from "@/pages/timeline/components/TimelineFilters";
import { TimelineItem, type TimelineItemData } from "@/pages/timeline/components/TimelineItem";
import type { Id } from "@/convex/_generated/dataModel";
import { useNotification } from "@/components/NotificationContext";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useBrandColor } from "@/hooks/use-brand-color";
import { api } from "@/convex/_generated/api";
import type { TimelineActivityType } from "@/database/timeline";
import { useLocalization } from "@/localization/LocalizationProvider";
import { useFeatureFlags } from "@/context/FeatureFlagContext";

export function TimelineTabContent() {
  const router = useRouter();
  const { t } = useLocalization();
  const { features } = useFeatureFlags();
  const { showNotification } = useNotification();
  const brandColors = useBrandColor();
  const [filter, setFilter] = useState<TimelineActivityType | "all">("all");
  const [beforeTime, setBeforeTime] = useState<number | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get active baby profile
  const profile = useQuery(api.babyProfiles.getActive);

  // Build filter types based on enabled features
  const filterTypes = useMemo(() => {
    if (filter !== "all") {
      return [filter];
    }
    const validTypes: TimelineActivityType[] = [
      "feeding",
      "sleep",
      "diaper",
      "health",
      "growth",
      "pumping",
      "diary",
    ];
    return validTypes.filter((type) => features[type]);
  }, [filter, features]);

  // Query timeline activities
  const activities =
    useQuery(
      api.timeline.getActivities,
      profile?._id
        ? {
            babyId: profile._id,
            beforeTime: beforeTime ?? Math.floor(Date.now() / 1000) + 86400,
            limit: 50,
            filterTypes,
          }
        : "skip"
    ) ?? [];

  // Delete mutation
  const deleteActivity = useMutation(api.timeline.deleteActivity);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setBeforeTime(undefined);
      setRefreshKey((k) => k + 1);
    }, [])
  );

  const handleRefresh = () => {
    setBeforeTime(undefined);
    setRefreshKey((k) => k + 1);
  };

  const handleLoadMore = () => {
    if (activities.length > 0) {
      const lastItem = activities[activities.length - 1];
      if (lastItem && lastItem.time < (beforeTime ?? Infinity)) {
        setBeforeTime(lastItem.time);
      }
    }
  };

  const handleDelete = async (item: TimelineItemData) => {
    try {
      await deleteActivity({
        activityType: item.type,
        activityId: item.id as Id<"diaperChanges" | "feedings" | "growthRecords" | "healthRecords" | "pumpings" | "sleepSessions" | "diaryEntries">,
      });
      showNotification(t("common.deleteSuccess"), "success");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      showNotification(t("common.deleteError"), "error");
    }
  };

  const groupActivitiesByDate = (
    items: typeof activities
  ): { title: string; data: typeof activities }[] => {
    const groups: { title: string; data: typeof activities }[] = [];

    items.forEach((item) => {
      const date = new Date(item.time * 1000);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let title = date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      if (date.toDateString() === today.toDateString()) {
        title = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        title = "Yesterday";
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.title === title) {
        lastGroup.data.push(item);
      } else {
        groups.push({ title, data: [item] });
      }
    });

    return groups;
  };

  const sections = groupActivitiesByDate(activities);
  const isLoading = profile === undefined || activities === undefined;

  return (
    <View className="flex-1">
      <TimelineFilters selectedFilter={filter} onSelectFilter={setFilter} />

      {isLoading && activities.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={brandColors.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            // Convert Convex activity to TimelineItemData
            const itemData: TimelineItemData = {
              id: String(item.id),
              type: item.type,
              time: item.time,
              data: item.data,
            };
            return <TimelineItem item={itemData} onDelete={handleDelete} />;
          }}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background px-6 py-3">
              <Text className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {title}
              </Text>
            </View>
          )}
          contentContainerClassName="pb-6"
          refreshing={false}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center p-10">
                <Text className="mb-4 text-base text-muted-foreground">
                  No activities found
                </Text>
                <Button onPress={() => router.replace("/(tabs)/tracking")}>
                  <Text>
                    {t("common.addActivity", { defaultValue: "Add Activity" })}
                  </Text>
                </Button>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

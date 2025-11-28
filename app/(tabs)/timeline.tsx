import { useFocusEffect } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { TimelineFilters } from '@/features/timeline/components/TimelineFilters';
import { TimelineItem } from '@/features/timeline/components/TimelineItem';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import {
  DIAPER_CHANGES_QUERY_KEY,
  DIARY_ENTRIES_QUERY_KEY,
  FEEDINGS_QUERY_KEY,
  GROWTH_RECORDS_QUERY_KEY,
  HEALTH_RECORDS_QUERY_KEY,
  PUMPINGS_QUERY_KEY,
  SLEEP_SESSIONS_QUERY_KEY,
  TIMELINE_ACTIVITIES_QUERY_KEY,
} from '@/constants/query-keys';
import {
  deleteTimelineActivity,
  getTimelineActivities,
  TimelineActivity,
  TimelineActivityType,
} from '@/database/timeline';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function TimelineScreen() {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const brandColors = useBrandColor();
  const [filter, setFilter] = React.useState<TimelineActivityType | 'all'>('all');

  const initialPageParam: number | undefined = undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [...TIMELINE_ACTIVITIES_QUERY_KEY, filter],
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      const beforeTime = pageParam ?? Math.floor(Date.now() / 1000) + 86400; // Future buffer
      return getTimelineActivities({
        beforeTime,
        limit: 20,
        filterTypes: filter === 'all' ? undefined : [filter],
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) {
        return undefined; // No more pages
      }
      // Return the timestamp of the last item for the next page
      return lastPage[lastPage.length - 1]?.timestamp;
    },
    initialPageParam,
  });

  // Flatten all pages into a single array
  const activities = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  // Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (activity: TimelineActivity) => deleteTimelineActivity(activity),
    onSuccess: (_, activity) => {
      // Invalidate timeline queries
      queryClient.invalidateQueries({ queryKey: TIMELINE_ACTIVITIES_QUERY_KEY });

      // Invalidate the specific activity type query
      switch (activity.type) {
        case 'diaper':
          queryClient.invalidateQueries({ queryKey: DIAPER_CHANGES_QUERY_KEY });
          break;
        case 'feeding':
          queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
          break;
        case 'sleep':
          queryClient.invalidateQueries({ queryKey: SLEEP_SESSIONS_QUERY_KEY });
          break;
        case 'growth':
          queryClient.invalidateQueries({ queryKey: GROWTH_RECORDS_QUERY_KEY });
          break;
        case 'health':
          queryClient.invalidateQueries({ queryKey: HEALTH_RECORDS_QUERY_KEY });
          break;
        case 'pumping':
          queryClient.invalidateQueries({ queryKey: PUMPINGS_QUERY_KEY });
          break;
        case 'diary':
          queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY });
          break;
      }

      showNotification(t('common.deleteSuccess'), 'success');
    },
    onError: (error) => {
      console.error('Failed to delete activity:', error);
      showNotification(t('common.deleteError'), 'error');
    },
  });

  const handleDelete = (activity: TimelineActivity) => {
    deleteMutation.mutate(activity);
  };

  const groupActivitiesByDate = (items: TimelineActivity[]) => {
    const groups: { title: string; data: TimelineActivity[] }[] = [];

    items.forEach((item) => {
      const date = new Date(item.timestamp * 1000);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let title = date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (date.toDateString() === today.toDateString()) {
        title = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        title = 'Yesterday';
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

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('timeline.title')} />

      <TimelineFilters selectedFilter={filter} onSelectFilter={setFilter} />

      {isFetching && !isRefetching && activities.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={brandColors.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TimelineItem item={item} onDelete={handleDelete} />}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background px-6 py-3">
              <Text className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {title}
              </Text>
            </View>
          )}
          contentContainerClassName="pb-6"
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color={brandColors.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isFetching ? (
              <View className="items-center p-10">
                <Text className="text-base text-muted-foreground">No activities found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

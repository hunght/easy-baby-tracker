import { useFocusEffect } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { TimelineFilters } from '@/components/timeline/TimelineFilters';
import { TimelineItem } from '@/components/timeline/TimelineItem';
import { useNotification } from '@/components/ui/NotificationContext';
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
  const [filter, setFilter] = React.useState<TimelineActivityType | 'all'>('all');

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
    queryFn: async ({ pageParam }) => {
      const beforeTime =
        pageParam ?? Math.floor(Date.now() / 1000) + 86400; // Future buffer
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
    initialPageParam: undefined as number | undefined,
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
    <View style={styles.container}>
      <TabPageHeader title={t('timeline.title')} />

      <TimelineFilters selectedFilter={filter} onSelectFilter={setFilter} />

      {isFetching && !isRefetching && activities.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TimelineItem item={item} onDelete={handleDelete} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#6200EE" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isFetching ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#F6F2FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});


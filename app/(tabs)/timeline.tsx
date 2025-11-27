import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TIMELINE_ACTIVITIES_QUERY_KEY } from '@/constants/query-keys';
import { getTimelineActivities, type TimelineActivity } from '@/database/timeline';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { View } from 'react-native';

export default function TimelineTab() {
  const { data, isLoading } = useQuery({
    queryKey: TIMELINE_ACTIVITIES_QUERY_KEY,
    queryFn: () => getTimelineActivities({ limit: 30 }),
  });

  return (
    <View className="flex-1 gap-3 p-4">
      <Text variant="h1" className="text-2xl">Timeline</Text>
      {isLoading && <Text>Loading…</Text>}
      {data?.map((item) => (
        <Card key={item.id} className="p-3">
          <Text className="font-medium">{item.type.toUpperCase()}</Text>
          <Text className="text-muted-foreground">{new Date(item.timestamp * 1000).toLocaleString()}</Text>
        </Card>
      ))}
    </View>
  );
}

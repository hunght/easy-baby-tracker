import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { TabPageHeader } from '@/components/TabPageHeader';
import { SCHEDULED_NOTIFICATIONS_QUERY_KEY } from '@/constants/query-keys';
import {
  getActiveScheduledNotifications,
  type ScheduledNotificationRecord,
} from '@/database/scheduled-notifications';
import { cancelScheduledNotification } from '@/lib/notification-scheduler';
import { useLocalization } from '@/localization/LocalizationProvider';

function safeParseData(record: ScheduledNotificationRecord) {
  if (!record.data) return null;
  try {
    return JSON.parse(record.data);
  } catch {
    return null;
  }
}

export default function SchedulingScreen() {
  const { t, locale } = useLocalization();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    data: scheduledNotifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ScheduledNotificationRecord[]>({
    queryKey: SCHEDULED_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getActiveScheduledNotifications(),
    staleTime: 15 * 1000,
  });

  const notifications = useMemo(
    () => [...scheduledNotifications].sort((a, b) => a.scheduledTime - b.scheduledTime),
    [scheduledNotifications]
  );

  const typeLabels = useMemo(
    () => ({
      feeding: t('scheduling.typeLabels.feeding'),
      pumping: t('scheduling.typeLabels.pumping'),
      sleep: t('scheduling.typeLabels.sleep'),
      diaper: t('scheduling.typeLabels.diaper'),
      default: t('scheduling.typeLabels.default'),
    }),
    [t]
  );

  const nextReminder = notifications[0];

  const cancelMutation = useMutation({
    mutationFn: async (notificationId: string) => cancelScheduledNotification(notificationId),
    onSuccess: () => {
      Alert.alert(t('scheduling.cancelSuccessTitle'), t('scheduling.cancelSuccessMessage'));
      queryClient.invalidateQueries({ queryKey: SCHEDULED_NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => {
      Alert.alert(t('scheduling.cancelErrorTitle'), t('scheduling.cancelErrorMessage'));
    },
    onSettled: () => setPendingId(null),
  });

  const handleCancel = (notificationId: string) => {
    setPendingId(notificationId);
    cancelMutation.mutate(notificationId);
  };

  const renderCard = (record: ScheduledNotificationRecord, isNext = false) => {
    const parsedData = safeParseData(record);
    const notificationType =
      record.notificationType in typeLabels ? record.notificationType : 'default';
    const label = parsedData?.label ?? typeLabels[notificationType];
    const scheduledDate = new Date(record.scheduledTime * 1000);
    const dateString = scheduledDate.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeString = scheduledDate.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const minutesLeft = Math.max(Math.round((scheduledDate.getTime() - Date.now()) / 60000), 0);

    return (
      <View
        key={record.notificationId}
        className={[
          'mb-3 rounded-2xl border border-border bg-card p-4 shadow-sm',
          isNext ? 'border-primary/30 shadow-md' : '',
        ].join(' ')}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="mr-3 flex-1 text-base font-semibold text-foreground">{label}</Text>
          <Badge variant="secondary">
            <Text>{typeLabels[notificationType]}</Text>
          </Badge>
        </View>
        <Text className="text-sm text-foreground/80">
          {t('scheduling.dueAt', { params: { date: dateString, time: timeString } })}
        </Text>
        <Text className="mt-1 text-[13px] text-muted-foreground">
          {t('scheduling.minutesRemaining', { params: { minutes: minutesLeft } })}
        </Text>
        <Button
          variant="outline"
          className="mt-3 rounded-xl"
          onPress={() => handleCancel(record.notificationId)}
          disabled={pendingId === record.notificationId}
          accessibilityLabel={t('scheduling.accessibility.cancelNotification', {
            defaultValue: 'Cancel %{label} notification',
            params: { label },
          })}>
          <Text className="font-semibold text-destructive/80">{t('scheduling.cancel')}</Text>
        </Button>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator className="mt-10" />;
    }

    if (notifications.length === 0) {
      return (
        <View className="items-center py-16">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
            <Ionicons name="calendar-outline" size={36} color="#B7B7C8" />
          </View>
          <Text className="mb-2 text-lg font-semibold text-foreground">
            {t('scheduling.emptyTitle')}
          </Text>
          <Text className="px-5 text-center text-sm text-muted-foreground">
            {t('scheduling.emptySubtitle')}
          </Text>
        </View>
      );
    }

    return (
      <>
        {nextReminder && (
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-muted-foreground">
              {t('scheduling.nextHeading')}
            </Text>
            {renderCard(nextReminder, true)}
          </View>
        )}
        <View className="mb-6">
          <Text className="mb-3 text-base font-semibold text-muted-foreground">
            {t('scheduling.upcomingHeading')}
          </Text>
          {notifications.map((record) =>
            renderCard(record, record.notificationId === nextReminder?.notificationId)
          )}
        </View>
      </>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('scheduling.title')} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
    () =>
      [...scheduledNotifications].sort((a, b) => a.scheduledTime - b.scheduledTime),
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
    const label =
      parsedData?.label ??
      typeLabels[record.notificationType as keyof typeof typeLabels] ??
      typeLabels.default;
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
    const minutesLeft = Math.max(
      Math.round((scheduledDate.getTime() - Date.now()) / 60000),
      0
    );

    return (
      <View
        key={record.notificationId}
        style={[styles.card, isNext && styles.nextCard]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardType}>
            {typeLabels[record.notificationType as keyof typeof typeLabels] ??
              typeLabels.default}
          </Text>
        </View>
        <Text style={styles.cardTime}>
          {t('scheduling.dueAt', { params: { date: dateString, time: timeString } })}
        </Text>
        <Text style={styles.cardRemaining}>
          {t('scheduling.minutesRemaining', { params: { minutes: minutesLeft } })}
        </Text>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            pendingId === record.notificationId && styles.cancelButtonDisabled,
          ]}
          onPress={() => handleCancel(record.notificationId)}
          disabled={pendingId === record.notificationId}
        >
          <Text style={styles.cancelButtonText}>{t('scheduling.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator style={styles.loader} />;
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={36} color="#B7B7C8" />
          </View>
          <Text style={styles.emptyTitle}>{t('scheduling.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('scheduling.emptySubtitle')}</Text>
        </View>
      );
    }

    return (
      <>
        {nextReminder && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t('scheduling.nextHeading')}</Text>
            {renderCard(nextReminder, true)}
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{t('scheduling.upcomingHeading')}</Text>
          {notifications.map((record) =>
            renderCard(record, record.notificationId === nextReminder?.notificationId)
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <TabPageHeader title={t('scheduling.title')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F2FF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D4F91',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nextCard: {
    borderColor: '#D6C3FF',
    shadowColor: '#7B5AB1',
    shadowOpacity: 0.12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
    marginRight: 12,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B6F9D',
  },
  cardTime: {
    fontSize: 14,
    color: '#4C3A6D',
  },
  cardRemaining: {
    fontSize: 13,
    color: '#7B6F9D',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F0E9FA',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#B8578B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE4FA',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});


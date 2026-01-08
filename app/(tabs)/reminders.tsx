import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Calendar, Sparkles } from 'lucide-react-native';

import { Badge } from '@/components/ui/badge';
import {
  ReminderDetailModal,
  type UnifiedReminder,
} from '../../pages/scheduling/components/ReminderDetailModal';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BABY_HABITS_QUERY_KEY, SCHEDULED_NOTIFICATIONS_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfileId } from '@/database/baby-profile';
import { getBabyHabitsWithReminders, type BabyHabitWithDefinition } from '@/database/habits';
import {
  getActiveScheduledNotifications,
  type ScheduledNotificationRecord,
} from '@/database/scheduled-notifications';
import { safeParseNotificationData } from '@/lib/json-parse';
import { useLocalization } from '@/localization/LocalizationProvider';
import { reminderTimeToDate } from '@/lib/date';

export default function SchedulingScreen() {
  const { t, locale } = useLocalization();
  const [babyId, setBabyId] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<'today' | 'upcoming'>('today');
  const [selectedReminder, setSelectedReminder] = useState<UnifiedReminder | null>(null);

  // Load baby ID
  useEffect(() => {
    const loadBabyId = async () => {
      const id = await getActiveBabyProfileId();
      setBabyId(id);
    };
    loadBabyId();
  }, []);

  // Fetch scheduled notifications
  const {
    data: scheduledNotifications = [],
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
    isRefetching: isRefetchingNotifications,
  } = useQuery<ScheduledNotificationRecord[]>({
    queryKey: SCHEDULED_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getActiveScheduledNotifications(),
    enabled: !!babyId,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch habit reminders
  const {
    data: habitReminders = [],
    isLoading: isLoadingHabits,
    refetch: refetchHabits,
    isRefetching: isRefetchingHabits,
  } = useQuery<BabyHabitWithDefinition[]>({
    queryKey: [BABY_HABITS_QUERY_KEY, babyId, 'reminders'],
    queryFn: () => (babyId ? getBabyHabitsWithReminders(babyId) : []),
    enabled: !!babyId,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  const isLoading = isLoadingNotifications || isLoadingHabits;
  const isRefetching = isRefetchingNotifications || isRefetchingHabits;

  const refetch = () => {
    refetchNotifications();
    refetchHabits();
  };

  const typeLabels = useMemo(
    () => ({
      feeding: t('scheduling.typeLabels.feeding'),
      pumping: t('scheduling.typeLabels.pumping'),
      sleep: t('scheduling.typeLabels.sleep'),
      diaper: t('scheduling.typeLabels.diaper'),
      habit: t('scheduling.typeLabels.habit', { defaultValue: 'Habit' }),
      default: t('scheduling.typeLabels.default'),
    }),
    [t]
  );

  // Type guard for type label keys
  function isTypeLabelKey(key: string): key is keyof typeof typeLabels {
    return (
      key === 'feeding' ||
      key === 'pumping' ||
      key === 'sleep' ||
      key === 'diaper' ||
      key === 'habit' ||
      key === 'default'
    );
  }

  // Merge and sort all reminders
  const allReminders = useMemo(() => {
    const unified: UnifiedReminder[] = [];

    // Add scheduled notifications
    scheduledNotifications.forEach((record) => {
      const parsedData = safeParseNotificationData(record.data);
      const notificationType: keyof typeof typeLabels = isTypeLabelKey(record.notificationType)
        ? record.notificationType
        : 'default';
      const label = parsedData?.label ?? typeLabels[notificationType];

      unified.push({
        id: `schedule-${record.notificationId}`,
        type: 'schedule',
        label,
        scheduledTime: new Date(record.scheduledTime * 1000),
        category: notificationType,
        source: record,
        notificationId: record.notificationId,
      });
    });

    // Add habit reminders (for today)
    habitReminders.forEach((habit) => {
      if (!habit.reminderTime) return;
      const reminderDate = reminderTimeToDate({
        reminderTime: habit.reminderTime,
        reminderDays: habit.reminderDays,
      });
      if (!reminderDate) return;

      unified.push({
        id: `habit-${habit.id}`,
        type: 'habit',
        label: t(habit.habit.labelKey, { defaultValue: habit.habit.id }),
        scheduledTime: reminderDate,
        category: 'habit',
        source: habit,
      });
    });

    // Sort by time
    return unified.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [scheduledNotifications, habitReminders, typeLabels, t]);

  // Filter based on segment
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (selectedSegment === 'today') {
      // Only show reminders scheduled for TODAY (between start and end of today)
      return allReminders.filter(
        (r) => r.scheduledTime >= startOfToday && r.scheduledTime <= endOfToday
      );
    }
    // All upcoming - show all reminders
    return allReminders;
  }, [allReminders, selectedSegment]);

  // Count for badges
  const todayCount = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return allReminders.filter(
      (r) => r.scheduledTime >= startOfToday && r.scheduledTime <= endOfToday
    ).length;
  }, [allReminders]);

  const allCount = allReminders.length;

  // Find next upcoming
  const nextReminder = useMemo(() => {
    const now = new Date();
    return filteredReminders.find((r) => r.scheduledTime > now);
  }, [filteredReminders]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Format time left in human-readable way
  const formatTimeLeft = (date: Date) => {
    const now = Date.now();
    const diff = date.getTime() - now;
    if (diff <= 0) return null;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return { text: `${days}d ${hours % 24}h`, short: true };
    }
    if (hours > 0) {
      return { text: `${hours}h ${minutes % 60}m`, short: false };
    }
    if (minutes > 30) {
      return { text: `${minutes}m`, short: false };
    }
    return { text: t('scheduling.soon', { defaultValue: 'Soon' }), short: true, urgent: true };
  };

  // Get day label relative to today
  const getDayLabel = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDay.getTime() === today.getTime()) {
      return t('scheduling.today', { defaultValue: 'Today' });
    }
    if (targetDay.getTime() === tomorrow.getTime()) {
      return t('scheduling.tomorrow', { defaultValue: 'Tomorrow' });
    }
    // Show day name for this week
    return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderReminderCard = (reminder: UnifiedReminder, isNext = false) => {
    const isPast = reminder.scheduledTime < new Date();
    const timeLeft = formatTimeLeft(reminder.scheduledTime);
    const dayLabel = getDayLabel(reminder.scheduledTime);
    const isToday = dayLabel === t('scheduling.today', { defaultValue: 'Today' });

    return (
      <Pressable
        key={reminder.id}
        className={`mb-3 overflow-hidden rounded-2xl border active:opacity-80 ${
          isNext
            ? 'border-accent/50 bg-accent/10'
            : isPast
              ? 'border-border/50 bg-muted/50'
              : 'border-border bg-card'
        }`}
        onPress={() => setSelectedReminder(reminder)}>
        {/* Day Label Bar - only show if not today or in "All" view */}
        {!isToday && (
          <View className="bg-muted/50 px-4 py-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {dayLabel}
            </Text>
          </View>
        )}

        <View className="p-4">
          {/* Time and Badge Row */}
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-xl font-bold ${
                  isNext ? 'text-accent' : isPast ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                {formatTime(reminder.scheduledTime)}
              </Text>
              {/* Time left badge */}
              {timeLeft && !isPast && (
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    timeLeft.urgent ? 'bg-orange-500' : 'bg-muted'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      timeLeft.urgent ? 'text-white' : 'text-muted-foreground'
                    }`}>
                    {timeLeft.text}
                  </Text>
                </View>
              )}
            </View>
            <Badge
              variant={reminder.type === 'habit' ? 'default' : 'secondary'}
              className={reminder.type === 'habit' ? 'bg-purple-500' : ''}>
              <Text className={reminder.type === 'habit' ? 'text-white' : ''}>
                {reminder.type === 'habit'
                  ? typeLabels.habit
                  : isTypeLabelKey(reminder.category)
                    ? typeLabels[reminder.category]
                    : typeLabels.default}
              </Text>
            </Badge>
          </View>

          {/* Label */}
          <Text
            className={`text-base font-semibold ${
              isPast ? 'text-muted-foreground' : 'text-foreground'
            }`}>
            {reminder.label}
          </Text>

          {/* Past indicator */}
          {isPast && (
            <Text className="mt-1 text-sm text-muted-foreground">
              {t('scheduling.past', { defaultValue: 'Past' })}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderNowIndicator = () => {
    const now = new Date();
    return (
      <View className="my-3 flex-row items-center">
        <View className="h-3 w-3 rounded-full bg-accent" />
        <View className="ml-2 h-0.5 flex-1 bg-accent/30" />
        <Text className="ml-2 text-sm font-medium text-accent">
          {t('scheduling.now', { defaultValue: 'NOW' })} • {formatTime(now)}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator className="mt-10" />;
    }

    if (filteredReminders.length === 0) {
      return (
        <View className="items-center py-16">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
            <Calendar size={36} color="#B7B7C8" />
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

    // Split reminders into past and upcoming
    const now = new Date();
    const pastReminders = filteredReminders.filter((r) => r.scheduledTime <= now);
    const upcomingReminders = filteredReminders.filter((r) => r.scheduledTime > now);

    return (
      <>
        {/* Past reminders (dimmed) */}
        {pastReminders.length > 0 && (
          <View className="mb-4">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">
              {t('scheduling.pastHeading', { defaultValue: 'Earlier' })}
            </Text>
            {pastReminders.map((reminder) => renderReminderCard(reminder, false))}
          </View>
        )}

        {/* NOW indicator */}
        {upcomingReminders.length > 0 && renderNowIndicator()}

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <View className="mb-6">
            {nextReminder && (
              <View className="mb-3 flex-row items-center gap-2">
                <Sparkles size={16} color="#EC4899" />
                <Text className="text-sm font-semibold text-accent">
                  {t('scheduling.nextUp', { defaultValue: 'Next Up' })}
                </Text>
              </View>
            )}
            {upcomingReminders.map((reminder) =>
              renderReminderCard(reminder, reminder.id === nextReminder?.id)
            )}
          </View>
        )}
      </>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Segment Selector - easy one-handed access */}
      <View className="border-b border-border px-5 py-3">
        <ToggleGroup
          value={selectedSegment}
          onValueChange={(value) => {
            if (value === 'today' || value === 'upcoming') {
              setSelectedSegment(value);
            }
          }}
          type="single"
          variant="outline"
          className="w-full">
          <ToggleGroupItem value="today" isFirst className="flex-1">
            <Text className="flex-row items-center justify-center gap-2">
              {t('scheduling.today', { defaultValue: 'Today' })}
              <View className="ml-1 min-w-[20px] items-center rounded-full bg-foreground/10 px-1.5 py-0.5">
                <Text className="text-xs font-bold">{todayCount}</Text>
              </View>
            </Text>
          </ToggleGroupItem>
          <ToggleGroupItem value="upcoming" isLast className="flex-1">
            <Text className="flex-row items-center justify-center gap-2">
              {t('scheduling.allUpcoming', { defaultValue: 'All' })}
              <View className="ml-1 min-w-[20px] items-center rounded-full bg-foreground/10 px-1.5 py-0.5">
                <Text className="text-xs font-bold">{allCount}</Text>
              </View>
            </Text>
          </ToggleGroupItem>
        </ToggleGroup>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        {renderContent()}
      </ScrollView>

      {/* Detail Modal */}
      <ReminderDetailModal reminder={selectedReminder} onClose={() => setSelectedReminder(null)} />
    </View>
  );
}

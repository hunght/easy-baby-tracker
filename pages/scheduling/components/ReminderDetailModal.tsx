import { useRouter } from 'expo-router';
import { Clock, ExternalLink, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { type BabyHabitWithDefinition } from '@/database/habits';
import { type ScheduledNotificationDoc } from '@/database/scheduled-notifications';
import { cancelScheduledNotification } from '@/lib/notification-scheduler';
import { useLocalization } from '@/localization/LocalizationProvider';

// Unified reminder type - same as in scheduling.tsx
export type UnifiedReminder = {
  id: string;
  type: 'schedule' | 'habit';
  label: string;
  scheduledTime: Date;
  category: string;
  source: ScheduledNotificationDoc | BabyHabitWithDefinition;
  notificationId?: string;
};

type ReminderDetailModalProps = {
  reminder: UnifiedReminder | null;
  onClose: () => void;
};

export function ReminderDetailModal({ reminder, onClose }: ReminderDetailModalProps) {
  const { t, locale } = useLocalization();
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
    return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const typeLabels = {
    feeding: t('scheduling.typeLabels.feeding'),
    pumping: t('scheduling.typeLabels.pumping'),
    sleep: t('scheduling.typeLabels.sleep'),
    diaper: t('scheduling.typeLabels.diaper'),
    habit: t('scheduling.typeLabels.habit', { defaultValue: 'Habit' }),
    default: t('scheduling.typeLabels.default'),
  };

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

  // Type guard for habit source
  function isHabitSource(
    source: ScheduledNotificationDoc | BabyHabitWithDefinition
  ): source is BabyHabitWithDefinition {
    return 'definition' in source;
  }

  const handleEdit = () => {
    onClose();
    if (reminder?.type === 'habit' && isHabitSource(reminder.source) && reminder.source.definition) {
      router.push({
        pathname: '/(habit)/habit-detail',
        params: {
          id: reminder.source.definition.definitionId,
          labelKey: reminder.source.definition.labelKey,
          descriptionKey: reminder.source.definition.descriptionKey,
          category: reminder.source.definition.category,
          minAge: reminder.source.definition.minAgeMonths?.toString() ?? '0',
          maxAge: reminder.source.definition.maxAgeMonths?.toString() ?? '',
        },
      });
    } else {
      router.push('/(easy-schedule)/easy-schedule-settings');
    }
  };

  const handleCancelReminder = async () => {
    if (!reminder?.notificationId) return;
    setIsCanceling(true);
    try {
      await cancelScheduledNotification(reminder.notificationId);
      Alert.alert(t('scheduling.cancelSuccessTitle'), t('scheduling.cancelSuccessMessage'));
      onClose();
    } catch {
      Alert.alert(t('scheduling.cancelErrorTitle'), t('scheduling.cancelErrorMessage'));
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Modal visible={!!reminder} animationType="slide" transparent={true} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-background p-5 pb-10">
          {reminder && (
            <>
              {/* Header */}
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-foreground">
                  {t('scheduling.reminderDetails', { defaultValue: 'Reminder Details' })}
                </Text>
                <Pressable
                  onPress={onClose}
                  className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <X size={20} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Time & Day */}
              <View className="mb-4 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <Clock size={24} color="#EC4899" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-foreground">
                      {formatTime(reminder.scheduledTime)}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {getDayLabel(reminder.scheduledTime)}
                    </Text>
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
              </View>

              {/* Label/Name */}
              <View className="mb-4 rounded-2xl border border-border bg-card p-4">
                <Text className="mb-1 text-sm font-medium text-muted-foreground">
                  {t('scheduling.reminderName', { defaultValue: 'Name' })}
                </Text>
                <Text className="text-lg font-semibold text-foreground">{reminder.label}</Text>
              </View>

              {/* Type-specific info */}
              {reminder.type === 'habit' && (
                <View className="mb-4 rounded-2xl border border-border bg-card p-4">
                  <Text className="mb-1 text-sm font-medium text-muted-foreground">
                    {t('scheduling.habitCategory', { defaultValue: 'Category' })}
                  </Text>
                  <Text className="text-base text-foreground">
                    {isHabitSource(reminder.source) && reminder.source.definition
                      ? t(`habit.category.${reminder.source.definition.category}`, {
                          defaultValue: reminder.source.definition.category,
                        })
                      : ''}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="mt-2 gap-3">
                {/* Edit Button */}
                <Button
                  className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
                  onPress={handleEdit}>
                  <ExternalLink size={20} color="#FFF" />
                  <Text className="text-base font-semibold text-white">
                    {reminder.type === 'habit'
                      ? t('scheduling.editHabit', { defaultValue: 'Edit Habit' })
                      : t('scheduling.editSchedule', { defaultValue: 'Edit Schedule' })}
                  </Text>
                </Button>

                {/* Cancel Reminder - only for schedule type */}
                {reminder.type === 'schedule' && reminder.notificationId && (
                  <Button
                    variant="outline"
                    className="h-14 flex-row items-center justify-center gap-2 rounded-2xl border-destructive"
                    onPress={handleCancelReminder}
                    disabled={isCanceling}>
                    <Text className="text-base font-semibold text-destructive">
                      {isCanceling
                        ? t('common.loading', { defaultValue: 'Loading...' })
                        : t('scheduling.cancelReminder', { defaultValue: 'Cancel Reminder' })}
                    </Text>
                  </Button>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

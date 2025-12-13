import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useState, useEffect, useMemo } from 'react';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
import { getAppState, setAppState } from '@/database/app-state';
import {
  getScheduledNotifications,
  deleteScheduledNotificationByNotificationId,
} from '@/database/scheduled-notifications';
import { getFormulaRuleByDate, deleteDaySpecificRule } from '@/database/easy-formula-rules';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useNotification } from '@/components/NotificationContext';
import {
  requestNotificationPermissions,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { cancelScheduledNotificationAsync } from '@/lib/notifications-wrapper';

const EASY_REMINDER_ENABLED_KEY = 'easyScheduleReminderEnabled';
const EASY_REMINDER_ADVANCE_MINUTES_KEY = 'easyScheduleReminderAdvanceMinutes';

export default function EasyScheduleSettingsScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [firstWakeTime, setFirstWakeTime] = useState('07:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderAdvanceMinutes, setReminderAdvanceMinutes] = useState(5);

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Get today's date
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Check if there's a day-specific rule for today
  const { data: todayCustomRule } = useQuery({
    queryKey: ['formulaRule', 'date', babyProfile?.id, today],
    queryFn: () => getFormulaRuleByDate(babyProfile!.id, today),
    enabled: !!babyProfile?.id,
    staleTime: 30 * 1000,
  });

  const hasCustomRuleToday = !!todayCustomRule;

  // Mutation to reset custom rule for today
  const resetCustomRuleMutation = useMutation({
    mutationFn: async () => {
      if (!babyProfile?.id) {
        throw new Error('Baby profile not found');
      }
      await deleteDaySpecificRule(babyProfile.id, today);

      // Reschedule reminders if enabled
      const reminderEnabledValue = await getAppState(EASY_REMINDER_ENABLED_KEY);
      if (reminderEnabledValue === 'true') {
        const advanceMinutesValue = await getAppState(EASY_REMINDER_ADVANCE_MINUTES_KEY);
        const advanceMinutes = advanceMinutesValue ? parseInt(advanceMinutesValue, 10) : 5;

        const labels: EasyScheduleReminderLabels = {
          eat: t('easySchedule.activityLabels.eat'),
          activity: t('easySchedule.activityLabels.activity'),
          sleep: (napNumber: number) =>
            t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
          yourTime: t('easySchedule.activityLabels.yourTime'),
          reminderTitle: (params) =>
            t('easySchedule.reminder.title', {
              params: { emoji: params.emoji, activity: params.activity },
            }),
          reminderBody: (params) =>
            t('easySchedule.reminder.body', {
              params: {
                activity: params.activity,
                time: params.time,
                advance: params.advance,
              },
            }),
        };

        await rescheduleEasyReminders(babyProfile, firstWakeTime, advanceMinutes, labels);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({
        queryKey: ['formulaRule', 'date', babyProfile?.id, today],
      });
      queryClient.invalidateQueries({
        queryKey: ['timeAdjustments', babyProfile?.id, today],
      });
      showNotification(t('easySchedule.settings.customRuleReset'), 'success');
    },
    onError: (error) => {
      console.error('Failed to reset custom rule:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleResetCustomRule = () => {
    Alert.alert(
      t('easySchedule.settings.resetCustomRuleTitle'),
      t('easySchedule.settings.resetCustomRuleMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => resetCustomRuleMutation.mutate(),
        },
      ]
    );
  };

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (babyProfile?.firstWakeTime) {
        setFirstWakeTime(babyProfile.firstWakeTime);
      }

      // Load reminder settings from app state
      const reminderEnabledValue = await getAppState(EASY_REMINDER_ENABLED_KEY);
      if (reminderEnabledValue === 'true') {
        setReminderEnabled(true);
      }

      const advanceMinutesValue = await getAppState(EASY_REMINDER_ADVANCE_MINUTES_KEY);
      if (advanceMinutesValue) {
        const minutes = parseInt(advanceMinutesValue, 10);
        if (!isNaN(minutes) && minutes > 0) {
          setReminderAdvanceMinutes(minutes);
        }
      }
    };

    void loadSettings();
  }, [babyProfile]);

  const openTimePicker = () => {
    const [hours, minutes] = firstWakeTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setShowTimePicker(true);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      setFirstWakeTime(newTime);
    }
  };

  const handleSave = async () => {
    try {
      // Save wake time
      if (babyProfile?.id && firstWakeTime !== babyProfile.firstWakeTime) {
        await updateBabyFirstWakeTime(babyProfile.id, firstWakeTime);
        queryClient.setQueryData<typeof babyProfile>(BABY_PROFILE_QUERY_KEY, (previous) =>
          previous ? { ...previous, firstWakeTime } : previous
        );
      }

      // Save reminder settings
      await setAppState(EASY_REMINDER_ENABLED_KEY, reminderEnabled ? 'true' : 'false');
      await setAppState(EASY_REMINDER_ADVANCE_MINUTES_KEY, String(reminderAdvanceMinutes));

      // Handle reminders
      if (reminderEnabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            t('easySchedule.reminder.permissionDeniedTitle'),
            t('easySchedule.reminder.permissionDeniedBody')
          );
          return;
        }

        // Schedule reminders for upcoming EASY events
        if (!babyProfile) {
          console.error('Cannot schedule reminders: no baby profile');
          return;
        }

        const labels: EasyScheduleReminderLabels = {
          eat: t('easySchedule.activityLabels.eat'),
          activity: t('easySchedule.activityLabels.activity'),
          sleep: (napNumber: number) =>
            t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
          yourTime: t('easySchedule.activityLabels.yourTime'),
          reminderTitle: (params) =>
            t('easySchedule.reminder.title', {
              params: { emoji: params.emoji, activity: params.activity },
            }),
          reminderBody: (params) =>
            t('easySchedule.reminder.body', {
              params: {
                activity: params.activity,
                time: params.time,
                advance: params.advance,
              },
            }),
        };

        await rescheduleEasyReminders(babyProfile, firstWakeTime, reminderAdvanceMinutes, labels);
      } else {
        // Cancel all EASY reminders if disabled
        const existingNotifications = await getScheduledNotifications({
          notificationType: 'sleep',
        });
        for (const notification of existingNotifications) {
          try {
            const data = notification.data ? JSON.parse(notification.data) : null;
            // Check if it's an EASY schedule reminder (has activityType in data)
            if (data && data.activityType) {
              await cancelScheduledNotificationAsync(notification.notificationId);
              await deleteScheduledNotificationByNotificationId(notification.notificationId);
            }
          } catch (error) {
            console.error('Error canceling notification:', error);
          }
        }
      }

      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification(t('common.saveError'), 'error');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-2">
        <Button variant="link" size="sm" className="-ml-2 px-2" onPress={() => router.back()}>
          <Text className="text-base font-semibold text-foreground">{t('common.close')}</Text>
        </Button>
        <Text className="text-lg font-bold text-foreground">
          {t('easySchedule.settings.title')}
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerClassName="p-5 gap-6" showsVerticalScrollIndicator={false}>
        {/* Wake Time Section */}
        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">
            {t('easySchedule.settings.wakeTime')}
          </Text>
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">
                {t('easySchedule.firstWakeTimeTitle')}
              </Text>
              <Text className="mt-1 text-lg font-semibold text-foreground">{firstWakeTime}</Text>
            </View>
            <Button variant="outline" size="sm" onPress={openTimePicker}>
              <Text>{t('easySchedule.changeTime')}</Text>
            </Button>
          </View>

          {showTimePicker && (
            <View className="rounded-lg border border-border bg-card p-4">
              <Text className="mb-2 text-center text-sm font-semibold text-foreground">
                {t('easySchedule.firstWakeTimeTitle')}
              </Text>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
              />
            </View>
          )}
        </View>

        {/* Custom Rule Reset Section */}
        {hasCustomRuleToday && (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">
              {t('easySchedule.settings.customSchedule')}
            </Text>
            <View className="rounded-lg border border-border bg-card p-4">
              <View className="mb-3">
                <Text className="text-sm font-medium text-foreground">
                  {t('easySchedule.settings.customRuleActive')}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {t('easySchedule.settings.customRuleDescription')}
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={handleResetCustomRule}
                disabled={resetCustomRuleMutation.isPending}>
                <Text>{t('easySchedule.settings.resetToOriginal')}</Text>
              </Button>
            </View>
          </View>
        )}

        {/* Reminder Settings Section */}
        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">
            {t('easySchedule.settings.reminders')}
          </Text>
          <View className="rounded-lg border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  {t('easySchedule.settings.enableReminders')}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {t('easySchedule.settings.enableRemindersDescription')}
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#767577', true: '#C7B9FF' }}
                thumbColor={reminderEnabled ? '#5B7FFF' : '#f4f3f4'}
              />
            </View>

            {reminderEnabled && (
              <View className="mt-4 gap-2">
                <Text className="text-sm font-medium text-foreground">
                  {t('easySchedule.settings.reminderAdvance')}
                </Text>
                <View className="flex-row gap-2">
                  {[5, 10, 15, 30].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={reminderAdvanceMinutes === minutes ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onPress={() => setReminderAdvanceMinutes(minutes)}>
                      <Text>{minutes}m</Text>
                    </Button>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Save Button */}
        <Button onPress={handleSave} className="mt-4">
          <Text>{t('common.save')}</Text>
        </Button>
      </ScrollView>
    </View>
  );
}

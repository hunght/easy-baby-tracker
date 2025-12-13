import { useQuery, useQueryClient } from '@tanstack/react-query';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
import { getAppState, setAppState } from '@/database/app-state';
import {
  getScheduledNotifications,
  deleteScheduledNotificationByNotificationId,
} from '@/database/scheduled-notifications';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useNotification } from '@/components/NotificationContext';
import {
  requestNotificationPermissions,
  scheduleEasyScheduleReminder,
} from '@/lib/notification-scheduler';
import {
  generateEasySchedule,
  getEasyFormulaRuleByAge,
  getEasyFormulaRuleById,
  EASY_FORMULA_RULES,
  type EasyFormulaRuleId,
  type EasyScheduleItem,
} from '@/lib/easy-schedule-generator';
import { cancelScheduledNotificationAsync } from '@/lib/notifications-wrapper';

const EASY_REMINDER_ENABLED_KEY = 'easyScheduleReminderEnabled';
const EASY_REMINDER_ADVANCE_MINUTES_KEY = 'easyScheduleReminderAdvanceMinutes';

function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
}

function timeStringToDate(time: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (date.getTime() <= baseDate.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

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
        await scheduleEasyReminders();
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

  const scheduleEasyReminders = async () => {
    if (!babyProfile) {
      console.error('Cannot schedule reminders: no baby profile');
      return;
    }

    // Cancel existing EASY schedule reminders
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
        console.error('Error canceling existing notification:', error);
      }
    }

    // Generate the EASY schedule
    const ageWeeks = babyProfile.birthDate ? calculateAgeInWeeks(babyProfile.birthDate) : undefined;
    const availableRuleIds = EASY_FORMULA_RULES.map((rule) => rule.id);
    const storedFormulaId = babyProfile.selectedEasyFormulaId;
    let validStoredId: EasyFormulaRuleId | undefined = undefined;
    if (storedFormulaId && availableRuleIds.some((id) => id === storedFormulaId)) {
      validStoredId = storedFormulaId as EasyFormulaRuleId;
    }

    const formulaRule = validStoredId
      ? getEasyFormulaRuleById(validStoredId)
      : getEasyFormulaRuleByAge(ageWeeks);

    const labels = {
      eat: t('easySchedule.activityLabels.eat'),
      activity: t('easySchedule.activityLabels.activity'),
      sleep: (napNumber: number) =>
        t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
      yourTime: t('easySchedule.activityLabels.yourTime'),
    };

    const scheduleItems: EasyScheduleItem[] = generateEasySchedule(firstWakeTime, {
      labels,
      ageWeeks,
      ruleId: formulaRule.id,
    });

    // Filter out 'Y' activities and schedule reminders for E, A, S
    const activitiesToRemind = scheduleItems.filter((item) => item.activityType !== 'Y');

    const now = new Date();
    let scheduledCount = 0;

    // Schedule reminders for the next 48 hours (2 days) of activities
    for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setHours(0, 0, 0, 0);

      for (const item of activitiesToRemind) {
        const activityStartDate = timeStringToDate(item.startTime, baseDate);
        const reminderDate = new Date(
          activityStartDate.getTime() - reminderAdvanceMinutes * 60 * 1000
        );

        // Only schedule if reminder time is in the future
        if (reminderDate.getTime() > now.getTime()) {
          // Get activity label
          let activityLabel = item.label;
          if (item.activityType === 'S') {
            // Extract nap number from sleep label if possible
            const napMatch = activityLabel.match(/\d+/);
            const napNumber = napMatch ? parseInt(napMatch[0], 10) : 1;
            activityLabel = labels.sleep(napNumber);
          }

          // Create notification title and body
          const activityEmojis: Record<string, string> = {
            E: '🍼',
            A: '🧸',
            S: '😴',
          };
          const emoji = activityEmojis[item.activityType] || '📅';
          const notificationTitle = t('easySchedule.reminder.title', {
            params: { emoji, activity: activityLabel },
          });
          const notificationBody = t('easySchedule.reminder.body', {
            params: {
              activity: activityLabel,
              time: item.startTime,
              advance: reminderAdvanceMinutes,
            },
          });

          try {
            const notificationId = await scheduleEasyScheduleReminder({
              targetDate: reminderDate,
              activityType: item.activityType,
              label: activityLabel,
              notificationTitle,
              notificationBody,
            });

            if (notificationId) {
              scheduledCount++;
            }
          } catch (error) {
            console.error(`Failed to schedule reminder for ${item.startTime}:`, error);
          }
        }
      }
    }

    console.log(`Scheduled ${scheduledCount} EASY reminders`);
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

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
import { useLocalization } from '@/localization/LocalizationProvider';
import { useNotification } from '@/components/NotificationContext';
import { requestNotificationPermissions } from '@/lib/notification-scheduler';

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

      // If reminders are enabled, schedule them
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
      }

      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification(t('common.saveError'), 'error');
    }
  };

  const scheduleEasyReminders = async () => {
    // This will be implemented to schedule reminders for all upcoming EASY events
    // For now, we'll just show a success message
    // TODO: Implement full reminder scheduling logic
    console.log('Scheduling EASY reminders with', reminderAdvanceMinutes, 'minutes advance');
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

import { getLocales } from 'expo-localization';

import { supabase, requireCurrentUserId } from '@/lib/supabase';
import { safeParseEasyScheduleNotificationData } from '@/lib/json-parse';
import {
  getScheduledNotifications,
  deleteScheduledNotificationByNotificationId,
} from './scheduled-notifications';
import { cancelScheduledNotificationAsync } from '@/lib/notifications-wrapper';
import { getActiveBabyProfile } from '@/database/baby-profile';
import {
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { translationObject } from '@/localization/translations';

const EASY_REMINDER_ENABLED_KEY = 'easyScheduleReminderEnabled';

export async function getAppState(key: string): Promise<string | null> {
  try {
    const userId = await requireCurrentUserId();

    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

export async function setAppState(key: string, value: string): Promise<void> {
  const userId = await requireCurrentUserId();

  const { error } = await supabase.from('app_state').upsert(
    {
      user_id: userId,
      key,
      value,
    },
    { onConflict: 'user_id,key' }
  );

  if (error) throw error;
}

export async function getEasyReminderState(): Promise<boolean> {
  const value = await getAppState(EASY_REMINDER_ENABLED_KEY);
  return value === 'true';
}

/**
 * Restore and reschedule EASY schedule reminders on app startup.
 */
async function restoreEasyScheduleReminders(): Promise<void> {
  console.log('[restoreEasyScheduleReminders] Starting');
  try {
    const reminderEnabledValue = await getAppState('easyScheduleReminderEnabled');
    const reminderEnabled = reminderEnabledValue === 'true';
    console.log('[restoreEasyScheduleReminders] Reminder enabled:', reminderEnabled);

    if (!reminderEnabled) {
      console.log('[restoreEasyScheduleReminders] Reminders disabled, exiting');
      return;
    }

    const babyProfile = await getActiveBabyProfile();
    console.log(
      '[restoreEasyScheduleReminders] Baby profile:',
      babyProfile ? `found (id: ${babyProfile.id})` : 'not found'
    );

    if (!babyProfile) {
      console.log('[restoreEasyScheduleReminders] No baby profile, exiting');
      return;
    }

    const advanceMinutesValue = await getAppState('easyScheduleReminderAdvanceMinutes');
    const reminderAdvanceMinutes = advanceMinutesValue ? parseInt(advanceMinutesValue, 10) : 5;
    const firstWakeTime = babyProfile.firstWakeTime || '07:00';

    const locales = getLocales();
    const detectedLocale = locales[0]?.languageCode?.toLowerCase() || 'en';
    const locale: 'en' | 'vi' = detectedLocale === 'vi' ? 'vi' : 'en';
    const translations = translationObject[locale] || translationObject.en;

    function isRecord(value: unknown): value is Record<string, unknown> {
      return value !== null && typeof value === 'object';
    }

    const t = (key: string, options?: { params?: Record<string, string | number> }) => {
      const keys = key.split('.');
      let value: unknown = translations;
      for (const k of keys) {
        if (isRecord(value) && k in value) {
          value = value[k];
        } else {
          value = translationObject.en;
          for (const k2 of keys) {
            if (isRecord(value) && k2 in value) {
              value = value[k2];
            } else {
              return key;
            }
          }
          break;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (options?.params) {
        return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => {
          const paramValue = options.params?.[token];
          return paramValue !== undefined && paramValue !== null ? String(paramValue) : '';
        });
      }

      return value;
    };

    const labels: EasyScheduleReminderLabels = {
      eat: t('easySchedule.activityLabels.eat'),
      activity: t('easySchedule.activityLabels.activity'),
      sleep: (napNumber: number) =>
        t('easySchedule.activityLabels.sleep', { params: { number: napNumber } }),
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
  } catch (error) {
    console.error('Failed to restore EASY schedule reminders:', error);
  }
}

export async function setEasyReminderState(enabled: boolean): Promise<void> {
  await setAppState(EASY_REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');

  try {
    if (enabled) {
      await restoreEasyScheduleReminders();
    } else {
      const existingNotifications = await getScheduledNotifications({
        notificationType: 'sleep',
      });
      for (const notification of existingNotifications) {
        const data = safeParseEasyScheduleNotificationData(notification.data);
        if (data && data.activityType) {
          try {
            await cancelScheduledNotificationAsync(notification.notificationId);
            await deleteScheduledNotificationByNotificationId(notification.notificationId);
          } catch (error) {
            console.error('Error canceling notification:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to handle EASY reminder state change:', error);
  }
}

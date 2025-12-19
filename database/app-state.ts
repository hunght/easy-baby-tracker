import { eq } from 'drizzle-orm';
import { getLocales } from 'expo-localization';

import { db } from '@/database/db';
import * as schema from '@/db/schema';

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
  const result = await db
    .select({ value: schema.appState.value })
    .from(schema.appState)
    .where(eq(schema.appState.key, key))
    .limit(1);

  return result[0]?.value ?? null;
}

export async function setAppState(key: string, value: string): Promise<void> {
  await db.insert(schema.appState).values({ key, value }).onConflictDoUpdate({
    target: schema.appState.key,
    set: { value },
  });
}

export async function getEasyReminderState(): Promise<boolean> {
  const value = await getAppState(EASY_REMINDER_ENABLED_KEY);
  return value === 'true';
}

/**
 * Restore and reschedule EASY schedule reminders on app startup.
 * This ensures reminders are always scheduled for the configured number of days ahead.
 * Should be called after app initialization and migrations are complete.
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

    // Get reminder settings
    const advanceMinutesValue = await getAppState('easyScheduleReminderAdvanceMinutes');
    const reminderAdvanceMinutes = advanceMinutesValue ? parseInt(advanceMinutesValue, 10) : 5;
    const firstWakeTime = babyProfile.firstWakeTime || '07:00';

    // Get current locale for translations
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
          // Fallback to English
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

    // Build labels
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

    // Reschedule reminders
    await rescheduleEasyReminders(babyProfile, firstWakeTime, reminderAdvanceMinutes, labels);
  } catch (error) {
    console.error('Failed to restore EASY schedule reminders:', error);
    // Don't throw - this is a background operation that shouldn't block app startup
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
    // Don't throw - this is a background operation that shouldn't block the state update
  }
}

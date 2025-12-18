import {
  deleteScheduledNotificationByNotificationId,
  getActiveScheduledNotifications,
  getScheduledNotifications,
  saveScheduledNotification,
  type ScheduledNotificationPayload,
} from '@/database/scheduled-notifications';
import {
  requestNotificationPermissions,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  type NotificationRequest,
} from '@/lib/notifications-wrapper';

import {
  EasyScheduleActivityType,
  generateEasySchedule,
  type EasyScheduleItem,
} from '@/lib/easy-schedule-generator';
import { safeParseNotificationData, safeParseEasyScheduleNotificationData } from '@/lib/json-parse';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getFormulaRuleById } from '@/database/easy-formula-rules';

interface ScheduledFeedingNotification {
  notificationId: string;
  scheduledTime: string; // ISO string
  feedingType: 'breast' | 'bottle' | 'solids';
}

// Re-export requestNotificationPermissions from wrapper
export { requestNotificationPermissions };

// Helper to convert ScheduledFeedingNotification to database record
function convertToDbRecord(
  notificationId: string,
  scheduledTime: Date,
  feedingType: 'breast' | 'bottle' | 'solids'
): ScheduledNotificationPayload {
  return {
    notificationType: 'feeding',
    notificationId,
    scheduledTime: Math.floor(scheduledTime.getTime() / 1000),
    data: JSON.stringify({ feedingType }),
  };
}

// Helper to convert database record to ScheduledFeedingNotification
function convertFromDbRecord(record: {
  notificationId: string;
  scheduledTime: number;
  data: string | null;
}): ScheduledFeedingNotification | null {
  if (!record.data) {
    return null;
  }
  const parsed = safeParseNotificationData(record.data);
  if (!parsed || !parsed.feedingType) {
    return null;
  }
  return {
    notificationId: record.notificationId,
    scheduledTime: new Date(record.scheduledTime * 1000).toISOString(),
    feedingType: parsed.feedingType,
  };
}

// Schedule a feeding notification
export async function scheduleFeedingNotification(
  scheduledTime: Date,
  feedingType: 'breast' | 'bottle' | 'solids',
  notificationId?: string
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  // Cancel existing notification if updating
  if (notificationId) {
    await cancelScheduledNotificationAsync(notificationId);
  }

  // Calculate trigger time (seconds from now)
  const now = new Date();
  const triggerTime = scheduledTime.getTime() - now.getTime();

  // Only schedule if the time is in the future
  if (triggerTime <= 0) {
    return null;
  }

  // Get feeding type label
  const feedingTypeLabels = {
    breast: 'Breast feeding',
    bottle: 'Bottle feeding',
    solids: 'Solids feeding',
  };

  const notificationIdResult = await scheduleNotificationAsync({
    content: {
      title: 'Time to feed! 🍼',
      body: `It's time for ${feedingTypeLabels[feedingType]}`,
      sound: true,
      data: {
        type: 'feeding',
        feedingType,
        scheduledTime: scheduledTime.toISOString(),
      },
    },
    trigger: {
      type: 'timeInterval',
      seconds: Math.floor(triggerTime / 1000),
    },
  });

  // Store notification info in database for persistence
  if (notificationIdResult) {
    // Delete any existing feeding notification for this baby first
    const existing = await getActiveScheduledNotifications();
    const existingFeeding = existing.find((n) => n.notificationType === 'feeding');
    if (existingFeeding) {
      await deleteScheduledNotificationByNotificationId(existingFeeding.notificationId);
    }

    // Save the new notification
    await saveScheduledNotification(
      convertToDbRecord(notificationIdResult, scheduledTime, feedingType)
    );
  }

  return notificationIdResult;
}

async function scheduleEasyScheduleReminder(options: {
  targetDate: Date;
  activityType: EasyScheduleActivityType;
  label: string;
  notificationTitle: string;
  notificationBody: string;
}): Promise<string | null> {
  const now = new Date();
  const diffMs = options.targetDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return null;
  }

  const notificationId = await scheduleNotificationAsync({
    content: {
      title: options.notificationTitle,
      body: options.notificationBody,
      sound: true,
      data: {
        type: 'easySchedule',
        activityType: options.activityType,
        targetTime: options.targetDate.toISOString(),
      },
    },
    trigger: {
      type: 'timeInterval',
      seconds: Math.floor(diffMs / 1000),
    },
  });

  await saveScheduledNotification({
    notificationType: 'sleep',
    notificationId,
    scheduledTime: Math.floor(options.targetDate.getTime() / 1000),
    data: JSON.stringify({
      activityType: options.activityType,
      label: options.label,
    }),
  });

  return notificationId;
}

// Cancel a scheduled notification
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await cancelScheduledNotificationAsync(notificationId);
  await deleteScheduledNotificationByNotificationId(notificationId);
}

// Cancel scheduled notification by stored ID
export async function cancelStoredScheduledNotification(): Promise<void> {
  const active = await getActiveScheduledNotifications();
  const feedingNotification = active.find((n) => n.notificationType === 'feeding');
  if (feedingNotification) {
    await cancelScheduledNotificationAsync(feedingNotification.notificationId);
    await deleteScheduledNotificationByNotificationId(feedingNotification.notificationId);
  }
}

// Restore and validate scheduled notifications on app startup
// This ensures notifications persist even after app termination
export async function restoreScheduledNotifications(): Promise<ScheduledFeedingNotification | null> {
  // getActiveScheduledNotifications now handles the case where there's no active profile
  const active = await getActiveScheduledNotifications();
  const feedingNotification = active.find((n) => n.notificationType === 'feeding');

  if (!feedingNotification) {
    return null;
  }

  // Check if the notification still exists in the OS
  const allScheduled = await getAllScheduledNotificationsAsync();
  const notificationExists = allScheduled.some(
    (n: NotificationRequest) => n.identifier === feedingNotification.notificationId
  );

  if (!notificationExists) {
    // Notification was already fired or cancelled, clean up database
    await deleteScheduledNotificationByNotificationId(feedingNotification.notificationId);
    return null;
  }

  // Check if the scheduled time is still in the future
  const scheduledTime = new Date(feedingNotification.scheduledTime * 1000);
  const now = new Date();
  if (scheduledTime <= now) {
    // Notification time has passed, clean up
    await cancelScheduledNotification(feedingNotification.notificationId);
    return null;
  }

  // Convert database record to ScheduledFeedingNotification
  return convertFromDbRecord(feedingNotification);
}

// Helper function to convert time string to date
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

// Configuration constant for number of days ahead to schedule EASY reminders
const EASY_REMINDER_DAYS_AHEAD = 2;

export interface EasyScheduleReminderLabels {
  eat: string;
  activity: string;
  sleep: (napNumber: number) => string;
  yourTime: string;
  reminderTitle: (params: { emoji: string; activity: string }) => string;
  reminderBody: (params: { activity: string; time: string; advance: number }) => string;
}

/**
 * Reschedule EASY schedule reminders based on current baby profile and settings.
 * Cancels existing reminders and schedules new ones for the specified number of days ahead.
 *
 * @param babyProfile - The baby profile with formula and birth date
 * @param firstWakeTime - First wake time in HH:mm format
 * @param reminderAdvanceMinutes - Minutes before activity to send reminder
 * @param labels - Localized labels for activities and notifications
 * @param daysAhead - Number of days ahead to schedule reminders (default: EASY_REMINDER_DAYS_AHEAD)
 * @returns Number of reminders scheduled
 */
export async function rescheduleEasyReminders(
  babyProfile: BabyProfileRecord,
  firstWakeTime: string,
  reminderAdvanceMinutes: number,
  labels: EasyScheduleReminderLabels,
  daysAhead: number = EASY_REMINDER_DAYS_AHEAD
): Promise<number> {
  console.log('[rescheduleEasyReminders] Starting for baby profile:', babyProfile.id);

  // Cancel existing EASY schedule reminders
  const existingNotifications = await getScheduledNotifications({
    notificationType: 'sleep',
  });
  console.log(
    '[rescheduleEasyReminders] Found existing notifications:',
    existingNotifications.length
  );
  for (const notification of existingNotifications) {
    const data = safeParseEasyScheduleNotificationData(notification.data);
    // Check if it's an EASY schedule reminder (has activityType in data)
    if (data && data.activityType) {
      try {
        await cancelScheduledNotificationAsync(notification.notificationId);
        await deleteScheduledNotificationByNotificationId(notification.notificationId);
      } catch (error) {
        console.error('Error canceling existing notification:', error);
      }
    }
  }

  // Get formula rule by selected ID from database
  if (!babyProfile.selectedEasyFormulaId) {
    throw new Error('No formula selected for baby profile. Please select a formula first.');
  }

  const formulaRule = await getFormulaRuleById(babyProfile.selectedEasyFormulaId, babyProfile.id);

  if (!formulaRule) {
    throw new Error(
      `Formula rule with ID "${babyProfile.selectedEasyFormulaId}" not found for baby profile`
    );
  }

  const scheduleLabels = {
    eat: labels.eat,
    activity: labels.activity,
    sleep: labels.sleep,
    yourTime: labels.yourTime,
  };

  const scheduleItems: EasyScheduleItem[] = generateEasySchedule(firstWakeTime, {
    labels: scheduleLabels,
    phases: [...formulaRule.phases],
  });

  // Filter out 'Y' activities and schedule reminders for E, A, S
  const activitiesToRemind = scheduleItems.filter((item) => item.activityType !== 'Y');

  const now = new Date();
  let scheduledCount = 0;

  // Schedule reminders for the specified number of days ahead
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
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
        const notificationTitle = labels.reminderTitle({ emoji, activity: activityLabel });
        const notificationBody = labels.reminderBody({
          activity: activityLabel,
          time: item.startTime,
          advance: reminderAdvanceMinutes,
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
  return scheduledCount;
}

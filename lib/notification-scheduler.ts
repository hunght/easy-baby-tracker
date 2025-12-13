import {
  deleteScheduledNotificationByNotificationId,
  getActiveScheduledNotifications,
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

import { EasyScheduleActivityType } from '@/lib/easy-schedule-generator';

export interface ScheduledFeedingNotification {
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
  try {
    const parsed = JSON.parse(record.data);
    return {
      notificationId: record.notificationId,
      scheduledTime: new Date(record.scheduledTime * 1000).toISOString(),
      feedingType: parsed.feedingType,
    };
  } catch {
    return null;
  }
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

export async function scheduleEasyScheduleReminder(options: {
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

// Get all scheduled notifications
export async function getAllScheduledNotifications(): Promise<NotificationRequest[]> {
  return await getAllScheduledNotificationsAsync();
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications(): Promise<void> {
  const active = await getActiveScheduledNotifications();
  for (const notification of active) {
    await cancelScheduledNotificationAsync(notification.notificationId);
    await deleteScheduledNotificationByNotificationId(notification.notificationId);
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
    (n) => n.identifier === feedingNotification.notificationId
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

import { Platform } from 'react-native';
import * as ExpoNotifications from 'expo-notifications';

export interface NotificationContent {
  title: string;
  body: string;
  sound?: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationTrigger {
  type: 'timeInterval';
  seconds: number;
}

export interface NotificationRequest {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

// Web-specific: Store scheduled notifications
const webScheduledNotifications = new Map<
  string,
  { timeoutId: ReturnType<typeof setTimeout>; request: NotificationRequest }
>();

// Web-specific: Check if browser notifications are supported
function isWebNotificationSupported(): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Web-specific: Request browser notification permission
async function requestWebNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isWebNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted' ? 'granted' : permission === 'denied' ? 'denied' : 'undetermined';
}

// Web-specific: Schedule a notification using setTimeout
function scheduleWebNotification(request: NotificationRequest): string {
  if (!isWebNotificationSupported()) {
    throw new Error('Web notifications are not supported');
  }

  const identifier = request.identifier || `web-notification-${Date.now()}-${Math.random()}`;
  const triggerSeconds = request.trigger.seconds;

  const timeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(request.content.title, {
        body: request.content.body,
        icon: '/icon.png', // You may want to customize this
        badge: '/icon.png',
        tag: identifier,
        data: request.content.data,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    // Clean up
    webScheduledNotifications.delete(identifier);
  }, triggerSeconds * 1000);

  webScheduledNotifications.set(identifier, { timeoutId, request });
  return identifier;
}

// Web-specific: Cancel a scheduled notification
function cancelWebNotification(identifier: string): void {
  const scheduled = webScheduledNotifications.get(identifier);
  if (scheduled) {
    clearTimeout(scheduled.timeoutId);
    webScheduledNotifications.delete(identifier);
  }
}

// Web-specific: Get all scheduled notifications
function getAllWebScheduledNotifications(): NotificationRequest[] {
  return Array.from(webScheduledNotifications.values()).map((scheduled) => scheduled.request);
}

// Unified API

export async function getNotificationPermissions(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    if (!isWebNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission === 'granted'
      ? 'granted'
      : Notification.permission === 'denied'
        ? 'denied'
        : 'undetermined';
  }

  const { status } = await ExpoNotifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    const permission = await requestWebNotificationPermission();
    return permission === 'granted';
  }

  const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleNotificationAsync(
  request: Omit<NotificationRequest, 'identifier'>
): Promise<string> {
  if (Platform.OS === 'web') {
    // Generate a unique identifier for web
    const identifier = `web-notification-${Date.now()}-${Math.random()}`;
    const fullRequest: NotificationRequest = {
      ...request,
      identifier,
    };
    return scheduleWebNotification(fullRequest);
  }

  return await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: request.content.title,
      body: request.content.body,
      sound: request.content.sound ?? true,
      data: request.content.data,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: request.trigger.seconds,
    },
  });
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  if (Platform.OS === 'web') {
    cancelWebNotification(identifier);
    return;
  }

  await ExpoNotifications.cancelScheduledNotificationAsync(identifier);
}

function hasSecondsProperty(
  trigger: ExpoNotifications.NotificationTrigger | null | undefined
): trigger is ExpoNotifications.NotificationTrigger & { seconds: number } {
  return (
    trigger !== null &&
    trigger !== undefined &&
    typeof trigger === 'object' &&
    'seconds' in trigger &&
    typeof trigger.seconds === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> {
  if (Platform.OS === 'web') {
    return getAllWebScheduledNotifications();
  }

  const notifications = await ExpoNotifications.getAllScheduledNotificationsAsync();
  return notifications.map((n): NotificationRequest => {
    const trigger = hasSecondsProperty(n.trigger) ? n.trigger : null;
    const soundValue = n.content.sound;
    const sound = typeof soundValue === 'boolean' ? soundValue : soundValue != null;
    return {
      identifier: n.identifier,
      content: {
        title: n.content.title || '',
        body: n.content.body || '',
        sound,
        data: isRecord(n.content.data) ? n.content.data : undefined,
      },
      trigger: {
        type: 'timeInterval',
        seconds: trigger?.seconds || 0,
      },
    };
  });
}

export async function cancelAllScheduledNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    webScheduledNotifications.forEach((_, identifier) => {
      cancelWebNotification(identifier);
    });
    return;
  }

  await ExpoNotifications.cancelAllScheduledNotificationsAsync();
}

// Re-export notification handler types for native
export const setNotificationHandler =
  Platform.OS !== 'web' ? ExpoNotifications.setNotificationHandler : undefined;

export const addNotificationResponseReceivedListener =
  Platform.OS !== 'web' ? ExpoNotifications.addNotificationResponseReceivedListener : undefined;

export const getLastNotificationResponse =
  Platform.OS !== 'web' ? ExpoNotifications.getLastNotificationResponse : () => null;

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  cancelStoredScheduledNotification,
  restoreScheduledNotifications,
  restoreEasyScheduleReminders,
} from '@/lib/notification-scheduler';
import {
  setNotificationHandler,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from '@/lib/notifications-wrapper';

// Component that runs after migrations are complete
export function MigrationCompleteHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize notification handler and restore scheduled notifications
  // This runs only after migrations are complete
  useEffect(() => {
    // Skip notifications setup on web (not fully supported)
    if (Platform.OS === 'web') {
      return;
    }

    // Set up notification handler (only available on native)
    if (setNotificationHandler) {
      setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    // Restore scheduled notifications on app startup
    // This ensures notifications persist even after app termination
    restoreScheduledNotifications().catch((error) => {
      console.error('Failed to restore scheduled notifications:', error);
    });

    // Restore and reschedule EASY schedule reminders on app startup
    // This ensures reminders are always scheduled for the configured number of days ahead
    restoreEasyScheduleReminders().catch((error) => {
      console.error('Failed to restore EASY schedule reminders:', error);
    });

    // Handle notification tap - navigate to appropriate screen
    const handleNotificationResponse = async (
      response: Notifications.NotificationResponse | null
    ) => {
      if (!response) {
        return;
      }
      const data = response.notification.request.content.data;

      if (data?.type === 'feeding') {
        // Cancel the scheduled notification since user is now logging the feeding
        await cancelStoredScheduledNotification();
        // Navigate to feeding screen
        router.push('/(tracking)/feeding');
      }
      // Add other notification types here as needed
    };

    // Listen for notification taps when app is in foreground/background
    let responseSubscription: Notifications.Subscription | undefined;
    if (addNotificationResponseReceivedListener) {
      responseSubscription = addNotificationResponseReceivedListener(handleNotificationResponse);
    }

    // Check if app was opened from a notification (when app was closed)
    if (getLastNotificationResponse) {
      const response = getLastNotificationResponse();
      if (response) {
        handleNotificationResponse(response);
      }
    }

    // Listen for notification received events to clean up stored notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      // If it's a feeding notification, clean up the stored state
      if (notification.request.content.data?.type === 'feeding') {
        restoreScheduledNotifications().catch((error) => {
          console.error('Failed to clean up notification after receipt:', error);
        });
      }
    });

    return () => {
      responseSubscription?.remove();
      receivedSubscription.remove();
    };
  }, [router]);

  return <>{children}</>;
}

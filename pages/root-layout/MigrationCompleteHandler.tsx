import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { seedPredefinedFormulas } from '@/database/easy-formula-rules';
import { seedHabitDefinitions } from '@/database/habits';
import {
  cancelStoredScheduledNotification,
  restoreScheduledNotifications,
} from '@/lib/notification-scheduler';
import {
  setNotificationHandler,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from '@/lib/notifications-wrapper';

// Component that runs after migrations are complete
export function MigrationCompleteHandler({ children }: { children: React.ReactNode }) {
  console.log('[MigrationCompleteHandler] Component rendering');

  // Initialize notification handler and restore scheduled notifications
  // This runs only after migrations are complete
  useEffect(() => {
    console.log('[MigrationCompleteHandler] useEffect running');

    // Skip notifications setup on web (not fully supported)
    if (Platform.OS === 'web') {
      console.log('[MigrationCompleteHandler] Skipping on web platform');
      return;
    }

    // Seed predefined formulas if not already present
    console.log('[MigrationCompleteHandler] Seeding predefined formulas');
    seedPredefinedFormulas().catch((error) => {
      console.error('[MigrationCompleteHandler] Failed to seed formulas:', error);
    });

    // Seed habit definitions if not already present
    console.log('[MigrationCompleteHandler] Seeding habit definitions');
    seedHabitDefinitions().catch((error) => {
      console.error('[MigrationCompleteHandler] Failed to seed habits:', error);
    });

    // Set up notification handler (only available on native)
    if (setNotificationHandler) {
      console.log('[MigrationCompleteHandler] Setting up notification handler');
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
    console.log('[MigrationCompleteHandler] Calling restoreScheduledNotifications');
    restoreScheduledNotifications().catch((error) => {
      console.error('[MigrationCompleteHandler] Failed to restore scheduled notifications:', error);
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
        // Navigate to feeding screen - use imperative router (doesn't require hook context)
        // Delay to ensure navigation is ready
        setTimeout(() => {
          router.push('/(tracking)/feeding');
        }, 100);
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
  }, []);

  return <>{children}</>;
}

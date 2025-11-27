import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationProvider } from '@/components/ui/NotificationContext';
import { db, expoDb } from '@/database/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  cancelStoredScheduledNotification,
  restoreScheduledNotifications,
} from '@/lib/notification-scheduler';
import { LocalizationProvider, useLocalization } from '@/localization/LocalizationProvider';
import * as Notifications from 'expo-notifications';
import migrations from '../drizzle/migrations';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Component that handles migrations and Drizzle Studio
function MigrationHandler({ children }: { children: React.ReactNode }) {
  // Set up Drizzle Studio
  useDrizzleStudio(expoDb);

  // Run migrations
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration is in progress...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppProviders />
    </LocalizationProvider>
  );
}

function AppProviders() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => new QueryClient());
  const { t } = useLocalization();
  const router = useRouter();

  // Initialize notification handler and restore scheduled notifications
  useEffect(() => {
    // Set up notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Restore scheduled notifications on app startup
    // This ensures notifications persist even after app termination
    restoreScheduledNotifications().catch((error) => {
      console.error('Failed to restore scheduled notifications:', error);
    });

    // Handle notification tap - navigate to appropriate screen
    const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'feeding') {
        // Cancel the scheduled notification since user is now logging the feeding
        await cancelStoredScheduledNotification();
        // Navigate to feeding screen
        router.push('/feeding');
      }
      // Add other notification types here as needed
    };

    // Listen for notification taps when app is in foreground/background
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Check if app was opened from a notification (when app was closed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

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
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <MigrationHandler>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="profile-selection" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="feeding" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="pumping" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="diaper" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="sleep" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="health" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="growth" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="easy-schedule" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="easy-schedule-info" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="diary" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('modal.title') }} />
                <Stack.Screen name="profile-edit" options={{ presentation: 'modal', headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
              <PortalHost />
            </ThemeProvider>
          </QueryClientProvider>
        </MigrationHandler>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

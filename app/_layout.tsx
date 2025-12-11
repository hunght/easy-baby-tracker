import '@/global.css';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack, useNavigationContainerRef, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { NotificationProvider } from '@/components/NotificationContext';
import { db, expoDb } from '@/database/db';
import {
  cancelStoredScheduledNotification,
  restoreScheduledNotifications,
} from '@/lib/notification-scheduler';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { LocalizationProvider, useLocalization } from '@/localization/LocalizationProvider';
import * as Notifications from 'expo-notifications';
import migrations from '../drizzle/migrations';
import { logger } from '@/lib/logger';

export const unstable_settings = {
  anchor: '(tabs)/tracking',
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

  return <MigrationCompleteHandler>{children}</MigrationCompleteHandler>;
}

// Component that runs after migrations are complete
function MigrationCompleteHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize notification handler and restore scheduled notifications
  // This runs only after migrations are complete
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
        router.push('/(tracking)/feeding');
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

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <ThemeProvider>
        <AppProviders />
      </ThemeProvider>
    </LocalizationProvider>
  );
}

function AppProviders() {
  const { colorScheme } = useTheme();
  const [queryClient] = useState(() => new QueryClient());
  const { t } = useLocalization();

  const navigationRef = useNavigationContainerRef();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  // Get the background color from THEME
  const backgroundColor = colorScheme === 'dark' ? '#11181C' : '#F5F7FA';

  useEffect(() => {
    const logCurrentRoute = () => {
      const route = navigationRef.getCurrentRoute();

      if (route) {
        logger.log('[Navigation] current screen:', route.name, route.params ?? {});
      } else {
        logger.log('[Navigation] awaiting initial route...');
      }
    };

    const unsubscribeReady = navigationRef.addListener('ready', logCurrentRoute);
    const unsubscribeState = navigationRef.addListener('state', logCurrentRoute);

    return () => {
      unsubscribeReady();
      unsubscribeState();
    };
  }, [navigationRef]);
  logger.log('Rendering AppProviders with colorScheme:', colorScheme);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NotificationProvider>
        <MigrationHandler>
          <QueryClientProvider client={queryClient}>
            <NavigationThemeProvider value={navTheme}>
              <View style={{ backgroundColor, flex: 1 }} className="flex-1">
                <Stack
                  ref={navigationRef}
                  screenOptions={{
                    // Render screens transparently so our wrapper View controls background via Tailwind
                    contentStyle: { backgroundColor: 'transparent' },
                    headerShown: false,
                  }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="profile-selection" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="modal"
                    options={{ presentation: 'modal', title: t('modal.title') }}
                  />
                  <Stack.Screen
                    name="profile-edit"
                    options={{ presentation: 'modal', headerShown: false }}
                  />
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <PortalHost />
              </View>
            </NavigationThemeProvider>
          </QueryClientProvider>
        </MigrationHandler>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

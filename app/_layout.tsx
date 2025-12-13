import '@/global.css';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { NotificationProvider } from '@/components/NotificationContext';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { LocalizationProvider } from '@/localization/LocalizationProvider';
import { DatabaseInitializer } from '@/pages/root-layout/DatabaseInitializer';
import { logger } from '@/lib/logger';

export const unstable_settings = {
  anchor: '(tabs)/tracking',
};

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
        <DatabaseInitializer>
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
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <PortalHost />
              </View>
            </NavigationThemeProvider>
          </QueryClientProvider>
        </DatabaseInitializer>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

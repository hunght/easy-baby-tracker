// Polyfill window for Convex compatibility in React Native
declare const window: Window & {
  addEventListener?: typeof globalThis.addEventListener;
  removeEventListener?: typeof globalThis.removeEventListener;
};

if (typeof window !== 'undefined' && !window.addEventListener) {
  window.addEventListener = () => undefined;
  window.removeEventListener = () => undefined;
}

import '@/global.css';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { NotificationProvider } from '@/components/NotificationContext';
import { FeatureFlagProvider } from '@/context/FeatureFlagContext';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { LocalizationProvider } from '@/localization/LocalizationProvider';
import { DatabaseInitializer } from '@/pages/root-layout/DatabaseInitializer';
import { NavigationStack } from '@/pages/root-layout/NavigationStack';

export const unstable_settings = {
  anchor: '(tabs)/tracking',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  // Suppress expo-notifications Expo Go warnings (we use local notifications, not push)
  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreLogs([
        /expo-notifications.*Android Push notifications/,
        /expo-notifications.*not fully supported in Expo Go/,
        /expo-notifications.*Expo Go/,
      ]);
    }
  }, []);

  useEffect(() => {
    // Hide splash screen once we are ready to render
    // In this app, we want to show the MigrationHandler UI if database setup takes time,
    // so we hide the native splash screen as soon as React mounts.
    SplashScreen.hideAsync().catch(() => {
      // Ignore error if splash screen is already hidden or not registered
    });
  }, []);

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
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NotificationProvider>
        <DatabaseInitializer>
          <FeatureFlagProvider>
            <NavigationThemeProvider value={navTheme}>
              <NavigationStack colorScheme={colorScheme} />
            </NavigationThemeProvider>
          </FeatureFlagProvider>
        </DatabaseInitializer>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

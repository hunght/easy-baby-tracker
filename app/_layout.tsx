import '@/global.css';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { NotificationProvider } from '@/components/NotificationContext';
import { FeatureFlagProvider } from '@/context/FeatureFlagContext';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { LocalizationProvider } from '@/localization/LocalizationProvider';
import { DatabaseInitializer } from '@/pages/root-layout/DatabaseInitializer';
import { NavigationStack } from '@/pages/root-layout/NavigationStack';

const queryClient = new QueryClient({});

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

  useReactQueryDevTools(queryClient);

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NotificationProvider>
        <DatabaseInitializer>
          <QueryClientProvider client={queryClient}>
            <FeatureFlagProvider>
              <NavigationThemeProvider value={navTheme}>
                <NavigationStack colorScheme={colorScheme} />
              </NavigationThemeProvider>
            </FeatureFlagProvider>
          </QueryClientProvider>
        </DatabaseInitializer>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

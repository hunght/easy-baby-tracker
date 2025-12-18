import { PortalHost } from '@rn-primitives/portal';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';

import { THEME } from '@/lib/theme';

interface NavigationStackProps {
  colorScheme: 'light' | 'dark';
}

export function NavigationStack({ colorScheme }: NavigationStackProps) {
  // Get the background color from THEME
  const backgroundColor = THEME[colorScheme].background;

  const navigationRef = useNavigationContainerRef();

  useReactNavigationDevTools(navigationRef);

  return (
    <View style={{ backgroundColor, flex: 1 }} className="flex-1">
      <Stack
        ref={navigationRef}
        screenOptions={{
          // Render screens transparently so our wrapper View controls background via Tailwind
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(habit)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tracking)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(easy-schedule)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(profiles)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <PortalHost />
    </View>
  );
}

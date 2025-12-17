import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EasyScheduleLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="easy-schedule" />
        <Stack.Screen name="easy-schedule-select" />
        <Stack.Screen name="easy-schedule-form" />
        <Stack.Screen name="easy-schedule-settings" />
      </Stack>
    </SafeAreaView>
  );
}

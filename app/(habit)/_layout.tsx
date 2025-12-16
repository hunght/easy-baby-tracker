import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HabitLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="habit" />
        <Stack.Screen name="habit-select" />
        <Stack.Screen name="habit-detail" />
      </Stack>
    </SafeAreaView>
  );
}

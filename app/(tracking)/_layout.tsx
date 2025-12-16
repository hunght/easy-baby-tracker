import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackingLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="feeding" />
        <Stack.Screen name="pumping" />
        <Stack.Screen name="diaper" />
        <Stack.Screen name="sleep" />
        <Stack.Screen name="health" />
        <Stack.Screen name="growth" />
        <Stack.Screen name="diary" />
      </Stack>
    </SafeAreaView>
  );
}

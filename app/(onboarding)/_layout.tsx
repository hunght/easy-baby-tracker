import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="difficulty" />
      <Stack.Screen name="daily-goal" />
    </Stack>
  );
}

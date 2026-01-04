import { Stack } from 'expo-router';

export default function WordLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

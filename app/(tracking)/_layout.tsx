import { Stack } from 'expo-router';

export default function TrackingLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}
    />
  );
}

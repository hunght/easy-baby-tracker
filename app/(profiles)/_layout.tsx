import { Stack } from 'expo-router';

export default function ProfilesLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}
    />
  );
}

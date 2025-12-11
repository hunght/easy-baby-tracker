import { Stack } from 'expo-router';

export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        title: 'Dev Tools',
      }}
    />
  );
}

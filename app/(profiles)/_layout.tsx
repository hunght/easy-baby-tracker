import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilesLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </SafeAreaView>
  );
}

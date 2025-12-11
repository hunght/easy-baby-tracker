import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: true,
          title: 'Dev Tools',
        }}
      />
    </SafeAreaView>
  );
}

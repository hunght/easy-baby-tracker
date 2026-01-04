import { useQuery } from '@tanstack/react-query';
import { useRouter, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { getActiveUserProfile } from '@/database/user-profile';
import { useBrandColor } from '@/hooks/use-brand-color';

/**
 * App entry screen that handles routing logic.
 * Determines whether to show onboarding or main app.
 */
export default function AppScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();

  // Check if we have an active user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['activeUserProfile'],
    queryFn: getActiveUserProfile,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Once we know the state, redirect appropriately
  useEffect(() => {
    if (isLoading) return;

    if (profile) {
      // User exists, go to main app
      router.replace('/(tabs)/quiz');
    } else {
      // No user, show onboarding
      router.replace('/(onboarding)/welcome');
    }
  }, [profile, isLoading, router]);

  // Show loading state while checking
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={brandColors.colors.primary} />
      <Text className="mt-4 text-muted-foreground">Loading...</Text>
    </View>
  );
}

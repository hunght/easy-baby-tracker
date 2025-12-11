import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { OnboardingScreen } from '@/pages/onboarding/OnboardingScreen';
import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfile, getBabyProfiles } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useBrandColor } from '@/hooks/use-brand-color';

/**
 * App entry screen that handles general routing logic.
 * Determines whether to show onboarding, profile selection, or main app.
 */
export default function AppScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });

  // Handle routing based on profile state
  useEffect(() => {
    if (!profileLoading && !profilesLoading) {
      if (profile) {
        // User has an active profile, go to main app
        router.replace('/(tabs)/tracking');
      } else if (profiles.length > 0) {
        // User has profiles but none is active, go to profile selection
        router.replace('/(profiles)/profile-selection');
      }
      // If no profiles exist, stay on this screen to show onboarding
    }
  }, [profile, profileLoading, profiles, profilesLoading, router]);

  // Show loading state while checking profile status
  if (profileLoading || profilesLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.accent} />
        <Text className="font-semibold text-primary">{t('common.loading')}</Text>
      </View>
    );
  }

  // If user has profile or profiles, we're redirecting (handled by useEffect)
  // Show loading during redirect
  if (profile || profiles.length > 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.accent} />
        <Text className="font-semibold text-primary">
          {profile ? t('common.loadingDashboard') : t('common.loadingProfiles')}
        </Text>
      </View>
    );
  }

  // No profiles exist, show onboarding
  return (
    <OnboardingScreen
      onComplete={() => {
        router.replace('/(tabs)/tracking');
      }}
    />
  );
}

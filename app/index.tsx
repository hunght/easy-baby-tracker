import { useQuery } from "convex/react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { OnboardingScreen } from "@/pages/onboarding/OnboardingScreen";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import { useLocalization } from "@/localization/LocalizationProvider";
import { useBrandColor } from "@/hooks/use-brand-color";

/**
 * App entry screen that handles general routing logic.
 * Determines whether to show onboarding, profile selection, or main app.
 */
export default function AppScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const { testOnboarding } = useLocalSearchParams<{ testOnboarding?: string }>();

  // Get active profile
  const profile = useQuery(api.babyProfiles.getActive);

  // Get all profiles
  const profiles = useQuery(api.babyProfiles.list) ?? [];

  const isLoading = profile === undefined || profiles === undefined;

  // Handle routing based on profile state
  useEffect(() => {
    // Skip routing if testing onboarding
    if (testOnboarding === "true") {
      return;
    }

    if (!isLoading) {
      if (profile) {
        // User has an active profile, go to main app
        router.replace("/(tabs)/tracking");
      } else if (profiles.length > 0) {
        // User has profiles but none is active, go to profile selection
        router.replace("/(profiles)/profile-selection");
      }
      // If no profiles exist, stay on this screen to show onboarding
    }
  }, [profile, profiles, isLoading, router, testOnboarding]);

  // Show loading state while checking profile status
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.accent} />
        <Text className="font-semibold text-primary">{t("common.loading")}</Text>
      </View>
    );
  }

  // If user has profile or profiles, we're redirecting (handled by useEffect)
  // Show loading during redirect
  if ((profile || profiles.length > 0) && testOnboarding !== "true") {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.accent} />
        <Text className="font-semibold text-primary">
          {profile ? t("common.loadingDashboard") : t("common.loadingProfiles")}
        </Text>
      </View>
    );
  }

  // No profiles exist or testing onboarding, show onboarding
  return (
    <OnboardingScreen
      onComplete={() => {
        router.replace("/(tabs)/tracking");
      }}
    />
  );
}

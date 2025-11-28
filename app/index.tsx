import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { BabyProfileStep } from '@/components/BabyProfileStep';
import { ConcernsStep } from '@/components/ConcernsStep';
import { FeaturesStep } from '@/components/FeaturesStep';
import { WelcomeStep } from '@/components/WelcomeStep';
import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import {
  BabyProfilePayload,
  getActiveBabyProfile,
  getBabyProfiles,
  saveOnboardingProfile,
} from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function OnboardingScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });
  const [step, setStep] = useState(0);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  useEffect(() => {
    if (!profileLoading && !profilesLoading) {
      if (profile) {
        router.replace('/(tabs)');
      } else if (profiles.length > 0) {
        router.replace('/profile-selection');
      }
    }
  }, [profile, profileLoading, profiles, profilesLoading, router]);

  const nextStep = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSaveProfile = async (profileData: BabyProfilePayload) => {
    await saveOnboardingProfile(profileData);
    await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: BABY_PROFILES_QUERY_KEY });
    router.replace('/(tabs)');
  };

  const toggleConcern = (id: string) =>
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );

  const headerText = useMemo(() => {
    switch (step) {
      case 0:
        return t('onboarding.headers.welcome');
      case 1:
        return t('onboarding.headers.concerns');
      case 2:
        return t('onboarding.headers.features');
      default:
        return t('onboarding.headers.profile');
    }
  }, [step, t]);

  if (profileLoading || profilesLoading || profile || profiles.length > 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" color="#FF5C8D" />
        <Text className="font-semibold text-primary">
          {profile
            ? t('common.loadingDashboard')
            : profiles.length > 0
              ? t('common.loadingProfiles')
              : t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pt-15 pb-10 px-6 gap-6" bounces={false}>
        {step === 0 && <WelcomeStep headerText={headerText} onContinue={nextStep} />}
        {step === 1 && (
          <ConcernsStep
            headerText={headerText}
            selectedConcerns={selectedConcerns}
            toggleConcern={toggleConcern}
            onContinue={nextStep}
          />
        )}
        {step === 2 && <FeaturesStep headerText={headerText} onContinue={nextStep} />}
        {step === 3 && (
          <BabyProfileStep
            headerText={headerText}
            concerns={selectedConcerns}
            onSave={handleSaveProfile}
          />
        )}
      </ScrollView>
    </View>
  );
}

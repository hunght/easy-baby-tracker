import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileStep } from '@/pages/onboarding/components/BabyProfileStep';
import { ConcernsStep } from '@/pages/onboarding/components/ConcernsStep';
import { FeaturesStep } from '@/pages/onboarding/components/FeaturesStep';
import { WelcomeStep } from '@/pages/onboarding/components/WelcomeStep';
import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { BabyProfilePayload, saveOnboardingProfile } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const nextStep = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSaveProfile = async (profileData: BabyProfilePayload) => {
    await saveOnboardingProfile(profileData);
    await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: BABY_PROFILES_QUERY_KEY });
    onComplete();
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
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
    </SafeAreaView>
  );
}

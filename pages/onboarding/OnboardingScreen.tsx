import { useMutation } from 'convex/react';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileStep } from '@/pages/onboarding/components/BabyProfileStep';
import { WelcomeStep } from '@/pages/onboarding/components/WelcomeStep';
import { api } from '@/convex/_generated/api';
import { BabyProfilePayload } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useLocalization();
  const [step, setStep] = useState(0);

  // Convex mutation to create profile
  const createProfile = useMutation(api.babyProfiles.create);

  const nextStep = () => {
    if (step < 1) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSaveProfile = async (profileData: BabyProfilePayload) => {
    await createProfile({
      nickname: profileData.nickname,
      gender: profileData.gender,
      birthDate: profileData.birthDate,
      dueDate: profileData.dueDate,
      firstWakeTime: profileData.firstWakeTime,
    });
    // Convex is reactive, no need to invalidate queries
    onComplete();
  };

  const headerText = useMemo(() => {
    switch (step) {
      case 0:
        return t('onboarding.headers.welcome');
      default:
        return t('onboarding.headers.profile');
    }
  }, [step, t]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="pt-15 pb-10 px-6 gap-6" bounces={false}>
        {step === 0 && <WelcomeStep headerText={headerText} onContinue={nextStep} />}
        {step === 1 && (
          <BabyProfileStep headerText={headerText} concerns={[]} onSave={handleSaveProfile} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

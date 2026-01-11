import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileStep } from '@/pages/onboarding/components/BabyProfileStep';
import { WelcomeStep } from '@/pages/onboarding/components/WelcomeStep';
import { api } from '@/convex/_generated/api';
import { BabyProfilePayload } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useConvexAuth } from '@/pages/root-layout/ConvexAuthProvider';

type OnboardingScreenProps = {
  onComplete: () => void;
  onExplore?: () => void;
};

export function OnboardingScreen({ onComplete, onExplore }: OnboardingScreenProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  // Skip welcome step if already authenticated - go directly to profile creation
  const [step, setStep] = useState(isAuthenticated ? 1 : 0);

  // Convex mutation to create profile
  const createProfile = useMutation(api.babyProfiles.create);

  const handleContinue = () => {
    if (!isAuthenticated) {
      // Need to sign up first before creating profile
      router.push('/(auth)/sign-in?mode=signup');
    } else {
      // Already authenticated, go to profile creation
      setStep(1);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleExplore = () => {
    if (onExplore) {
      onExplore();
    } else {
      // Go to main app in guest mode
      router.replace('/(tabs)/tracking');
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
        {step === 0 && (
          <WelcomeStep
            headerText={headerText}
            onContinue={handleContinue}
            onSignIn={handleSignIn}
            onExplore={handleExplore}
          />
        )}
        {step === 1 && (
          <BabyProfileStep headerText={headerText} concerns={[]} onSave={handleSaveProfile} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

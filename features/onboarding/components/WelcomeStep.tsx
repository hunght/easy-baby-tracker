import * as React from 'react';
import { Image, View } from 'react-native';
import { useLocalization } from '@/localization/LocalizationProvider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type WelcomeStepProps = {
  headerText: string;
  onContinue: () => void;
};

export function WelcomeStep({ headerText, onContinue }: WelcomeStepProps) {
  const { t } = useLocalization();

  return (
    <View className="gap-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-neutral-500 underline">
          {t('onboarding.welcome.privacy')}
        </Text>
        <Text className="text-sm text-neutral-500 underline">{t('onboarding.welcome.terms')}</Text>
      </View>

      <View className="items-center gap-4">
        <Image
          source={require('@/assets/images/icon.png')}
          className="h-40 w-40"
          resizeMode="contain"
        />
        <Text className="text-center text-2xl font-semibold text-neutral-900">{headerText}</Text>
        <Text className="text-center text-lg font-medium text-pink-500">
          {t('onboarding.welcome.quote')}
        </Text>
        <Text className="text-center text-xs leading-5 text-neutral-500">
          {t('onboarding.welcome.disclaimer')}
        </Text>
      </View>

      <Button onPress={onContinue}>
        <Text>{t('common.continue')}</Text>
      </Button>
    </View>
  );
}

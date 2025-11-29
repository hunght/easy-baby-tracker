import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
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
        <Text className="text-sm text-muted-foreground underline">
          {t('onboarding.welcome.privacy')}
        </Text>
        <Text className="text-sm text-muted-foreground underline">
          {t('onboarding.welcome.terms')}
        </Text>
      </View>

      <View className="items-center gap-4">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
          transition={200}
        />
        <Text className="text-center text-2xl font-semibold text-foreground">{headerText}</Text>
        <Text className="text-center text-lg font-medium text-accent">
          {t('onboarding.welcome.quote')}
        </Text>
        <Text className="text-center text-xs leading-5 text-muted-foreground">
          {t('onboarding.welcome.disclaimer')}
        </Text>
      </View>

      <Button onPress={onContinue}>
        <Text>{t('common.continue')}</Text>
      </Button>
    </View>
  );
}

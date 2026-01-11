import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalization } from '@/localization/LocalizationProvider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type WelcomeStepProps = {
  headerText: string;
  onContinue: () => void;
  onSignIn: () => void;
  onExplore: () => void;
};

export function WelcomeStep({ headerText, onContinue, onSignIn, onExplore }: WelcomeStepProps) {
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

      <View className="items-center gap-6">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 160, height: 160 }}
          contentFit="contain"
          transition={200}
        />
        <Text className="text-center text-3xl font-bold text-foreground">{headerText}</Text>
        <Text className="text-center text-xl font-medium italic text-accent/80">
          {t('onboarding.welcome.quote')}
        </Text>
        <Text className="px-4 text-center text-base leading-7 text-muted-foreground">
          {t('onboarding.welcome.description')}
        </Text>
        <View className="w-full gap-3 pt-2">
          {[
            'onboarding.welcome.features.track',
            'onboarding.welcome.features.monitor',
            'onboarding.welcome.features.organize',
          ].map((key) => (
            <View key={key} className="flex-row items-center gap-3">
              <Text className="text-lg text-accent">✓</Text>
              <Text className="flex-1 text-base text-foreground">{t(key)}</Text>
            </View>
          ))}
        </View>
        <Text className="text-center text-xs leading-5 text-muted-foreground">
          {t('onboarding.welcome.disclaimer')}
        </Text>
      </View>

      <View className="gap-3">
        <Button onPress={onContinue}>
          <Text>{t('onboarding.welcome.createAccount')}</Text>
        </Button>
        <Button variant="outline" onPress={onSignIn}>
          <Text>{t('onboarding.welcome.signIn')}</Text>
        </Button>
        <Button variant="ghost" onPress={onExplore}>
          <Text className="text-muted-foreground">{t('onboarding.welcome.exploreAsGuest')}</Text>
        </Button>
      </View>
    </View>
  );
}

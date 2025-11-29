import { View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type FeatureSection = {
  key: 'control' | 'aware' | 'save';
  bulletKeys: string[];
  canShowAll: boolean;
};

const featureSections: FeatureSection[] = [
  {
    key: 'control',
    bulletKeys: ['identifySleep', 'dayOverview', 'milkIntake'],
    canShowAll: true,
  },
  {
    key: 'aware',
    bulletKeys: ['growth', 'medication'],
    canShowAll: false,
  },
  {
    key: 'save',
    bulletKeys: ['sync', 'sharing'],
    canShowAll: false,
  },
];

type FeaturesStepProps = {
  headerText: string;
  onContinue: () => void;
};

export function FeaturesStep({ headerText, onContinue }: FeaturesStepProps) {
  const { t } = useLocalization();

  return (
    <View className="gap-4">
      <Text className="text-center text-2xl font-bold text-foreground">{headerText}</Text>
      <View className="gap-4">
        {featureSections.map((section) => (
          <View key={section.key} className="gap-3 rounded-lg bg-card p-5 shadow-sm">
            <View className="flex-row items-center gap-3">
              <Text className="text-xl text-accent">★</Text>
              <Text className="text-lg font-bold text-foreground">
                {t(`onboarding.features.sections.${section.key}.title`)}
              </Text>
            </View>
            {section.bulletKeys.map((bulletKey) => (
              <View key={bulletKey} className="flex-row items-center gap-2">
                <Text className="text-accent">✓</Text>
                <Text className="flex-1 text-[15px] text-foreground">
                  {t(`onboarding.features.sections.${section.key}.bullets.${bulletKey}`)}
                </Text>
              </View>
            ))}
            {section.canShowAll && (
              <Text className="self-end font-semibold text-accent">
                {t('onboarding.features.showAll')}
              </Text>
            )}
          </View>
        ))}
      </View>
      <Button onPress={onContinue}>
        <Text>{t('common.continue')}</Text>
      </Button>
    </View>
  );
}

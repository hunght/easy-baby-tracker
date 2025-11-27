import { View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

const featureSections = [
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
] as const;

type FeaturesStepProps = {
    headerText: string;
    onContinue: () => void;
};

export function FeaturesStep({ headerText, onContinue }: FeaturesStepProps) {
    const { t } = useLocalization();

    return (
        <View className="gap-4">
            <Text className="text-center text-2xl font-bold text-neutral-900">{headerText}</Text>
            <View className="gap-4">
                {featureSections.map((section) => (
                    <View key={section.key} className="gap-3 rounded-2xl bg-white p-5 shadow-sm">
                        <View className="flex-row items-center gap-3">
                            <Text className="text-xl text-pink-500">★</Text>
                            <Text className="text-lg font-bold text-neutral-900">
                                {t(`onboarding.features.sections.${section.key}.title`)}
                            </Text>
                        </View>
                        {section.bulletKeys.map((bulletKey) => (
                            <View key={bulletKey} className="flex-row items-center gap-2">
                                <Text className="text-pink-500">✓</Text>
                                <Text className="flex-1 text-[15px] text-neutral-600">
                                    {t(`onboarding.features.sections.${section.key}.bullets.${bulletKey}`)}
                                </Text>
                            </View>
                        ))}
                        {section.canShowAll && (
                            <Text className="self-end font-semibold text-pink-500">
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
 

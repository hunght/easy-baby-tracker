import { Pressable, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

const concernOptions: { id: string; labelKey: string }[] = [
    { id: 'sleep', labelKey: 'onboarding.concerns.options.sleep' },
    { id: 'fed', labelKey: 'onboarding.concerns.options.fed' },
    { id: 'routine', labelKey: 'onboarding.concerns.options.routine' },
    { id: 'development', labelKey: 'onboarding.concerns.options.development' },
    { id: 'ill', labelKey: 'onboarding.concerns.options.ill' },
    { id: 'caregivers', labelKey: 'onboarding.concerns.options.caregivers' },
];

type ConcernsStepProps = {
    headerText: string;
    selectedConcerns: string[];
    toggleConcern: (id: string) => void;
    onContinue: () => void;
};

export function ConcernsStep({ headerText, selectedConcerns, toggleConcern, onContinue }: ConcernsStepProps) {
    const { t } = useLocalization();

    return (
        <View className="gap-4">
            <Text className="text-center text-2xl font-bold text-neutral-900">{headerText}</Text>
            <Text className="text-center text-sm text-neutral-400">{t('onboarding.concerns.helper')}</Text>
            <View className="gap-3">
                {concernOptions.map((option) => {
                    const selected = selectedConcerns.includes(option.id);
                    return (
                        <Pressable
                            key={option.id}
                            onPress={() => toggleConcern(option.id)}
                            className={`flex-row items-center gap-3 rounded-xl border p-4 ${selected ? 'border-pink-400 bg-pink-50' : 'border-pink-200 bg-white'}`}
                        >
                            <View className={`h-5 w-5 rounded border-2 ${selected ? 'border-pink-500 bg-pink-500' : 'border-neutral-300'}`} />
                            <Text className="flex-1 text-base text-neutral-800">{t(option.labelKey)}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Button onPress={onContinue}>
                <Text>{t('common.continue')}</Text>
            </Button>
        </View>
    );
}
 

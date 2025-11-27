import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

import { PrimaryButton } from './ui/PrimaryButton';

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
        <>
            <Text style={styles.heading}>{headerText}</Text>
            <Text style={styles.helper}>{t('onboarding.concerns.helper')}</Text>
            <View style={styles.concernList}>
                {concernOptions.map((option) => (
                    <Pressable
                        key={option.id}
                        onPress={() => toggleConcern(option.id)}
                        style={[styles.concernItem, selectedConcerns.includes(option.id) && styles.concernSelected]}>
                        <View style={[styles.checkbox, selectedConcerns.includes(option.id) && styles.checkboxSelected]} />
                        <Text style={styles.concernLabel}>{t(option.labelKey)}</Text>
                    </Pressable>
                ))}
            </View>
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
        </>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 26,
        textAlign: 'center',
        fontWeight: '700',
        color: '#2D2D2D',
    },
    helper: {
        textAlign: 'center',
        color: '#C3C3C3',
        fontSize: 14,
    },
    concernList: {
        gap: 12,
    },
    concernItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#F1B6C6',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFF',
    },
    concernSelected: {
        borderColor: '#FF728D',
        backgroundColor: '#FFE7EF',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#C3C3C3',
        borderRadius: 4,
    },
    checkboxSelected: {
        backgroundColor: '#FF728D',
        borderColor: '#FF728D',
    },
    concernLabel: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});

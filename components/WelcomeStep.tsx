import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

import { PrimaryButton } from './ui/PrimaryButton';

type WelcomeStepProps = {
    headerText: string;
    onContinue: () => void;
};

export function WelcomeStep({ headerText, onContinue }: WelcomeStepProps) {
    const { t } = useLocalization();

    return (
        <>
            <View style={styles.topLinks}>
                <Text style={styles.linkText}>{t('onboarding.welcome.privacy')}</Text>
                <Text style={styles.linkText}>{t('onboarding.welcome.terms')}</Text>
            </View>
            <View style={styles.centeredContent}>
                <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
                <Text style={styles.heading}>{headerText}</Text>
                <Text style={styles.subQuote}>{t('onboarding.welcome.quote')}</Text>
                <Text style={styles.disclaimer}>{t('onboarding.welcome.disclaimer')}</Text>
            </View>
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
        </>
    );
}

const styles = StyleSheet.create({
    topLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    linkText: {
        color: '#999',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    centeredContent: {
        alignItems: 'center',
        gap: 16,
    },
    logo: {
        width: 160,
        height: 160,
    },
    heading: {
        fontSize: 26,
        textAlign: 'center',
        fontWeight: '700',
        color: '#2D2D2D',
    },
    subQuote: {
        textAlign: 'center',
        fontSize: 18,
        color: '#FF7FA3',
        fontWeight: '500',
    },
    disclaimer: {
        textAlign: 'center',
        color: '#888',
        fontSize: 12,
        lineHeight: 18,
    },
});

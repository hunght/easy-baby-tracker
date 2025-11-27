import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

import { PrimaryButton } from './ui/PrimaryButton';

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
        <>
            <Text style={styles.heading}>{headerText}</Text>
            <View style={styles.featureList}>
                {featureSections.map((section) => (
                    <View key={section.key} style={styles.featureCard}>
                        <View style={styles.featureHeader}>
                            <Text style={styles.featureIcon}>★</Text>
                            <Text style={styles.featureTitle}>
                                {t(`onboarding.features.sections.${section.key}.title`)}
                            </Text>
                        </View>
                        {section.bulletKeys.map((bulletKey) => (
                            <View key={bulletKey} style={styles.featureBulletRow}>
                                <Text style={styles.checkIcon}>✓</Text>
                                <Text style={styles.featureBullet}>
                                    {t(`onboarding.features.sections.${section.key}.bullets.${bulletKey}`)}
                                </Text>
                            </View>
                        ))}
                        {section.canShowAll && <Text style={styles.showAll}>{t('onboarding.features.showAll')}</Text>}
                    </View>
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
    featureList: {
        gap: 16,
    },
    featureCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    featureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        color: '#FF728D',
        fontSize: 20,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    featureBulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkIcon: {
        color: '#FF728D',
        fontSize: 16,
    },
    featureBullet: {
        flex: 1,
        fontSize: 15,
        color: '#555',
    },
    showAll: {
        alignSelf: 'flex-end',
        color: '#FF728D',
        fontWeight: '600',
    },
});

import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BabyProfilePayload, Gender } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { DatePickerField } from './ui/DatePickerField';
import { PrimaryButton } from './ui/PrimaryButton';

type BabyProfileStepProps = {
    headerText: string;
    concerns: string[];
    onSave: (profile: BabyProfilePayload) => Promise<void>;
};

const genderSegments: { key: Gender; labelKey: string }[] = [
    { key: 'unknown', labelKey: 'onboarding.babyProfile.genderOptions.unknown' },
    { key: 'boy', labelKey: 'onboarding.babyProfile.genderOptions.boy' },
    { key: 'girl', labelKey: 'onboarding.babyProfile.genderOptions.girl' },
];

export function BabyProfileStep({ headerText, concerns, onSave }: BabyProfileStepProps) {
    const { t } = useLocalization();

    const [nickname, setNickname] = useState(t('common.nicknamePlaceholder'));
    const [gender, setGender] = useState<Gender>('unknown');
    const [birthDate, setBirthDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date());
    const [isSaving, setIsSaving] = useState(false);

    const handleContinue = async () => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            await onSave({
                nickname,
                gender,
                birthDate: birthDate.toISOString(),
                dueDate: dueDate.toISOString(),
                concerns,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.profileCard}>
            <Text style={styles.heading}>{headerText}</Text>
            <View style={styles.avatarWrapper}>
                <Image source={require('@/assets/images/icon.png')} style={styles.avatar} />
                <Text style={styles.addPhoto}>{t('common.addPhoto')}</Text>
            </View>

            <Text style={styles.label}>{t('common.nickname')}</Text>
            <TextInput
                value={nickname}
                onChangeText={setNickname}
                style={styles.input}
                placeholder={t('common.nicknamePlaceholder')}
                placeholderTextColor="#C4C4C4"
            />

            <Text style={styles.label}>{t('common.gender')}</Text>
            <View style={styles.segmentedControl}>
                {genderSegments.map((segment) => (
                    <Pressable
                        key={segment.key}
                        onPress={() => setGender(segment.key)}
                        style={[styles.segment, gender === segment.key && styles.segmentActive]}>
                        <Text style={[styles.segmentText, gender === segment.key && styles.segmentTextActive]}>
                            {t(segment.labelKey)}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <DatePickerField label={t('common.birthdate')} value={birthDate} onChange={setBirthDate} />

            <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />

            <Text style={styles.infoText}>
                {t('onboarding.babyProfile.info')}
            </Text>

            <PrimaryButton label={t('common.continue')} onPress={handleContinue} loading={isSaving} />
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 26,
        textAlign: 'center',
        fontWeight: '700',
        color: '#2D2D2D',
    },
    profileCard: {
        backgroundColor: '#F7F4FF',
        borderRadius: 28,
        padding: 24,
        gap: 12,
    },
    avatarWrapper: {
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 120,
        height: 120,
    },
    addPhoto: {
        color: '#FF728D',
        marginTop: 8,
    },
    label: {
        fontWeight: '600',
        color: '#757575',
    },
    input: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0D5FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0D5FF',
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    segmentActive: {
        backgroundColor: '#FF728D',
    },
    segmentText: {
        color: '#A4A4A4',
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#FFF',
    },
    infoText: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
});

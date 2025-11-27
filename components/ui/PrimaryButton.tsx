import { Pressable, StyleSheet, Text } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

type ButtonProps = {
    label: string;
    onPress: () => void | Promise<void>;
    loading?: boolean;
};

export function PrimaryButton({ label, onPress, loading }: ButtonProps) {
    const disabled = Boolean(loading);
    const { t } = useLocalization();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                pressed && !disabled && styles.buttonPressed,
                disabled && styles.buttonDisabled,
            ]}>
            <Text style={styles.buttonLabel}>{loading ? t('common.saving') : label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        marginTop: 16,
        backgroundColor: '#FF5C8D',
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonLabel: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});

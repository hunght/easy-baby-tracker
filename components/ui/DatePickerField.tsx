import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@/localization/LocalizationProvider';

type DatePickerFieldProps = {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
};

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
    const [showPicker, setShowPicker] = useState(false);
    const { locale, t } = useLocalization();
    const dateFormatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
        [locale],
    );

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (selectedDate) {
            onChange(selectedDate);
        }

        if (Platform.OS === 'ios' && event.type === 'dismissed') {
            setShowPicker(false);
        }
    };

    const handleDone = () => {
        setShowPicker(false);
    };

    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <Pressable style={styles.dateField} onPress={() => setShowPicker(true)}>
                <Text style={styles.dateText}>{dateFormatter.format(value)}</Text>
            </Pressable>

            {showPicker && Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showPicker}
                    onRequestClose={handleDone}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Pressable onPress={handleDone}>
                                    <Text style={styles.modalDoneButton}>{t('common.done')}</Text>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                value={value}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {showPicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    label: {
        fontWeight: '600',
        color: '#757575',
    },
    dateField: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0D5FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalDoneButton: {
        color: '#FF5C8D',
        fontSize: 17,
        fontWeight: '600',
    },
});

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

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
    [locale]
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
      <Text className="font-semibold text-[#757575]">{label}</Text>
      <Pressable
        className="rounded-2xl border border-[#E0D5FF] bg-white px-4 py-3"
        onPress={() => setShowPicker(true)}>
        <Text className="text-base text-[#333]">{dateFormatter.format(value)}</Text>
      </Pressable>

      {showPicker && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={handleDone}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-[20px] bg-white pb-[34px]">
              <View className="flex-row justify-end border-b border-border p-4">
                <Pressable onPress={handleDone}>
                  <Text className="text-[17px] font-semibold text-accent">{t('common.done')}</Text>
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
        <DateTimePicker value={value} mode="date" display="default" onChange={handleDateChange} />
      )}
    </>
  );
}

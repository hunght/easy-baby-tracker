import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

import { BabyProfilePayload, Gender } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { DatePickerField } from './ui/DatePickerField';

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
    <View className="gap-3 rounded-3xl bg-violet-50 p-6">
      <Text className="text-center text-2xl font-bold text-neutral-900">{headerText}</Text>
      <View className="items-center">
        <Image source={require('@/assets/images/icon.png')} style={{ width: 120, height: 120 }} />
        <Text className="mt-2 text-pink-500">{t('common.addPhoto')}</Text>
      </View>

      <Text className="font-semibold text-neutral-600">{t('common.nickname')}</Text>
      <TextInput
        value={nickname}
        onChangeText={setNickname}
        className="rounded-2xl border border-violet-200 bg-white px-4 py-3"
        placeholder={t('common.nicknamePlaceholder')}
        placeholderTextColor="#C4C4C4"
      />

      <Text className="font-semibold text-neutral-600">{t('common.gender')}</Text>
      <View className="flex-row overflow-hidden rounded-2xl border border-violet-200 bg-white">
        {genderSegments.map((segment) => {
          const active = gender === segment.key;
          return (
            <Pressable
              key={segment.key}
              onPress={() => setGender(segment.key)}
              className={`flex-1 items-center py-2 ${active ? 'bg-pink-500' : ''}`}>
              <Text className={`font-semibold ${active ? 'text-white' : 'text-neutral-400'}`}>
                {t(segment.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <DatePickerField label={t('common.birthdate')} value={birthDate} onChange={setBirthDate} />

      <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />

      <Text className="text-xs leading-5 text-neutral-500">{t('onboarding.babyProfile.info')}</Text>

      <Button onPress={handleContinue} disabled={isSaving}>
        <Text>{t('common.continue')}</Text>
      </Button>
    </View>
  );
}

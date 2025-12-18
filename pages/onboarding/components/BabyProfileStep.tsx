import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { BabyProfilePayload, Gender } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { DatePickerField } from '@/components/DatePickerField';
import { useBrandColor } from '@/hooks/use-brand-color';

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
  const brandColors = useBrandColor();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}>
      <View
        className="gap-3 rounded-lg bg-card p-6"
        style={{ backgroundColor: brandColors.colors.lavender + '20' }}>
        <Text className="text-center text-2xl font-bold text-foreground">{headerText}</Text>
        <View className="items-center">
          <Image source={require('@/assets/images/icon.png')} style={{ width: 120, height: 120 }} />
          <Text className="mt-2 text-accent">{t('common.addPhoto')}</Text>
        </View>

        <Text className="font-semibold text-foreground">{t('common.nickname')}</Text>
        <Input
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('common.nicknamePlaceholder')}
        />

        <Text className="font-semibold text-foreground">{t('common.gender')}</Text>
        <View className="flex-row overflow-hidden rounded-lg border border-border bg-card">
          {genderSegments.map((segment) => {
            const active = gender === segment.key;
            return (
              <Pressable
                key={segment.key}
                onPress={() => setGender(segment.key)}
                className={`flex-1 items-center py-2 ${active ? 'bg-accent' : ''}`}>
                <Text
                  className={`font-semibold ${active ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                  {t(segment.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <DatePickerField label={t('common.birthdate')} value={birthDate} onChange={setBirthDate} />

        <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />

        <Text className="text-xs leading-5 text-muted-foreground">
          {t('onboarding.babyProfile.info')}
        </Text>

        <Button onPress={handleContinue} disabled={isSaving}>
          <Text>{t('common.continue')}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

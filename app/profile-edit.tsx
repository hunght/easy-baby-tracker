import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import {
  BABY_PROFILES_QUERY_KEY,
  BABY_PROFILE_QUERY_KEY,
  babyProfileByIdKey,
} from '@/constants/query-keys';
import {
  BabyProfilePayload,
  Gender,
  getBabyProfileById,
  saveBabyProfile,
} from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

const genderSegments: { key: Gender; labelKey: string }[] = [
  { key: 'unknown', labelKey: 'onboarding.babyProfile.genderOptions.unknown' },
  { key: 'boy', labelKey: 'onboarding.babyProfile.genderOptions.boy' },
  { key: 'girl', labelKey: 'onboarding.babyProfile.genderOptions.girl' },
];

export default function ProfileEditScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { babyId } = useLocalSearchParams<{ babyId?: string }>();
  const numericBabyId = babyId ? Number(babyId) : null;

  const { data: existingProfile, isLoading } = useQuery({
    queryKey: babyProfileByIdKey(numericBabyId ?? -1),
    queryFn: () => getBabyProfileById(numericBabyId!),
    enabled: numericBabyId != null && Number.isFinite(numericBabyId),
  });

  const [nickname, setNickname] = useState(t('common.nicknamePlaceholder'));
  const [gender, setGender] = useState<Gender>('unknown');
  const [birthDate, setBirthDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setGender(existingProfile.gender);
      setBirthDate(new Date(existingProfile.birthDate));
      setDueDate(new Date(existingProfile.dueDate));
    }
  }, [existingProfile]);

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const payload: BabyProfilePayload = {
        nickname,
        gender,
        birthDate: birthDate.toISOString(),
        dueDate: dueDate.toISOString(),
        concerns: existingProfile?.concerns ?? [],
      };

      await saveBabyProfile(payload, { babyId: numericBabyId ?? undefined });
      await queryClient.invalidateQueries({ queryKey: BABY_PROFILES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
      if (numericBabyId) {
        await queryClient.invalidateQueries({ queryKey: babyProfileByIdKey(numericBabyId) });
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && numericBabyId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-semibold text-primary">{t('common.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="pt-15 pb-10 px-6 gap-3"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-3 text-center text-3xl font-bold text-foreground">
          {numericBabyId ? t('profileEdit.editTitle') : t('profileEdit.createTitle')}
        </Text>
        <View className="mb-3 items-center">
          <Image source={require('@/assets/images/icon.png')} className="w-30 h-30" />
          <Text className="mt-2 text-accent">{t('common.addPhoto')}</Text>
        </View>

        <Label className="mt-2 font-semibold text-muted-foreground">{t('common.nickname')}</Label>
        <Input
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('common.nicknamePlaceholder')}
          className="mt-1"
        />

        <Label className="mt-2 font-semibold text-muted-foreground">{t('common.gender')}</Label>
        <View className="mt-1 flex-row overflow-hidden rounded-2xl border border-input bg-white">
          {genderSegments.map((segment) => (
            <Pressable
              key={segment.key}
              onPress={() => setGender(segment.key)}
              className={`flex-1 items-center py-2.5 ${gender === segment.key ? 'bg-accent' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: gender === segment.key }}>
              <Text
                className={`font-semibold ${gender === segment.key ? 'text-white' : 'text-muted-foreground'}`}>
                {t(segment.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <DatePickerField label={t('common.birthdate')} value={birthDate} onChange={setBirthDate} />

        <DatePickerField label={t('common.dueDate')} value={dueDate} onChange={setDueDate} />

        <Text className="mt-2 text-sm leading-tight text-muted-foreground">
          {t('profileEdit.info')}
        </Text>

        <Button
          variant="default"
          size="lg"
          onPress={handleSave}
          disabled={isSaving}
          className="mt-4 rounded-pill">
          <Text className="text-lg font-bold text-white">
            {isSaving
              ? t('common.saving')
              : numericBabyId
                ? t('common.saveChanges')
                : t('common.continue')}
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
}

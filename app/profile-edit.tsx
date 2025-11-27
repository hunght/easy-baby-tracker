import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DatePickerField } from '@/components/ui/DatePickerField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BABY_PROFILES_QUERY_KEY, BABY_PROFILE_QUERY_KEY, babyProfileByIdKey } from '@/constants/query-keys';
import { BabyProfilePayload, Gender, getBabyProfileById, saveBabyProfile } from '@/database/baby-profile';
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>
          {numericBabyId ? t('profileEdit.editTitle') : t('profileEdit.createTitle')}
        </Text>
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
          {t('profileEdit.info')}
        </Text>

        <PrimaryButton
          label={numericBabyId ? t('common.saveChanges') : t('common.continue')}
          onPress={handleSave}
          loading={isSaving}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F7',
  },
  loadingText: {
    color: '#FF5C8D',
    fontWeight: '600',
  },
  heading: {
    fontSize: 26,
    textAlign: 'center',
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
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
    marginTop: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0D5FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0D5FF',
    overflow: 'hidden',
    marginTop: 4,
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
    marginTop: 8,
  },
});


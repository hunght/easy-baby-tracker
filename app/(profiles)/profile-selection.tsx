import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles, setActiveBabyProfileId } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

export default function ProfileSelectionScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });

  const handleSelectProfile = async (babyId: number) => {
    await setActiveBabyProfileId(babyId);
    await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
    router.replace('/(tabs)/tracking');
  };

  const handleAddNew = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-pink-50">
        <ActivityIndicator size="large" color="#FF5C8D" />
        <Text className="font-semibold text-pink-500">{t('common.loadingProfiles')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-pink-50 px-6 pb-10 pt-20">
      <Text className="mb-2 text-center text-2xl font-bold text-neutral-900">
        {t('profileSelection.heading')}
      </Text>
      <Text className="mb-6 text-center text-base text-neutral-500">
        {t('profileSelection.subheading')}
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-4">
          {profiles.map((profile) => {
            const monthsOld = computeMonthsOld(profile.birthDate);
            return (
              <Pressable
                key={profile.id}
                onPress={() => handleSelectProfile(profile.id)}
                className="gap-1 rounded-2xl bg-card p-5"
                style={{
                  shadowColor: 'rgba(0, 0, 0, 0.05)',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 2,
                  elevation: 1,
                }}>
                <Text className="text-xl font-bold text-neutral-900">{profile.nickname}</Text>
                <Text className="text-base text-neutral-500">
                  {t('common.monthsOld', { params: { count: monthsOld } })}
                </Text>
                {profile.concerns.length > 0 && (
                  <Text className="mt-1 text-sm text-neutral-500">
                    {t('profileSelection.focusPrefix')}: {profile.concerns.slice(0, 2).join(', ')}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Button className="mt-4" onPress={handleAddNew}>
        <Text>{t('common.addAnotherChild')}</Text>
      </Button>
    </View>
  );
}

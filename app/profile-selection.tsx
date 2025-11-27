import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles, setActiveBabyProfileId } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
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
    router.replace('/(tabs)');
  };

  const handleAddNew = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5C8D" />
        <Text style={styles.loadingText}>{t('common.loadingProfiles')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('profileSelection.heading')}</Text>
      <Text style={styles.subheading}>{t('profileSelection.subheading')}</Text>
      <ScrollView contentContainerStyle={styles.profilesList} showsVerticalScrollIndicator={false}>
        {profiles.map((profile) => {
          const monthsOld = computeMonthsOld(profile.birthDate);
          return (
            <Pressable key={profile.id} style={styles.profileCard} onPress={() => handleSelectProfile(profile.id)}>
              <Text style={styles.profileName}>{profile.nickname}</Text>
              <Text style={styles.profileAge}>{t('common.monthsOld', { params: { count: monthsOld } })}</Text>
              {profile.concerns.length > 0 && (
                <Text style={styles.profileConcerns}>
                  {t('profileSelection.focusPrefix')}: {profile.concerns.slice(0, 2).join(', ')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.addButton} onPress={handleAddNew}>
        <Text style={styles.addButtonText}>{t('common.addAnotherChild')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F7',
    gap: 12,
  },
  loadingText: {
    color: '#FF5C8D',
    fontWeight: '600',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#8B8B8B',
    marginBottom: 24,
    textAlign: 'center',
  },
  profilesList: {
    gap: 16,
    paddingBottom: 16,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    gap: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  profileAge: {
    fontSize: 16,
    color: '#8B8B8B',
  },
  profileConcerns: {
    fontSize: 14,
    color: '#8B8B8B',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#FF5C8D',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});


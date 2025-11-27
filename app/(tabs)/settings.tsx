import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

export default function SettingsScreen() {
  const { t, locale, setLocale, availableLocales } = useLocalization();
  const router = useRouter();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5C8D" />
        <Text style={styles.loadingText}>{t('common.loadingProfiles')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TabPageHeader
        title={t('settings.title')}
        subtitle={t('settings.description')}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profilesList}>
          {profiles.map((profile) => {
            const monthsOld = computeMonthsOld(profile.birthDate);
            return (
              <Pressable
                key={profile.id}
                style={styles.profileCard}
                onPress={() =>
                  router.push({ pathname: '/profile-edit', params: { babyId: profile.id.toString() } })
                }>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.nickname}</Text>
                  <Text style={styles.profileAge}>
                    {t('common.monthsOld', { params: { count: monthsOld } })}
                  </Text>
                </View>
                <Text style={styles.editText}>{`${t('settings.edit')} →`}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.addButton}
            onPress={() => router.push({ pathname: '/profile-edit', params: {} })}>
            <Text style={styles.addButtonText}>{t('common.addNewBaby')}</Text>
          </Pressable>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.languageTitle}>{t('settings.languageTitle')}</Text>
          <Text style={styles.languageSubtitle}>{t('settings.languageSubtitle')}</Text>
          <View style={styles.languageOptions}>
            {availableLocales.map((language) => {
              const isActive = locale === language.code;
              return (
                <Pressable
                  key={language.code}
                  onPress={() => setLocale(language.code)}
                  style={[styles.languageButton, isActive && styles.languageButtonActive]}>
                  <Text style={[styles.languageButtonText, isActive && styles.languageButtonTextActive]}>
                    {language.code === 'en' ? t('settings.english') : t('settings.vietnamese')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F2FF',
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F2FF',
    gap: 12,
  },
  loadingText: {
    color: '#FF5C8D',
    fontWeight: '600',
  },
  profilesList: {
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  profileAge: {
    fontSize: 16,
    color: '#8B8B8B',
  },
  editText: {
    fontSize: 16,
    color: '#FF5C8D',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FF5C8D',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  languageSection: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#FF5C8D',
    borderColor: '#FF5C8D',
  },
  languageButtonText: {
    fontWeight: '600',
    color: '#8B8B8B',
  },
  languageButtonTextActive: {
    color: '#FFF',
  },
});


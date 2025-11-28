import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/ThemeContext';

import { TabPageHeader } from '@/components/TabPageHeader';
import { BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

export default function SettingsScreen() {
  const { t, locale, setLocale, availableLocales } = useLocalization();
  const { themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator size="large" />
        <Text className="font-semibold text-primary">{t('common.loadingProfiles')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('settings.title')} subtitle={t('settings.description')} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-10 gap-6"
        showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {profiles.map((profile) => {
            const monthsOld = computeMonthsOld(profile.birthDate);
            return (
              <Pressable
                key={profile.id}
                className="flex-row items-center justify-between rounded-2xl bg-card p-5 shadow-sm"
                onPress={() =>
                  router.push({
                    pathname: '/profile-edit',
                    params: { babyId: profile.id.toString() },
                  })
                }>
                <View className="flex-1 gap-1">
                  <Text className="text-xl font-extrabold text-foreground">{profile.nickname}</Text>
                  <Text className="text-base text-muted-foreground">
                    {t('common.monthsOld', { params: { count: monthsOld } })}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-primary">{`${t('settings.edit')} →`}</Text>
              </Pressable>
            );
          })}
          <Button
            className="mt-2 rounded-3xl"
            onPress={() => router.push({ pathname: '/profile-edit', params: {} })}>
            <Text className="text-[17px] font-bold text-primary-foreground">
              {t('common.addNewBaby')}
            </Text>
          </Button>
        </View>

        <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
          <Text className="text-lg font-extrabold text-foreground">{t('settings.themeTitle')}</Text>
          <Text className="text-sm text-muted-foreground">{t('settings.themeSubtitle')}</Text>
          <View className="flex-row gap-3">
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const isActive = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  className={[
                    'flex-1 items-center rounded-xl border py-3',
                    isActive ? 'border-primary bg-primary' : 'border-border bg-background',
                  ].join(' ')}>
                  <Text
                    className={
                      isActive
                        ? 'font-semibold text-primary-foreground'
                        : 'font-semibold text-muted-foreground'
                    }>
                    {mode === 'system'
                      ? t('settings.themeSystem')
                      : mode === 'light'
                        ? t('settings.themeLight')
                        : t('settings.themeDark')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
          <Text className="text-lg font-extrabold text-foreground">
            {t('settings.languageTitle')}
          </Text>
          <Text className="text-sm text-muted-foreground">{t('settings.languageSubtitle')}</Text>
          <View className="flex-row gap-3">
            {availableLocales.map((language) => {
              const isActive = locale === language.code;
              return (
                <Pressable
                  key={language.code}
                  onPress={() => setLocale(language.code)}
                  className={[
                    'flex-1 items-center rounded-xl border py-3',
                    isActive ? 'border-primary bg-primary' : 'border-border bg-background',
                  ].join(' ')}>
                  <Text
                    className={
                      isActive
                        ? 'font-semibold text-primary-foreground'
                        : 'font-semibold text-muted-foreground'
                    }>
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

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TabPageHeader } from '@/components/TabPageHeader';
import { useTheme } from '@/lib/ThemeContext';

import { BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles } from '@/database/baby-profile';
import type { Locale } from '@/localization/translations';
import { useLocalization } from '@/localization/LocalizationProvider';

// Theme mode options
const themeModes: readonly ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];

// Zod schema for theme mode validation
const themeModeSchema = z.enum(['system', 'light', 'dark']);

// Type guard using Zod validation
function isThemeMode(value: unknown): value is 'system' | 'light' | 'dark' {
  return themeModeSchema.safeParse(value).success;
}

// Zod schema for Locale validation
const localeSchema = z.enum(['en', 'vi']);

// Type guard using Zod validation
function isLocale(value: unknown): value is Locale {
  return localeSchema.safeParse(value).success;
}

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
                className="flex-row items-center justify-between rounded-lg bg-card p-5 shadow-sm"
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
            className="mt-2 rounded-pill"
            onPress={() => router.push({ pathname: '/(profiles)/profile-edit', params: {} })}>
            <Text className="text-[17px] font-bold text-primary-foreground">
              {t('common.addNewBaby')}
            </Text>
          </Button>
        </View>

        <View className="gap-3 rounded-lg bg-card p-5 shadow-sm">
          <Text className="text-lg font-extrabold text-foreground">{t('settings.themeTitle')}</Text>
          <Text className="text-sm text-muted-foreground">{t('settings.themeSubtitle')}</Text>
          <ToggleGroup
            type="single"
            value={themeMode}
            onValueChange={(value) => {
              if (value && isThemeMode(value)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode(value);
              }
            }}
            variant="outline"
            className="w-full">
            {themeModes.map((mode, index) => (
              <ToggleGroupItem
                key={mode}
                value={mode}
                isFirst={index === 0}
                isLast={index === themeModes.length - 1}
                className="flex-1"
                aria-label={
                  mode === 'system'
                    ? t('settings.themeSystem')
                    : mode === 'light'
                      ? t('settings.themeLight')
                      : t('settings.themeDark')
                }>
                <Text className="font-semibold">
                  {mode === 'system'
                    ? t('settings.themeSystem')
                    : mode === 'light'
                      ? t('settings.themeLight')
                      : t('settings.themeDark')}
                </Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </View>

        <View className="gap-3 rounded-lg bg-card p-5 shadow-sm">
          <Text className="text-lg font-extrabold text-foreground">
            {t('settings.languageTitle')}
          </Text>
          <Text className="text-sm text-muted-foreground">{t('settings.languageSubtitle')}</Text>
          <ToggleGroup
            type="single"
            value={locale}
            onValueChange={(value) => {
              if (value && isLocale(value)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLocale(value);
              }
            }}
            variant="outline"
            className="w-full">
            {availableLocales.map((language, index) => (
              <ToggleGroupItem
                key={language.code}
                value={language.code}
                isFirst={index === 0}
                isLast={index === availableLocales.length - 1}
                className="flex-1"
                aria-label={language.label}>
                <Text className="font-semibold">
                  {language.code === 'en' ? t('settings.english') : t('settings.vietnamese')}
                </Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </View>
      </ScrollView>
    </View>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import { z } from 'zod';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TabPageHeader } from '@/components/TabPageHeader';
import { useNotification } from '@/components/NotificationContext';
import { useTheme } from '@/lib/ThemeContext';

import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getBabyProfiles, getActiveBabyProfile, setActiveBabyProfileId } from '@/database/baby-profile';
import type { Locale } from '@/localization/translations';
import { useLocalization } from '@/localization/LocalizationProvider';
import { FeatureKey, useFeatureFlags } from '@/context/FeatureFlagContext';

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
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
  });

  const { data: currentProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
  });

  const { features, toggleFeature } = useFeatureFlags();

  const setActiveBabyMutation = useMutation({
    mutationFn: async (babyId: number) => {
      await setActiveBabyProfileId(babyId);
    },
    onSuccess: (_, babyId) => {
      queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BABY_PROFILES_QUERY_KEY });
      const profile = profiles.find((p) => p.id === babyId);
      showNotification(
        profile
          ? `${profile.nickname} is now active`
          : t('settings.profileUpdated', { defaultValue: 'Profile updated' }),
        'success'
      );
    },
  });

  const [activeTab, setActiveTab] = useState<'baby' | 'features' | 'system'>('baby');

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'baby', label: t('settings.tabs.baby', { defaultValue: 'Baby' }) },
    { key: 'features', label: t('settings.tabs.features', { defaultValue: 'Features' }) },
    { key: 'system', label: t('settings.tabs.system', { defaultValue: 'System' }) },
  ];

  const handleTabChange = (value: string) => {
    if (value === 'baby' || value === 'features' || value === 'system') {
      Haptics.selectionAsync();
      setActiveTab(value);
    }
  };

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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
        <View className="px-6 py-4">
          <TabsList className="w-full">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex-1">
                <Text>{tab.label}</Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-10 gap-6"
          showsVerticalScrollIndicator={false}>
          {/* Baby Tab */}
          <TabsContent value="baby" className="gap-4">
            <View className="gap-4">
              {profiles.map((profile) => {
                const monthsOld = computeMonthsOld(profile.birthDate);
                const isActive = currentProfile?.id === profile.id;
                return (
                  <View
                    key={profile.id}
                    className="rounded-2xl bg-card p-5"
                    style={{
                      shadowColor: 'rgba(0, 0, 0, 0.05)',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 1,
                      shadowRadius: 2,
                      elevation: 1,
                    }}>
                    <Pressable
                      className="flex-row items-center justify-between active:opacity-90"
                      onPress={() =>
                        router.push({
                          pathname: '/profile-edit',
                          params: { babyId: profile.id.toString() },
                        })
                      }>
                      <View className="flex-1 gap-1">
                        <Text className="text-xl font-extrabold text-foreground">
                          {profile.nickname}
                        </Text>
                        <Text className="text-base text-muted-foreground">
                          {t('common.monthsOld', { params: { count: monthsOld } })}
                        </Text>
                      </View>
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                        <Text className="text-xl text-primary">
                          {/* Chevron right character or icon */}
                          {`\u203A`}
                        </Text>
                      </View>
                    </Pressable>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveBabyMutation.mutate(profile.id);
                      }}
                      disabled={isActive || setActiveBabyMutation.isPending}
                      className="mt-3">
                      <Text className={isActive ? 'text-primary-foreground' : 'text-foreground'}>
                        {isActive
                          ? t('settings.activeProfile', { defaultValue: 'Active' })
                          : t('settings.setAsActive', { defaultValue: 'Set as Active' })}
                      </Text>
                    </Button>
                  </View>
                );
              })}

              {/* Sticky-like Add Button at bottom of list */}
              <Pressable
                className="mt-2 flex-row items-center justify-center gap-2 rounded-full bg-primary py-4 active:opacity-90"
                onPress={() => router.push({ pathname: '/(profiles)/profile-edit', params: {} })}>
                <Text className="text-lg font-bold text-primary-foreground">
                  {t('common.addNewBaby')}
                </Text>
              </Pressable>
            </View>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
              <View className="mb-2">
                <Text className="text-lg font-extrabold text-foreground">
                  {t('settings.featuresTitle')}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {t('settings.featuresSubtitle')}
                </Text>
              </View>
              <View className="gap-1">
                {Object.keys(features)
                  .filter((k): k is FeatureKey => k in features)
                  .map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        toggleFeature(key);
                      }}
                      className="flex-row items-center justify-between py-3 active:opacity-70">
                      <View className="flex-row items-center gap-3">
                        {/* Checkbox-like indicator on left? Or just text. Guidelines say toggle on right, label left. */}
                        <Text className="text-lg font-medium capitalize text-foreground">
                          {t(`tracking.tiles.${key}.label`, { defaultValue: key })}
                        </Text>
                      </View>
                      <Switch
                        value={features[key]}
                        onValueChange={() => {
                          Haptics.selectionAsync();
                          toggleFeature(key);
                        }}
                        trackColor={{ false: '#767577', true: '#FF5C8D' }}
                        thumbColor={'#f4f3f4'}
                        // Make switch ignore touches so the row handles it?
                        // Actually better to let switch handle its own interaction for a11y,
                        // but user asked for "Make entire row tappable" in guidelines.
                        pointerEvents="none"
                      />
                    </Pressable>
                  ))}
              </View>
            </View>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <View className="gap-6">
              {/* Theme Section */}
              <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
                <View className="mb-2">
                  <Text className="text-lg font-extrabold text-foreground">
                    {t('settings.themeTitle')}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {t('settings.themeSubtitle')}
                  </Text>
                </View>
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

              {/* Language Section */}
              <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
                <View className="mb-2">
                  <Text className="text-lg font-extrabold text-foreground">
                    {t('settings.languageTitle')}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {t('settings.languageSubtitle')}
                  </Text>
                </View>
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
            </View>
          </TabsContent>
        </ScrollView>
      </Tabs>
    </View>
  );
}

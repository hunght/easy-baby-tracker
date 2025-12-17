import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BabyProfileRecord } from '@/database/baby-profile';
import { GrowthRecord } from '@/database/growth';
import { useLocalization } from '@/localization/LocalizationProvider';
import { formatNumber } from '@/lib/format';
import { computeMonthsOld } from '@/lib/tracking-utils';

type Props = {
  profile: BabyProfileRecord;
  latestGrowthRecord?: GrowthRecord | null;
  previousGrowthRecord?: GrowthRecord | null;
};

export function BabyInfoBanner({
  profile,
  latestGrowthRecord,
  previousGrowthRecord: _previousGrowthRecord,
}: Props) {
  const { t } = useLocalization();
  const router = useRouter();

  const isBoy = profile.gender === 'boy';
  const isGirl = profile.gender === 'girl';

  // Compute theme colors
  const containerClass = isBoy
    ? 'bg-blue-50 border-blue-200'
    : isGirl
      ? 'bg-pink-50 border-pink-200'
      : 'bg-gray-50 border-gray-200';

  const textClass = isBoy ? 'text-blue-900' : isGirl ? 'text-pink-900' : 'text-gray-900';

  const subtextClass = isBoy ? 'text-blue-700' : isGirl ? 'text-pink-700' : 'text-gray-700';

  const iconColor = isBoy ? '#3B82F6' : isGirl ? '#EC4899' : '#6B7280';

  const currentMonths = computeMonthsOld(profile.birthDate);
  const birthDate = new Date(profile.birthDate).toLocaleDateString();

  const handlePressGrowth = () => {
    router.push('/(tracking)/growth');
  };

  const handlePressDiary = () => {
    router.push('/(tracking)/diary-list');
  };

  const handleViewPhoto = () => {
    if (profile.avatarUri) {
      const params = new URLSearchParams({ uri: profile.avatarUri, title: profile.nickname });
      router.push(`/(tracking)/photo-viewer?${params.toString()}`);
    }
  };

  return (
    <View className={`mx-6 mb-6 rounded-3xl border p-5 ${containerClass}`}>
      <View className="flex-row items-start justify-between">
        {/* Baby Info */}
        <View className="flex-1">
          <View className="mb-4 flex-row items-center gap-4">
            <Pressable
              onPress={profile.avatarUri ? handleViewPhoto : undefined}
              disabled={!profile.avatarUri}
              className={`h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm`}>
              {profile.avatarUri ? (
                <Image
                  key={profile.avatarUri}
                  source={{ uri: profile.avatarUri }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                  cachePolicy="none"
                />
              ) : profile.gender === 'boy' ? (
                <MaterialCommunityIcons name="face-man-profile" size={36} color={iconColor} />
              ) : profile.gender === 'girl' ? (
                <MaterialCommunityIcons name="face-woman-profile" size={36} color={iconColor} />
              ) : (
                <MaterialCommunityIcons name="face-man-profile" size={36} color={iconColor} />
              )}
            </Pressable>
            <View>
              <Text className={`text-2xl font-bold ${textClass}`}>{profile.nickname}</Text>
              <Text className={`text-base font-medium ${subtextClass}`}>
                {currentMonths} {t('common.monthsAbbrev', { defaultValue: 'months' })} old
              </Text>
            </View>
          </View>

          <View className="flex-row gap-6">
            <View>
              <Text className={`text-xs font-medium uppercase opacity-60 ${subtextClass}`}>
                {t('common.birthDate', { defaultValue: 'Born' })}
              </Text>
              <Text className={`font-semibold ${textClass}`}>{birthDate}</Text>
            </View>
            {profile.dueDate && (
              <View>
                <Text className={`text-xs font-medium uppercase opacity-60 ${subtextClass}`}>
                  {t('common.dueDate', { defaultValue: 'Due' })}
                </Text>
                <Text className={`font-semibold ${textClass}`}>
                  {new Date(profile.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Diary Button */}
        <Pressable
          onPress={handlePressDiary}
          className="items-center justify-center rounded-full p-2 active:opacity-70"
          accessibilityLabel={t('tracking.tiles.diary.label')}
          accessibilityRole="button">
          <MaterialCommunityIcons name="notebook-outline" size={28} color={iconColor} />
        </Pressable>
      </View>

      <View className="my-4 h-[1px] w-full bg-black/5" />

      {/* Growth Snippet */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className={`mb-1 text-xs font-bold uppercase tracking-wider opacity-60 ${subtextClass}`}>
            {t('tracking.tiles.growth.label')}
          </Text>
          {latestGrowthRecord ? (
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              {latestGrowthRecord.weightKg && (
                <Text className={`text-lg font-bold ${textClass}`}>
                  {formatNumber(latestGrowthRecord.weightKg, 2)} kg
                </Text>
              )}
              {latestGrowthRecord.heightCm && (
                <Text className={`text-lg font-bold ${textClass}`}>
                  {formatNumber(latestGrowthRecord.heightCm, 1)} cm
                </Text>
              )}
              {!latestGrowthRecord.weightKg && !latestGrowthRecord.heightCm && (
                <Text className={`text-sm italic ${subtextClass}`}>
                  {t('tracking.tiles.growth.sublabel', { defaultValue: 'No recent data' })}
                </Text>
              )}
            </View>
          ) : (
            <Text className={`text-sm italic ${subtextClass}`}>
              {t('tracking.tiles.growth.sublabel', { defaultValue: 'No data yet' })}
            </Text>
          )}
        </View>

        <Pressable
          onPress={handlePressGrowth}
          className="flex-row items-center gap-1 rounded-full bg-white/60 px-3 py-1.5 active:bg-white/80"
          accessibilityLabel={t('tracking.tiles.growth.add')}
          accessibilityRole="button">
          <Ionicons name="add" size={16} color={iconColor} />
          <Text className={`text-sm font-bold ${textClass}`}>
            {t('common.add', { defaultValue: 'Add' })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import {
  getActiveBabyProfile,
  getBabyProfiles,
  setActiveBabyProfileId,
} from '@/database/baby-profile';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';

const trackingTiles: readonly {
  id: string;
  labelKey: string;
  sublabelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorKey: 'accent' | 'info' | 'lavender' | 'mint' | 'secondary' | 'primary';
}[] = [
  {
    id: 'feeding',
    labelKey: 'tracking.tiles.feeding.label',
    sublabelKey: 'tracking.tiles.feeding.sublabel',
    icon: 'baby-bottle-outline',
    colorKey: 'accent',
  },
  {
    id: 'pumping',
    labelKey: 'tracking.tiles.pumping.label',
    sublabelKey: 'tracking.tiles.pumping.sublabel',
    icon: 'bottle-tonic-outline',
    colorKey: 'accent',
  },
  {
    id: 'diaper',
    labelKey: 'tracking.tiles.diaper.label',
    sublabelKey: 'tracking.tiles.diaper.sublabel',
    icon: 'baby-face-outline',
    colorKey: 'info',
  },
  {
    id: 'sleep',
    labelKey: 'tracking.tiles.sleep.label',
    sublabelKey: 'tracking.tiles.sleep.sublabel',
    icon: 'sleep',
    colorKey: 'lavender',
  },
  {
    id: 'habit',
    labelKey: 'tracking.tiles.habit.label',
    sublabelKey: 'tracking.tiles.habit.sublabel',
    icon: 'toothbrush-paste',
    colorKey: 'lavender',
  },
  {
    id: 'health',
    labelKey: 'tracking.tiles.health.label',
    sublabelKey: 'tracking.tiles.health.sublabel',
    icon: 'stethoscope',
    colorKey: 'mint',
  },
  {
    id: 'growth',
    labelKey: 'tracking.tiles.growth.label',
    sublabelKey: 'tracking.tiles.growth.sublabel',
    icon: 'human-male-height',
    colorKey: 'secondary',
  },
  {
    id: 'diary',
    labelKey: 'tracking.tiles.diary.label',
    sublabelKey: 'tracking.tiles.diary.sublabel',
    icon: 'notebook',
    colorKey: 'secondary',
  },
];

export default function TrackingScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const brandColors = useBrandColor();
  const [switchingBabyId, setSwitchingBabyId] = useState<number | null>(null);
  const { data: profile, isLoading } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });
  const { data: babyProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: BABY_PROFILES_QUERY_KEY,
    queryFn: getBabyProfiles,
    staleTime: 30 * 1000,
  });

  // Redirect to onboarding if no profile exists, or to profile selection if profiles exist but none is active
  useEffect(() => {
    if (!isLoading && !profilesLoading) {
      if (!profile) {
        if (babyProfiles.length > 0) {
          router.replace('/(profiles)/profile-selection');
        } else {
          router.replace('/');
        }
      }
    }
  }, [profile, isLoading, profilesLoading, babyProfiles.length, router]);

  if (isLoading || profilesLoading || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-semibold text-primary">{t('tracking.loading')}</Text>
      </View>
    );
  }

  const displayBabies = babyProfiles.length > 0 ? babyProfiles : [profile];

  const handleSelectBaby = async (babyId: number) => {
    if (babyId === profile.id || switchingBabyId != null) {
      return;
    }

    setSwitchingBabyId(babyId);
    try {
      await setActiveBabyProfileId(babyId);
      await queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
    } finally {
      setSwitchingBabyId(null);
    }
  };

  const handleTilePress = (tileId: string) => {
    if (tileId === 'feeding') {
      router.push('/(tracking)/feeding');
    } else if (tileId === 'pumping') {
      router.push('/(tracking)/pumping');
    } else if (tileId === 'diaper') {
      router.push('/(tracking)/diaper');
    } else if (tileId === 'sleep') {
      router.push('/(tracking)/sleep');
    } else if (tileId === 'health') {
      router.push('/(tracking)/health');
    } else if (tileId === 'growth') {
      router.push('/(tracking)/growth');
    } else if (tileId === 'habit') {
      router.push('/(tracking)/habit');
    } else if (tileId === 'diary') {
      router.push('/(tracking)/diary');
    }
  };

  const currentMonths = computeMonthsOld(profile.birthDate);
  const BabySelector = (
    <Select
      value={{ value: profile.id.toString(), label: profile.nickname }}
      onValueChange={(option) => {
        if (option?.value) {
          const babyId = parseInt(option.value, 10);
          if (!isNaN(babyId) && babyId !== profile.id) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleSelectBaby(babyId);
          }
        }
      }}>
      <SelectTrigger className="w-32 py-2">
        <SelectValue
          className="text-sm font-semibold text-foreground"
          placeholder={t('tracking.selectBaby', { defaultValue: 'Select baby' })}>
          {profile.nickname} ({currentMonths}
          {t('common.monthsAbbrev', { defaultValue: 'mo' })})
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-48">
        <SelectGroup>
          {displayBabies.map((baby) => {
            const months = computeMonthsOld(baby.birthDate);
            return (
              <SelectItem
                key={baby.id}
                value={baby.id.toString()}
                label={`${baby.nickname} (${months}${t('common.monthsAbbrev', { defaultValue: 'mo' })})`}>
                <Text className="text-sm">
                  {baby.nickname} ({months}
                  {t('common.monthsAbbrev', { defaultValue: 'mo' })})
                </Text>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('tabs.tracking')} accessory={BabySelector} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-2 pb-20 gap-6"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {trackingTiles.map((tile) => (
            <Card
              key={tile.id}
              className="w-[47%] py-2 shadow-sm"
              onPress={() => handleTilePress(tile.id)}
              testID={`tile-${tile.id}`}
              accessibilityLabel={t('tracking.accessibility.openTile', {
                defaultValue: 'Open %{label}',
                params: { label: t(tile.labelKey) },
              })}
              accessibilityRole="button">
              <CardContent className="gap-2.5 p-2">
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons
                    name={tile.icon}
                    size={34}
                    color={brandColors.get(tile.colorKey)}
                  />
                  <Text className="text-lg font-bold text-foreground">{t(tile.labelKey)}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">{t(tile.sublabelKey)}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

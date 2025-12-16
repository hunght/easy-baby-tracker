import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
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
import {
  BABY_PROFILE_QUERY_KEY,
  BABY_PROFILES_QUERY_KEY,
  DIAPER_CHANGES_QUERY_KEY,
  FEEDINGS_QUERY_KEY,
  GROWTH_RECORDS_QUERY_KEY,
  PUMPINGS_QUERY_KEY,
  SLEEP_SESSIONS_QUERY_KEY,
  BABY_HABITS_QUERY_KEY,
  HABIT_LOGS_QUERY_KEY,
} from '@/constants/query-keys';
import {
  getActiveBabyProfile,
  getBabyProfiles,
  setActiveBabyProfileId,
} from '@/database/baby-profile';
import { getDiaperChanges } from '@/database/diaper';
import { getFeedings } from '@/database/feeding';
import { getGrowthRecords, type GrowthRecord } from '@/database/growth';
import { getPumpings } from '@/database/pumping';
import { getSleepSessions } from '@/database/sleep';
import { getBabyHabits, getTodayHabitLogs } from '@/database/habits';
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
  const { startOfToday, endOfToday } = useMemo(() => computeTodayRange(), []);
  const { startOfYesterday, endOfYesterday } = useMemo(
    () => computeYesterdayRange(startOfToday),
    [startOfToday]
  );
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
  const { data: feedingsToday = [] } = useQuery({
    queryKey: [...FEEDINGS_QUERY_KEY, 'today', startOfToday, endOfToday],
    queryFn: () =>
      getFeedings({
        startDate: startOfToday,
        endDate: endOfToday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: feedingsYesterday = [] } = useQuery({
    queryKey: [...FEEDINGS_QUERY_KEY, 'yesterday', startOfYesterday, endOfYesterday],
    queryFn: () =>
      getFeedings({
        startDate: startOfYesterday,
        endDate: endOfYesterday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: pumpingsToday = [] } = useQuery({
    queryKey: [...PUMPINGS_QUERY_KEY, 'today', startOfToday, endOfToday],
    queryFn: () =>
      getPumpings({
        startDate: startOfToday,
        endDate: endOfToday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: pumpingsYesterday = [] } = useQuery({
    queryKey: [...PUMPINGS_QUERY_KEY, 'yesterday', startOfYesterday, endOfYesterday],
    queryFn: () =>
      getPumpings({
        startDate: startOfYesterday,
        endDate: endOfYesterday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: sleepSessionsToday = [] } = useQuery({
    queryKey: [...SLEEP_SESSIONS_QUERY_KEY, 'today', startOfToday, endOfToday],
    queryFn: () =>
      getSleepSessions({
        startDate: startOfToday,
        endDate: endOfToday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: sleepSessionsYesterday = [] } = useQuery({
    queryKey: [...SLEEP_SESSIONS_QUERY_KEY, 'yesterday', startOfYesterday, endOfYesterday],
    queryFn: () =>
      getSleepSessions({
        startDate: startOfYesterday,
        endDate: endOfYesterday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: diapersToday = [] } = useQuery({
    queryKey: [...DIAPER_CHANGES_QUERY_KEY, 'today', startOfToday, endOfToday],
    queryFn: () =>
      getDiaperChanges({
        startDate: startOfToday,
        endDate: endOfToday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: diapersYesterday = [] } = useQuery({
    queryKey: [...DIAPER_CHANGES_QUERY_KEY, 'yesterday', startOfYesterday, endOfYesterday],
    queryFn: () =>
      getDiaperChanges({
        startDate: startOfYesterday,
        endDate: endOfYesterday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: growthToday = [] } = useQuery({
    queryKey: [...GROWTH_RECORDS_QUERY_KEY, 'today', startOfToday, endOfToday],
    queryFn: () =>
      getGrowthRecords({
        startDate: startOfToday,
        endDate: endOfToday,
      }),
    staleTime: 30 * 1000,
  });
  const { data: growthYesterday = [] } = useQuery({
    queryKey: [...GROWTH_RECORDS_QUERY_KEY, 'yesterday', startOfYesterday, endOfYesterday],
    queryFn: () =>
      getGrowthRecords({
        startDate: startOfYesterday,
        endDate: endOfYesterday,
      }),
    staleTime: 30 * 1000,
  });

  // Habits queries
  const { data: babyHabits = [] } = useQuery({
    queryKey: [BABY_HABITS_QUERY_KEY, profile?.id],
    queryFn: () => (profile?.id ? getBabyHabits(profile.id) : []),
    enabled: !!profile?.id,
    staleTime: 30 * 1000,
  });
  const { data: todayHabitLogs = [] } = useQuery({
    queryKey: [HABIT_LOGS_QUERY_KEY, 'today', profile?.id],
    queryFn: () => (profile?.id ? getTodayHabitLogs(profile.id) : []),
    enabled: !!profile?.id,
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

  // Compute tile sublabels - must be before early return to satisfy React Hooks rules
  const tileSublabels = useMemo(() => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const totalBottleMl = sum(
      feedingsToday.filter((f) => f.type === 'bottle').map((f) => f.amountMl ?? 0)
    );
    const totalBottleMlYesterday = sum(
      feedingsYesterday.filter((f) => f.type === 'bottle').map((f) => f.amountMl ?? 0)
    );
    const totalNursingMinutes = roundMinutes(
      sum(
        feedingsToday
          .filter((f) => f.type === 'breast')
          .map((f) => (f.leftDuration ?? 0) + (f.rightDuration ?? 0))
      )
    );
    const totalNursingMinutesYesterday = roundMinutes(
      sum(
        feedingsYesterday
          .filter((f) => f.type === 'breast')
          .map((f) => (f.leftDuration ?? 0) + (f.rightDuration ?? 0))
      )
    );
    const totalPumpedMl = sum(pumpingsToday.map((p) => p.amountMl ?? 0));
    const totalPumpedMlYesterday = sum(pumpingsYesterday.map((p) => p.amountMl ?? 0));
    const lastPumping = maxTimestamp(pumpingsToday.map((p) => p.startTime));
    const lastPumpingAgo = lastPumping != null ? formatTimeAgo(nowSeconds - lastPumping) : null;
    const totalSleepSeconds = sum(sleepSessionsToday.map((s) => s.duration ?? 0));
    const totalSleepSecondsYesterday = sum(sleepSessionsYesterday.map((s) => s.duration ?? 0));
    const longestSleepSeconds = maxTimestamp(sleepSessionsToday.map((s) => s.duration ?? 0));
    const longestSleepText =
      longestSleepSeconds != null && longestSleepSeconds > 0
        ? formatDuration(longestSleepSeconds)
        : null;
    const wetCount = diapersToday.filter((d) => d.kind === 'wet').length;
    const dirtyCount = diapersToday.filter((d) => d.kind === 'soiled').length;
    const mixedCount = diapersToday.filter((d) => d.kind === 'mixed').length;
    const wetCountYesterday = diapersYesterday.filter((d) => d.kind === 'wet').length;
    const dirtyCountYesterday = diapersYesterday.filter((d) => d.kind === 'soiled').length;
    const mixedCountYesterday = diapersYesterday.filter((d) => d.kind === 'mixed').length;
    const lastDiaperTime = maxTimestamp(diapersToday.map((d) => d.time));
    const lastDiaperAgo =
      lastDiaperTime != null ? formatTimeAgo(nowSeconds - lastDiaperTime) : null;
    const diaperCounts =
      wetCount + dirtyCount + mixedCount > 0
        ? `Wet ${wetCount} · Dirty ${dirtyCount} · Mixed ${mixedCount}`
        : null;
    const diaperYesterdayCounts =
      wetCountYesterday + dirtyCountYesterday + mixedCountYesterday > 0
        ? `y: W ${wetCountYesterday}/D ${dirtyCountYesterday}/M ${mixedCountYesterday}`
        : null;
    const diaperDeltaTotal =
      wetCount +
      dirtyCount +
      mixedCount -
      (wetCountYesterday + dirtyCountYesterday + mixedCountYesterday);
    const latestGrowthToday = latestGrowth(growthToday);
    const latestGrowthYesterday = latestGrowth(growthYesterday);
    const growthParts: string[] = [];
    if (latestGrowthToday?.weightKg != null) {
      const delta =
        latestGrowthYesterday?.weightKg != null
          ? formatDeltaNumber(latestGrowthToday.weightKg - latestGrowthYesterday.weightKg, 'kg', 2)
          : null;
      growthParts.push(
        `Wt ${formatNumber(latestGrowthToday.weightKg, 2)}kg${delta && delta !== '0' ? ` (${delta})` : ''}`
      );
    }
    if (latestGrowthToday?.heightCm != null) {
      const delta =
        latestGrowthYesterday?.heightCm != null
          ? formatDeltaNumber(latestGrowthToday.heightCm - latestGrowthYesterday.heightCm, 'cm', 1)
          : null;
      growthParts.push(
        `Ht ${formatNumber(latestGrowthToday.heightCm, 1)}cm${delta && delta !== '0' ? ` (${delta})` : ''}`
      );
    }
    if (latestGrowthToday?.headCircumferenceCm != null) {
      const delta =
        latestGrowthYesterday?.headCircumferenceCm != null
          ? formatDeltaNumber(
              latestGrowthToday.headCircumferenceCm - latestGrowthYesterday.headCircumferenceCm,
              'cm',
              1
            )
          : null;
      growthParts.push(
        `HC ${formatNumber(latestGrowthToday.headCircumferenceCm, 1)}cm${
          delta && delta !== '0' ? ` (${delta})` : ''
        }`
      );
    }
    const growthLabel = growthParts.length > 0 ? growthParts.join(' · ') : null;

    // Habit sublabel
    const habitCount = babyHabits.length;
    const completedHabitIds = new Set(todayHabitLogs.map((log) => log.babyHabitId));
    const completedCount = babyHabits.filter((h) => completedHabitIds.has(h.id)).length;
    let habitLabel: string | null = null;
    if (habitCount === 0) {
      habitLabel = t('habit.sublabelNoHabits', { defaultValue: 'Tap to add habits' });
    } else if (completedCount === habitCount) {
      habitLabel = t('habit.sublabelAllDone', { defaultValue: '✨ All habits done today!' });
    } else if (completedCount > 0) {
      habitLabel = t('habit.sublabelProgress', {
        defaultValue: `${completedCount}/${habitCount} done today`,
      });
    } else {
      habitLabel = t('habit.sublabelEncourage', {
        defaultValue: `${habitCount} habits to build 💪`,
      });
    }

    return {
      feeding:
        totalBottleMl > 0 || totalNursingMinutes > 0
          ? [
              totalBottleMl > 0 ? `${Math.round(totalBottleMl)} ml bottle` : null,
              totalNursingMinutes > 0 ? `${totalNursingMinutes}m nursing` : null,
              formatFeedDelta(
                totalBottleMl - totalBottleMlYesterday,
                totalNursingMinutes - totalNursingMinutesYesterday
              ),
            ]
              .filter(Boolean)
              .join(' · ')
          : t('tracking.tiles.feeding.sublabel'),
      pumping:
        totalPumpedMl > 0
          ? `${Math.round(totalPumpedMl)} ml · Δ ${formatDelta(totalPumpedMl - totalPumpedMlYesterday, 'ml')}${
              lastPumpingAgo ? ` · ${lastPumpingAgo} ago` : ''
            }`
          : t('tracking.tiles.pumping.sublabel'),
      diaper:
        diaperCounts != null
          ? `${diaperCounts}${lastDiaperAgo ? ` · ${lastDiaperAgo} ago` : ''}${
              diaperYesterdayCounts ? ` · ${diaperYesterdayCounts}` : ''
            }${diaperDeltaTotal !== 0 ? ` · Δ ${formatDelta(diaperDeltaTotal, '')}` : ''}`
          : t('tracking.tiles.diaper.sublabel'),
      sleep:
        totalSleepSeconds > 0
          ? `${formatSleepTotal(totalSleepSeconds)}${
              totalSleepSecondsYesterday > 0
                ? ` · Δ ${formatSleepDelta(totalSleepSeconds - totalSleepSecondsYesterday)}`
                : ''
            }${longestSleepText ? ` · longest ${longestSleepText}` : ''}`
          : t('tracking.tiles.sleep.sublabel'),
      growth: growthLabel ?? t('tracking.tiles.growth.sublabel'),
      habit: habitLabel ?? t('tracking.tiles.habit.sublabel'),
    };
  }, [
    diapersToday,
    diapersYesterday,
    feedingsToday,
    feedingsYesterday,
    pumpingsToday,
    pumpingsYesterday,
    sleepSessionsToday,
    sleepSessionsYesterday,
    growthToday,
    growthYesterday,
    babyHabits,
    todayHabitLogs,
    t,
  ]);

  // Type guard for tile sublabel keys
  function isTileSublabelKey(key: string): key is keyof typeof tileSublabels {
    return (
      key === 'feeding' ||
      key === 'pumping' ||
      key === 'diaper' ||
      key === 'sleep' ||
      key === 'growth' ||
      key === 'habit'
    );
  }

  // Helper function to safely get tile sublabel
  const getTileSublabel = (tileId: string, fallbackKey: string): string => {
    if (isTileSublabelKey(tileId)) {
      return tileSublabels[tileId];
    }
    return t(fallbackKey);
  };

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
      router.push('/(habit)/habit');
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
                <Text className="text-sm text-muted-foreground">
                  {getTileSublabel(tile.id, tile.sublabelKey)}
                </Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function computeMonthsOld(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

function computeTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    startOfToday: Math.floor(start.getTime() / 1000),
    endOfToday: Math.floor(end.getTime() / 1000),
  };
}

function computeYesterdayRange(startOfToday: number) {
  const endOfYesterday = startOfToday - 1;
  const startOfYesterday = startOfToday - 24 * 60 * 60;
  return { startOfYesterday, endOfYesterday };
}

function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

function roundMinutes(seconds: number) {
  return Math.round(seconds / 60);
}

function maxTimestamp(values: (number | null | undefined)[]) {
  return values.reduce<number | null>((max, value) => {
    if (value != null && (max == null || value > max)) {
      return value;
    }
    return max;
  }, null);
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins === 0 && seconds > 0) {
    return '1m';
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m`;
}

function formatSleepTotal(totalSeconds: number) {
  if (totalSeconds < 3600) {
    const mins = Math.max(1, Math.round(totalSeconds / 60));
    return `${mins}m today`;
  }
  const hours = Math.round((totalSeconds / 3600) * 10) / 10;
  return `${hours}h today`;
}

function formatTimeAgo(diffSeconds: number) {
  if (diffSeconds < 60) {
    return 'just now';
  }
  const mins = Math.floor(diffSeconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) {
    return `${hours}h ${remMins}m`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatDelta(value: number, unit: string) {
  const rounded = Math.round(value);
  if (rounded === 0) {
    return '0';
  }
  return `${rounded > 0 ? '+' : ''}${rounded}${unit ? ` ${unit}` : ''}`;
}

function formatFeedDelta(deltaBottle: number, deltaNursingMinutes: number) {
  const parts: string[] = [];
  if (deltaBottle !== 0) {
    parts.push(`Δb ${formatDelta(deltaBottle, 'ml')}`);
  }
  if (deltaNursingMinutes !== 0) {
    parts.push(`Δn ${formatDelta(deltaNursingMinutes, 'm')}`);
  }
  return parts.length > 0 ? parts.join(' / ') : null;
}

function formatSleepDelta(deltaSeconds: number) {
  const mins = Math.round(deltaSeconds / 60);
  if (Math.abs(mins) < 60) {
    return formatDelta(mins, 'm');
  }
  const hours = Math.round((deltaSeconds / 3600) * 10) / 10;
  return formatDelta(hours, 'h');
}

function latestGrowth(records: GrowthRecord[]): GrowthRecord | null {
  return records.reduce<GrowthRecord | null>((latest, record) => {
    if (record.time != null && (latest?.time == null || record.time > latest.time)) {
      return record;
    }
    return latest;
  }, null);
}

function formatNumber(value: number, digits: number) {
  return value.toFixed(digits);
}

function formatDeltaNumber(value: number, unit: string, digits: number) {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) {
    return '0';
  }
  return `${rounded > 0 ? '+' : ''}${rounded}${unit ? ` ${unit}` : ''}`;
}

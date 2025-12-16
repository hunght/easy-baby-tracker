import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { BabyInfoBanner } from '@/components/BabyInfoBanner';
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
import { TRACKING_TILES } from '@/constants/tracking-tiles';
import { getActiveBabyProfile, getBabyProfiles } from '@/database/baby-profile';
import { getDiaperChanges } from '@/database/diaper';
import { getFeedings } from '@/database/feeding';
import { getGrowthRecords } from '@/database/growth';
import { getPumpings } from '@/database/pumping';
import { getSleepSessions } from '@/database/sleep';
import { getBabyHabits, getTodayHabitLogs } from '@/database/habits';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useSetActiveBabyProfile } from '@/hooks/use-set-active-baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import {
  computeTodayRange,
  computeYesterdayRange,
  sum,
  roundMinutes,
  maxTimestamp,
  formatTimeAgo,
  formatDuration,
  formatDelta,
  formatFeedDelta,
  formatSleepTotal,
  formatSleepDelta,
  latestGrowth,
} from '@/lib/tracking-utils'; // Corrected import path

// Get screen width for carousel
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TrackingScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { features } = useFeatureFlags();
  const brandColors = useBrandColor();
  const setActiveBabyMutation = useSetActiveBabyProfile();

  // Scroll ref for carousel
  const scrollRef = useRef<ScrollView>(null);

  const visibleTiles = useMemo(() => {
    return TRACKING_TILES.filter((tile) => features[tile.id]);
  }, [features]);

  // Selected baby computations
  const { startOfToday, endOfToday } = useMemo(() => computeTodayRange(), []);
  const { startOfYesterday, endOfYesterday } = useMemo(
    () => computeYesterdayRange(startOfToday),
    [startOfToday]
  );
  const [activeBabyIndex, setActiveBabyIndex] = useState<number>(0);
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

  const displayBabies = useMemo(() => {
    return babyProfiles.length > 0 ? babyProfiles : profile ? [profile] : [];
  }, [babyProfiles, profile]);

  // Sync active index with profile
  useEffect(() => {
    if (profile && displayBabies.length > 0) {
      const index = displayBabies.findIndex((b) => b.id === profile.id);
      if (index !== -1 && index !== activeBabyIndex) {
        setActiveBabyIndex(index);
        // Scroll to active baby without animation on mount/sync
        scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
      }
    }
  }, [profile?.id, displayBabies]); // depend on displayBabies array reference

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
    // Growth records are available but not currently displayed in sublabels
    // const latestGrowthToday = latestGrowth(growthToday);
    // const latestGrowthYesterday = latestGrowth(growthYesterday);
    // Removed growthParts logic as it's now handled in BabyInfoBanner

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
      key === 'pumping' ||
      key === 'diaper' ||
      key === 'sleep' ||
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

  // Handle scroll end to switch baby
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index >= 0 && index < displayBabies.length) {
      setActiveBabyIndex(index);
      const baby = displayBabies[index];
      if (baby && baby.id !== profile?.id) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleSelectBaby(baby.id);
      }
    }
  };

  const handleSelectBaby = async (babyId: number) => {
    if (babyId === profile.id) {
      return;
    }

    await setActiveBabyMutation.mutateAsync(babyId);
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}>
        {/* Swipeable Baby Profiles */}
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            decelerationRate="fast"
            className="mb-2">
            {displayBabies.map((baby) => (
              <View key={baby.id} style={{ width: SCREEN_WIDTH }}>
                <View className="px-6 pt-4">
                  <BabyInfoBanner
                    profile={baby}
                    latestGrowthRecord={
                      baby.id === profile?.id ? latestGrowth(growthToday) : undefined
                    }
                    previousGrowthRecord={
                      baby.id === profile?.id ? latestGrowth(growthYesterday) : undefined
                    }
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {displayBabies.length > 1 && (
            <View className="mb-6 flex-row justify-center gap-2">
              {displayBabies.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === activeBabyIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 px-6">
          {visibleTiles.map((tile) => (
            <Card
              key={tile.id}
              className={`${tile.fullWidth ? 'w-[100%]' : 'w-[47%]'} py-3 active:opacity-80`}
              onPress={() => handleTilePress(tile.id)}
              testID={`tile-${tile.id}`}
              accessibilityRole="button">
              <CardContent className="gap-2.5 p-3">
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons
                    name={tile.icon}
                    size={tile.fullWidth ? 42 : 36}
                    color={brandColors.get(tile.colorKey)}
                  />
                  <Text
                    className={`${tile.fullWidth ? 'text-xl' : 'text-lg'} font-bold text-foreground`}>
                    {t(tile.labelKey)}
                  </Text>
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

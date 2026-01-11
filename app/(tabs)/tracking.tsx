import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { SwipeableBabyProfiles } from '@/pages/tabs/tracking/SwipeableBabyProfiles';
import { TRACKING_TILES } from '@/constants/tracking-tiles';
import { api } from '@/convex/_generated/api';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useConvexAuth } from '@/pages/root-layout/ConvexAuthProvider';
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
} from '@/lib/tracking-utils';

export default function TrackingScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { features } = useFeatureFlags();
  const brandColors = useBrandColor();
  const { isAuthenticated } = useConvexAuth();

  const visibleTiles = useMemo(() => {
    return TRACKING_TILES.filter((tile) => features[tile.id]);
  }, [features]);

  // Selected baby computations
  const { startOfToday, endOfToday } = useMemo(() => computeTodayRange(), []);
  const { startOfYesterday, endOfYesterday } = useMemo(
    () => computeYesterdayRange(startOfToday),
    [startOfToday]
  );

  // Convex reactive queries
  const profile = useQuery(api.babyProfiles.getActive);
  const babyProfiles = useQuery(api.babyProfiles.list) ?? [];

  const feedingsToday =
    useQuery(
      api.feedings.list,
      profile?._id ? { babyId: profile._id, startDate: startOfToday, endDate: endOfToday } : 'skip'
    ) ?? [];

  const feedingsYesterday =
    useQuery(
      api.feedings.list,
      profile?._id
        ? {
            babyId: profile._id,
            startDate: startOfYesterday,
            endDate: endOfYesterday,
          }
        : 'skip'
    ) ?? [];

  const pumpingsToday =
    useQuery(
      api.pumpings.list,
      profile?._id ? { babyId: profile._id, startDate: startOfToday, endDate: endOfToday } : 'skip'
    ) ?? [];

  const pumpingsYesterday =
    useQuery(
      api.pumpings.list,
      profile?._id
        ? {
            babyId: profile._id,
            startDate: startOfYesterday,
            endDate: endOfYesterday,
          }
        : 'skip'
    ) ?? [];

  const sleepSessionsToday =
    useQuery(
      api.sleepSessions.list,
      profile?._id ? { babyId: profile._id, startDate: startOfToday, endDate: endOfToday } : 'skip'
    ) ?? [];

  const sleepSessionsYesterday =
    useQuery(
      api.sleepSessions.list,
      profile?._id
        ? {
            babyId: profile._id,
            startDate: startOfYesterday,
            endDate: endOfYesterday,
          }
        : 'skip'
    ) ?? [];

  const diapersToday =
    useQuery(
      api.diaperChanges.list,
      profile?._id ? { babyId: profile._id, startDate: startOfToday, endDate: endOfToday } : 'skip'
    ) ?? [];

  const diapersYesterday =
    useQuery(
      api.diaperChanges.list,
      profile?._id
        ? {
            babyId: profile._id,
            startDate: startOfYesterday,
            endDate: endOfYesterday,
          }
        : 'skip'
    ) ?? [];

  // Habits queries
  const babyHabits =
    useQuery(api.habits.getBabyHabits, profile?._id ? { babyId: profile._id } : 'skip') ?? [];

  const todayHabitLogs =
    useQuery(api.habits.getTodayHabitLogs, profile?._id ? { babyId: profile._id } : 'skip') ?? [];

  const isLoading = profile === undefined;
  const profilesLoading = babyProfiles === undefined;

  // Redirect to profile selection if authenticated but no active profile (but profiles exist)
  // If not authenticated and no profile, show guest mode screen (handled below)
  useEffect(() => {
    if (isAuthenticated && profile !== undefined && babyProfiles !== undefined) {
      if (profile === null && babyProfiles.length > 0) {
        router.replace('/(profiles)/profile-selection');
      }
    }
  }, [profile, babyProfiles, router, isAuthenticated]);

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

    // Habit sublabel
    const habitCount = babyHabits.length;
    const completedHabitIds = new Set(todayHabitLogs.map((log) => log.babyHabitId));
    const completedCount = babyHabits.filter((h) => completedHabitIds.has(h._id)).length;
    let habitLabel: string | null = null;
    if (habitCount === 0) {
      habitLabel = t('habit.sublabelNoHabits', {
        defaultValue: 'Tap to add habits',
      });
    } else if (completedCount === habitCount) {
      habitLabel = t('habit.sublabelAllDone', {
        defaultValue: '✨ All habits done today!',
      });
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

  // Show loading state
  if (isLoading || profilesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-semibold text-primary">{t('tracking.loading')}</Text>
      </View>
    );
  }

  // No profile - show appropriate screen based on auth state
  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-background px-8">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
        />
        <View className="gap-3">
          <Text className="text-center text-2xl font-bold text-foreground">
            {isAuthenticated ? t('tracking.noProfile.title') : t('tracking.guestMode.title')}
          </Text>
          <Text className="text-center text-base text-muted-foreground">
            {isAuthenticated
              ? t('tracking.noProfile.description')
              : t('tracking.guestMode.description')}
          </Text>
        </View>
        <View className="w-full gap-3">
          {isAuthenticated ? (
            <Button onPress={() => router.push('/')}>
              <Text>{t('tracking.noProfile.createProfile')}</Text>
            </Button>
          ) : (
            <>
              <Button onPress={() => router.push('/(auth)/sign-in?mode=signup')}>
                <Text>{t('tracking.guestMode.createAccount')}</Text>
              </Button>
              <Button variant="outline" onPress={() => router.push('/(auth)/sign-in')}>
                <Text>{t('tracking.guestMode.signIn')}</Text>
              </Button>
            </>
          )}
        </View>
      </View>
    );
  }

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
      router.push('/(tracking)/diary-list');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}>
        {/* Swipeable Baby Profiles */}
        <SwipeableBabyProfiles />

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

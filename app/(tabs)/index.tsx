import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { BABY_PROFILE_QUERY_KEY, BABY_PROFILES_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfile, getBabyProfiles, setActiveBabyProfileId } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';

const trackingTiles: readonly {
  id: string;
  labelKey: string;
  sublabelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}[] = [
    { id: 'feeding', labelKey: 'tracking.tiles.feeding.label', sublabelKey: 'tracking.tiles.feeding.sublabel', icon: 'baby-bottle-outline', color: '#FF7A9B' },
    { id: 'pumping', labelKey: 'tracking.tiles.pumping.label', sublabelKey: 'tracking.tiles.pumping.sublabel', icon: 'bottle-tonic-outline', color: '#FF7A9B' },
    { id: 'diaper', labelKey: 'tracking.tiles.diaper.label', sublabelKey: 'tracking.tiles.diaper.sublabel', icon: 'baby-face-outline', color: '#6BC9FF' },
    { id: 'sleep', labelKey: 'tracking.tiles.sleep.label', sublabelKey: 'tracking.tiles.sleep.sublabel', icon: 'sleep', color: '#B49BFF' },
    { id: 'easy-schedule', labelKey: 'tracking.tiles.easySchedule.label', sublabelKey: 'tracking.tiles.easySchedule.sublabel', icon: 'calendar-clock', color: '#9B7EBD' },
    { id: 'health', labelKey: 'tracking.tiles.health.label', sublabelKey: 'tracking.tiles.health.sublabel', icon: 'stethoscope', color: '#35C2C4' },
    { id: 'growth', labelKey: 'tracking.tiles.growth.label', sublabelKey: 'tracking.tiles.growth.sublabel', icon: 'human-male-height', color: '#FFA74F' },
    { id: 'diary', labelKey: 'tracking.tiles.diary.label', sublabelKey: 'tracking.tiles.diary.sublabel', icon: 'notebook', color: '#F8C93B' },
  ];

export default function TrackingScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
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
          router.replace('/profile-selection');
        } else {
          router.replace('/');
        }
      }
    }
  }, [profile, isLoading, profilesLoading, babyProfiles.length, router]);

  if (isLoading || profilesLoading || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t('tracking.loading')}</Text>
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
      router.push('/feeding');
    } else if (tileId === 'pumping') {
      router.push('/pumping');
    } else if (tileId === 'diaper') {
      router.push('/diaper');
    } else if (tileId === 'sleep') {
      router.push('/sleep');
    } else if (tileId === 'health') {
      router.push('/health');
    } else if (tileId === 'growth') {
      router.push('/growth');
    } else if (tileId === 'easy-schedule') {
      router.push('/easy-schedule');
    } else if (tileId === 'diary') {
      router.push('/diary');
    }
    // Add other navigation handlers as needed
  };

  return (
    <View style={styles.screen}>
      <TabPageHeader title={t('tabs.tracking')} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.babyHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.babyTabsContent}
            style={styles.babyTabs}>
            {displayBabies.map((baby) => {
              const isActive = baby.id === profile.id;
              const tabMonths = computeMonthsOld(baby.birthDate);
              return (
                <Pressable
                  key={baby.id}
                  disabled={switchingBabyId != null}
                  onPress={() => handleSelectBaby(baby.id)}
                  style={[styles.babyTab, isActive && styles.babyTabActive]}>
                  <Text style={[styles.babyTabLabel, isActive && styles.babyTabLabelActive]}>{baby.nickname}</Text>
                  <Text style={[styles.babyTabSubLabel, isActive && styles.babyTabSubLabelActive]}>
                    {t('common.monthsOld', { params: { count: tabMonths } })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tilesWrapper}>
          {trackingTiles.map((tile) => (
            <Pressable
              key={tile.id}
              testID={`tracking-tile-${tile.id}`}
              style={styles.tile}
              onPress={() => handleTilePress(tile.id)}>
              <MaterialCommunityIcons name={tile.icon} size={34} color={tile.color} />
              <Text style={styles.tileLabel}>{t(tile.labelKey)}</Text>
              <Text style={styles.tileSub}>{t(tile.sublabelKey)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function computeMonthsOld(birthDateIso: string) {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F2FF',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 80,
    gap: 24,
  },
  babyHeader: {
    marginBottom: 4,
  },
  babyTabs: {
    marginHorizontal: -6,
  },
  babyTabsContent: {
    paddingHorizontal: 6,
  },
  babyTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#F2ECFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5D8FF',
  },
  babyTabActive: {
    backgroundColor: '#FF5C8D',
    borderColor: '#FF5C8D',
  },
  babyTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4B7B',
  },
  babyTabLabelActive: {
    color: '#FFF',
  },
  babyTabSubLabel: {
    fontSize: 11,
    color: '#7C6A99',
  },
  babyTabSubLabelActive: {
    color: '#FFE8F0',
  },
  tilesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  tile: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tileLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  tileSub: {
    color: '#A4A4A4',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F2FF',
  },
  loadingText: {
    color: '#FF5C8D',
    fontWeight: '600',
  },
});

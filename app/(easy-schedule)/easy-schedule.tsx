import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY, formulaRuleByIdKey } from '@/constants/query-keys';
import { getActiveBabyProfile } from '@/database/baby-profile';
import { getFormulaRuleById } from '@/database/easy-formula-rules';
import { useLocalization } from '@/localization/LocalizationProvider';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { PhaseModal } from '@/pages/easy-schedule/components/PhaseModal';
import { generateEasySchedule } from '@/lib/easy-schedule-generator';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function EasyScheduleScreen() {
  const { t, locale } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const wakeTimeSyncedRef = useRef<string | null>(null);

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Initialize from baby profile's stored wake time, or default to 07:00
  const [firstWakeTime, setFirstWakeTime] = useState(babyProfile?.firstWakeTime ?? '07:00');
  const [phaseModalData, setPhaseModalData] = useState<{
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null>(null);

  // Sync local state when baby profile's wake time changes in DB
  useEffect(() => {
    if (babyProfile?.firstWakeTime && babyProfile.firstWakeTime !== wakeTimeSyncedRef.current) {
      wakeTimeSyncedRef.current = babyProfile.firstWakeTime;
      setFirstWakeTime(babyProfile.firstWakeTime);
    }
  }, [babyProfile?.firstWakeTime]);

  const labels = useMemo(
    () => ({
      eat: t('easySchedule.activityLabels.eat'),
      activity: t('easySchedule.activityLabels.activity'),
      sleep: (napNumber: number) =>
        t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
      yourTime: t('easySchedule.activityLabels.yourTime'),
    }),
    [t]
  );

  // Get active formula by selected ID
  const { data: formulaRule, isLoading: isLoadingFormula } = useQuery({
    queryKey: formulaRuleByIdKey(babyProfile?.selectedEasyFormulaId ?? '', babyProfile?.id),
    queryFn: () => getFormulaRuleById(babyProfile!.selectedEasyFormulaId!, babyProfile?.id),
    enabled: !!babyProfile?.selectedEasyFormulaId,
    staleTime: 5 * 60 * 1000,
  });

  // Redirect to selection page if no formula is selected
  useEffect(() => {
    if (babyProfile && !isLoadingFormula && !babyProfile.selectedEasyFormulaId) {
      router.replace('/(easy-schedule)/easy-schedule-select');
    }
  }, [babyProfile, isLoadingFormula, router]);

  // Check if there's a day-specific rule (custom schedule) by checking if validDate exists
  const hasCustomSchedule = !!formulaRule?.validDate;

  const formulaNotice = formulaRule
    ? t('easySchedule.formulaTable.selectedNotice', {
        params: {
          label: formulaRule.labelKey
            ? t(formulaRule.labelKey)
            : formulaRule.labelText || formulaRule.id,
        },
      })
    : t('easySchedule.formulaTable.defaultNotice');

  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);

  useEffect(() => {
    if (!formulaRule || isLoadingFormula) return;

    // Generate schedule from formula rule phases
    const items = generateEasySchedule(firstWakeTime, {
      labels,
      phases: [...formulaRule.phases],
    });

    setScheduleItems(items);
  }, [firstWakeTime, labels, formulaRule, isLoadingFormula]);

  const baseMinutes = timeStringToMinutes(firstWakeTime);

  const groupedSchedule = (() => {
    const groups: { number: number; items: EasyScheduleItem[] }[] = [];
    let currentGroup: EasyScheduleItem[] = [];

    scheduleItems.forEach((item) => {
      if (item.activityType === 'E' && currentGroup.length > 0) {
        groups.push({
          number: groups.length + 1,
          items: currentGroup,
        });
        currentGroup = [];
      }
      currentGroup.push(item);
    });

    if (currentGroup.length > 0) {
      groups.push({
        number: groups.length + 1,
        items: currentGroup,
      });
    }

    return groups;
  })();

  const openPhaseModal = useCallback(
    (
      item: EasyScheduleItem,
      timing: { startMinutes: number; endMinutes: number },
      endTimeLabel: string,
      durationLabel: string
    ) => {
      setPhaseModalData({
        item,
        timing,
        endTimeLabel,
        durationLabel,
      });
    },
    []
  );

  const closePhaseModal = () => {
    setPhaseModalData(null);
  };

  if (isLoadingFormula || !formulaRule) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScheduleHeader formulaRule={formulaRule} />

      <ScrollView contentContainerClassName="p-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        <Text className="text-xs text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

        {hasCustomSchedule && (
          <View className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
            <Text className="text-xs font-medium text-accent">
              {t('easySchedule.customScheduleNotice', {
                defaultValue: '✨ Custom schedule for today - resets tomorrow',
              })}
            </Text>
          </View>
        )}

        {groupedSchedule.map((group, _groupIndex) => {
          const phases = group.items.filter((item) => item.activityType !== 'Y');
          // Calculate baseMinutes for this group using the first phase's actual start time
          // This ensures adjusted schedules are displayed correctly
          const firstPhase = phases[0];
          const groupBaseMinutes = firstPhase
            ? timeStringToMinutes(firstPhase.startTime)
            : baseMinutes;
          return (
            <ScheduleGroup
              key={group.number}
              phases={phases}
              baseMinutes={groupBaseMinutes}
              locale={locale}
              onPhasePress={openPhaseModal}
            />
          );
        })}
      </ScrollView>

      <PhaseModal
        phaseData={phaseModalData}
        onClose={closePhaseModal}
        onAdjustmentSaved={() => {
          // Invalidate formula rule query and baby profile to refresh UI
          queryClient.invalidateQueries({
            queryKey: formulaRuleByIdKey(babyProfile?.selectedEasyFormulaId ?? '', babyProfile?.id),
          });
          queryClient.invalidateQueries({
            queryKey: BABY_PROFILE_QUERY_KEY,
          });
        }}
        babyProfile={babyProfile ?? null}
        scheduleItems={scheduleItems}
        currentFormulaRuleId={formulaRule?.id ?? ''}
      />
    </View>
  );
}

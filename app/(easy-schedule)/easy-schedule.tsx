import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY, formulaRuleByIdKey } from '@/constants/query-keys';
import { getActiveBabyProfile } from '@/database/baby-profile';
import { updateSelectedEasyFormula } from '@/database/app-state';
import { getFormulaRuleById, getFormulaRuleByAge } from '@/database/easy-formula-rules';
import { useLocalization } from '@/localization/LocalizationProvider';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { generateEasySchedule } from '@/lib/easy-schedule-generator';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks);
}

export default function EasyScheduleScreen() {
  const { t, locale } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Use wake time from baby profile, or default to 07:00
  const firstWakeTime = babyProfile?.firstWakeTime ?? '07:00';

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

  // Auto-select mutation
  const autoSelectMutation = useMutation({
    mutationFn: async ({ babyId, formulaId }: { babyId: number; formulaId: string }) => {
      await updateSelectedEasyFormula(babyId, formulaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
    },
  });

  // Get active formula by selected ID
  const { data: formulaRule, isLoading: isLoadingFormula } = useQuery({
    queryKey: formulaRuleByIdKey(babyProfile?.selectedEasyFormulaId ?? '', babyProfile?.id),
    queryFn: () => getFormulaRuleById(babyProfile!.selectedEasyFormulaId!, babyProfile?.id),
    enabled: !!babyProfile?.selectedEasyFormulaId,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select formula based on baby's age if none selected
  useEffect(() => {
    const autoSelectFormula = async () => {
      if (!babyProfile || babyProfile.selectedEasyFormulaId || autoSelectMutation.isPending) {
        return;
      }

      // Calculate baby's age in weeks
      const ageWeeks = calculateAgeInWeeks(babyProfile.birthDate);

      // Find matching formula for this age
      const matchingFormula = await getFormulaRuleByAge(ageWeeks, babyProfile.id);

      if (matchingFormula) {
        // Auto-select this formula
        autoSelectMutation.mutate({
          babyId: babyProfile.id,
          formulaId: matchingFormula.id,
        });
      }
    };

    autoSelectFormula();
  }, [babyProfile, autoSelectMutation]);

  // Check if there's a day-specific rule (custom schedule) by checking if validDate exists
  const hasCustomSchedule = !!formulaRule?.validDate;

  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);

  useEffect(() => {
    if (!formulaRule || isLoadingFormula) {
      return;
    }

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

  // Navigate to phase edit page instead of opening modal
  const openPhaseEdit = useCallback(
    (
      item: EasyScheduleItem,
      timing: { startMinutes: number; endMinutes: number },
      _endTimeLabel: string,
      _durationLabel: string
    ) => {
      router.push({
        pathname: '/(easy-schedule)/phase-edit',
        params: {
          order: item.order.toString(),
          label: item.label,
          activityType: item.activityType,
          startMinutes: timing.startMinutes.toString(),
          endMinutes: timing.endMinutes.toString(),
        },
      });
    },
    [router]
  );

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
        {hasCustomSchedule && (
          <View className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
            <Text className="text-xs font-medium text-foreground">
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
              onPhasePress={openPhaseEdit}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

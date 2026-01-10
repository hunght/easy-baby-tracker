import { useMutation, useQuery } from 'convex/react';
import { ScrollView, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { api } from '@/convex/_generated/api';
import { useLocalization } from '@/localization/LocalizationProvider';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { generateEasySchedule } from '@/lib/easy-schedule-generator';
import type { EasyScheduleItem, EasyScheduleActivityType } from '@/lib/easy-schedule-generator';

// Type guard for activity type
function isValidActivityType(type: string): type is EasyScheduleActivityType {
  return ['E', 'A', 'E.A', 'S', 'Y'].includes(type);
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function EasyScheduleScreen() {
  const { t, locale } = useLocalization();
  const router = useRouter();

  // Get active baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

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
  const updateSelectedFormula = useMutation(api.babyProfiles.updateSelectedEasyFormula);

  // Get formula rule by selected ID
  const formulaRule = useQuery(
    api.easyFormulaRules.getById,
    babyProfile?.selectedEasyFormulaId
      ? { ruleId: babyProfile.selectedEasyFormulaId, babyId: babyProfile._id }
      : 'skip'
  );

  const isLoadingFormula =
    babyProfile !== undefined && babyProfile?.selectedEasyFormulaId && formulaRule === undefined;

  // Auto-select formula based on baby's age if none selected
  useEffect(() => {
    const autoSelectFormula = async () => {
      if (!babyProfile || babyProfile.selectedEasyFormulaId) {
        return;
      }

      // Auto-select a formula for this age (backend calculates age from birthDate)
      updateSelectedFormula({
        babyId: babyProfile._id,
        selectedEasyFormulaId: undefined, // Let the backend select based on age
      });
    };

    autoSelectFormula();
  }, [babyProfile, updateSelectedFormula]);

  // Check if there's a day-specific rule (custom schedule) by checking if validDate exists
  const hasCustomSchedule = !!formulaRule?.validDate;

  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);

  useEffect(() => {
    if (!formulaRule || isLoadingFormula) {
      return;
    }

    // For day-specific rules with pre-calculated scheduleItems, use those directly
    if (formulaRule.validDate && formulaRule.scheduleItems) {
      const storedItems =
        typeof formulaRule.scheduleItems === 'string'
          ? JSON.parse(formulaRule.scheduleItems)
          : formulaRule.scheduleItems;

      // Convert stored items to full EasyScheduleItem format with proper labels
      const items: EasyScheduleItem[] = storedItems.map(
        (item: {
          order: number;
          activityType: string;
          startTime: string;
          durationMinutes: number;
          label: string;
        }) => {
          // Generate proper label based on activity type
          let label = item.label;
          if (item.activityType === 'E') {
            label = labels.eat;
          } else if (item.activityType === 'A') {
            label = labels.activity;
          } else if (item.activityType === 'E.A') {
            label = `${labels.eat} & ${labels.activity}`;
          } else if (item.activityType === 'S') {
            // Extract nap number from stored label (e.g., "S 1" -> 1)
            const napMatch = item.label.match(/\d+/);
            const napNumber = napMatch ? parseInt(napMatch[0], 10) : 1;
            label = labels.sleep(napNumber);
          } else if (item.activityType === 'Y') {
            label = labels.yourTime;
          }

          // Validate activity type
          const activityType = isValidActivityType(item.activityType) ? item.activityType : 'E'; // Default to E if invalid

          return {
            order: item.order,
            activityType,
            startTime: item.startTime,
            durationMinutes: item.durationMinutes,
            label,
          };
        }
      );

      setScheduleItems(items);
      return;
    }

    // Parse phases from formula rule
    const phases =
      typeof formulaRule.phases === 'string' ? JSON.parse(formulaRule.phases) : formulaRule.phases;

    // Generate schedule from formula rule phases
    const items = generateEasySchedule(firstWakeTime, {
      labels,
      phases: [...phases],
    });

    setScheduleItems(items);
  }, [firstWakeTime, labels, formulaRule, isLoadingFormula]);

  const baseMinutes = timeStringToMinutes(firstWakeTime);

  const groupedSchedule = (() => {
    const groups: { number: number; items: EasyScheduleItem[] }[] = [];
    let currentGroup: EasyScheduleItem[] = [];

    scheduleItems.forEach((item) => {
      const lastItem = currentGroup[currentGroup.length - 1];
      const cycleEnded = lastItem?.activityType === 'Y';

      const shouldStartNewGroup =
        ((item.activityType === 'E' || item.activityType === 'E.A') && currentGroup.length > 0) ||
        (item.activityType === 'A' && currentGroup.length > 0 && cycleEnded);

      if (shouldStartNewGroup) {
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

  // Navigate to phase edit page
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

  // Show message if no baby profile is set
  if (babyProfile === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-lg font-semibold text-foreground">
          {t('easySchedule.noBabyProfile', { defaultValue: 'No baby profile selected' })}
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {t('easySchedule.selectBabyProfile', {
            defaultValue: 'Please add or select a baby profile in Settings.',
          })}
        </Text>
      </View>
    );
  }

  if (isLoadingFormula || !formulaRule) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  // Transform formulaRule for ScheduleHeader
  const headerFormulaRule = {
    id: formulaRule._id,
    labelKey: formulaRule.labelKey ?? '',
    labelText: formulaRule.labelText ?? null,
    ageRangeKey: formulaRule.ageRangeKey ?? '',
    ageRangeText: formulaRule.ageRangeText ?? null,
    minWeeks: formulaRule.minWeeks,
    maxWeeks: formulaRule.maxWeeks ?? null,
    phases:
      typeof formulaRule.phases === 'string' ? JSON.parse(formulaRule.phases) : formulaRule.phases,
    validDate: formulaRule.validDate ?? null,
    description: formulaRule.description ?? null,
  };

  return (
    <View className="flex-1 bg-background">
      <ScheduleHeader formulaRule={headerFormulaRule} />

      <ScrollView contentContainerClassName="p-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        {hasCustomSchedule && (
          <View className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
            <Text className="text-xs font-medium text-foreground">
              {t('easySchedule.customScheduleNotice', {
                defaultValue: 'Custom schedule for today - resets tomorrow',
              })}
            </Text>
          </View>
        )}

        {groupedSchedule.map((group) => {
          // Filter out Y items and S items with 0 duration
          const phases = group.items.filter(
            (item) =>
              item.activityType !== 'Y' &&
              !(item.activityType === 'S' && item.durationMinutes === 0)
          );
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

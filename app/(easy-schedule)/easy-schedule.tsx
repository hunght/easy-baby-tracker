import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Text } from '@/components/ui/text';
import {
  BABY_PROFILE_QUERY_KEY,
  formulaRuleByIdKey,
  formulaRuleByAgeKey,
} from '@/constants/query-keys';
import { getActiveBabyProfile } from '@/database/baby-profile';
import { getAppState } from '@/database/app-state';
import { getFormulaRuleById, getFormulaRuleByAge } from '@/database/easy-formula-rules';
import { useLocalization } from '@/localization/LocalizationProvider';
import {
  requestNotificationPermissions,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { PhaseModal } from '@/pages/easy-schedule/components/PhaseModal';
import { generateEasySchedule, recalculateScheduleFromItem } from '@/lib/easy-schedule-generator';
import type { EasyScheduleItem } from '@/lib/easy-schedule-generator';

function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function EasyScheduleScreen() {
  const { t, locale } = useLocalization();
  const wakeTimeSyncedRef = useRef<string | null>(null);

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Initialize from baby profile's stored wake time, or default to 07:00
  const [firstWakeTime, setFirstWakeTime] = useState(babyProfile?.firstWakeTime ?? '07:00');
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{
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

  const ageWeeks = babyProfile?.birthDate ? calculateAgeInWeeks(babyProfile.birthDate) : undefined;

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
  const { data: formulaById } = useQuery({
    queryKey: formulaRuleByIdKey(babyProfile?.selectedEasyFormulaId ?? '', babyProfile?.id),
    queryFn: () => getFormulaRuleById(babyProfile!.selectedEasyFormulaId!, babyProfile?.id),
    enabled: !!babyProfile?.selectedEasyFormulaId,
    staleTime: 5 * 60 * 1000,
  });

  // Get active formula by age as fallback
  const { data: formulaByAge, isLoading: isLoadingFormula } = useQuery({
    queryKey: formulaRuleByAgeKey(ageWeeks ?? 0, babyProfile?.id),
    queryFn: () => getFormulaRuleByAge(ageWeeks!, babyProfile?.id),
    enabled: ageWeeks !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Use selected formula if valid, otherwise use age-based
  const formulaRule = formulaById || formulaByAge;

  const formulaNotice = formulaRule
    ? babyProfile?.selectedEasyFormulaId
      ? t('easySchedule.formulaTable.selectedNotice', {
          params: { label: t(formulaRule.labelKey) },
        })
      : babyProfile
        ? t('easySchedule.formulaTable.autoDetected', {
            params: { label: t(formulaRule.labelKey) },
          })
        : t('easySchedule.formulaTable.defaultNotice')
    : t('easySchedule.formulaTable.defaultNotice');

  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);

  useEffect(() => {
    if (!formulaRule || isLoadingFormula) return;

    const items = generateEasySchedule(firstWakeTime, {
      labels,
      ageWeeks,
      ruleId: formulaRule.id,
    });
    setScheduleItems(items);
  }, [firstWakeTime, labels, ageWeeks, formulaRule, isLoadingFormula]);

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
      setSelectedPhase({
        item,
        timing,
        endTimeLabel,
        durationLabel,
      });
      setPhaseModalVisible(true);
    },
    []
  );

  const closePhaseModal = () => {
    setPhaseModalVisible(false);
    setSelectedPhase(null);
  };

  const handleAdjustmentApplied = useCallback(
    async (itemOrder: number, newStartTime: string, newEndTime: string) => {
      if (!babyProfile) {
        return;
      }

      // Recalculate schedule from the adjusted item
      let updatedItems: EasyScheduleItem[] = [];
      setScheduleItems((currentItems) => {
        updatedItems = recalculateScheduleFromItem(
          currentItems,
          itemOrder,
          newStartTime,
          newEndTime
        );
        return updatedItems;
      });

      // Reschedule reminders if enabled
      try {
        const reminderEnabledValue = await getAppState('easyScheduleReminderEnabled');
        const reminderEnabled = reminderEnabledValue === 'true';

        if (reminderEnabled && updatedItems.length > 0) {
          const hasPermission = await requestNotificationPermissions();
          if (hasPermission) {
            const advanceMinutesValue = await getAppState('easyScheduleReminderAdvanceMinutes');
            const reminderAdvanceMinutes = advanceMinutesValue
              ? parseInt(advanceMinutesValue, 10)
              : 5;

            // Get the first wake time from the updated schedule
            const firstWakeTimeForReminders = updatedItems[0].startTime;

            const reminderLabels: EasyScheduleReminderLabels = {
              eat: labels.eat,
              activity: labels.activity,
              sleep: labels.sleep,
              yourTime: labels.yourTime,
              reminderTitle: (params) =>
                t('easySchedule.reminder.title', {
                  params: { emoji: params.emoji, activity: params.activity },
                }),
              reminderBody: (params) =>
                t('easySchedule.reminder.body', {
                  params: {
                    activity: params.activity,
                    time: params.time,
                    advance: params.advance,
                  },
                }),
            };

            // Reschedule reminders with updated schedule
            await rescheduleEasyReminders(
              babyProfile,
              firstWakeTimeForReminders,
              reminderAdvanceMinutes,
              reminderLabels
            );
          }
        }
      } catch (error) {
        console.error('Failed to reschedule reminders after adjustment:', error);
        // Don't show error to user - schedule adjustment succeeded
      }
    },
    [babyProfile, labels, t]
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
        <Text className="text-xs text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

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
        visible={phaseModalVisible}
        selectedPhase={selectedPhase}
        baseMinutes={baseMinutes}
        onClose={closePhaseModal}
        onAdjustmentApplied={handleAdjustmentApplied}
      />
    </View>
  );
}

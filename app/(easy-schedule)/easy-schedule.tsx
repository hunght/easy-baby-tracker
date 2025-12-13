import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
import { getAppState } from '@/database/app-state';
import { useLocalization } from '@/localization/LocalizationProvider';
import {
  requestNotificationPermissions,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { PhaseModal } from '@/pages/easy-schedule/components/PhaseModal';
import {
  generateEasySchedule,
  getEasyFormulaRuleByAge,
  getEasyFormulaRuleById,
  EASY_FORMULA_RULES,
  recalculateScheduleFromItem,
} from '@/lib/easy-schedule-generator';
import type { EasyScheduleItem, EasyFormulaRuleId } from '@/lib/easy-schedule-generator';

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
  const queryClient = useQueryClient();
  const wakeTimeSyncedRef = useRef<string | null>(null);
  const [firstWakeTime, setFirstWakeTime] = useState('07:00');
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null>(null);

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (babyProfile?.firstWakeTime && babyProfile.firstWakeTime !== wakeTimeSyncedRef.current) {
      wakeTimeSyncedRef.current = babyProfile.firstWakeTime;
      setFirstWakeTime(babyProfile.firstWakeTime);
    }
  }, [babyProfile?.firstWakeTime]);

  const ageWeeks = babyProfile?.birthDate ? calculateAgeInWeeks(babyProfile.birthDate) : undefined;

  const labels = {
    eat: t('easySchedule.activityLabels.eat'),
    activity: t('easySchedule.activityLabels.activity'),
    sleep: (napNumber: number) =>
      t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
    yourTime: t('easySchedule.activityLabels.yourTime'),
  };

  // Determine formula rule from database
  const availableRuleIds = EASY_FORMULA_RULES.map((rule) => rule.id);
  const storedFormulaId = babyProfile?.selectedEasyFormulaId;
  let validStoredId: EasyFormulaRuleId | undefined = undefined;
  if (storedFormulaId && availableRuleIds.some((id) => id === storedFormulaId)) {
    validStoredId = storedFormulaId as EasyFormulaRuleId;
  }

  const formulaRule = validStoredId
    ? getEasyFormulaRuleById(validStoredId)
    : getEasyFormulaRuleByAge(ageWeeks);

  const formulaNotice = validStoredId
    ? t('easySchedule.formulaTable.selectedNotice', { params: { label: t(formulaRule.labelKey) } })
    : babyProfile
      ? t('easySchedule.formulaTable.autoDetected', { params: { label: t(formulaRule.labelKey) } })
      : t('easySchedule.formulaTable.defaultNotice');

  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);

  useEffect(() => {
    const items = generateEasySchedule(firstWakeTime, {
      labels,
      ageWeeks,
      ruleId: formulaRule.id,
    });
    setScheduleItems(items);
  }, [firstWakeTime, labels.eat, labels.activity, labels.yourTime, ageWeeks, formulaRule.id]);

  const baseMinutes = timeStringToMinutes(firstWakeTime);

  const persistFirstWakeTime = useCallback(
    async (time: string) => {
      setFirstWakeTime(time);
      wakeTimeSyncedRef.current = time;

      if (!babyProfile?.id) {
        return;
      }

      try {
        await updateBabyFirstWakeTime(babyProfile.id, time);
        queryClient.setQueryData<BabyProfileRecord | null>(BABY_PROFILE_QUERY_KEY, (previous) =>
          previous ? { ...previous, firstWakeTime: time } : previous
        );
      } catch (error) {
        Alert.alert(t('common.error'), error instanceof Error ? error.message : String(error));
      }
    },
    [babyProfile?.id, queryClient, t]
  );

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

  const handleWakeTimeChange = useCallback(
    (time: string) => {
      void persistFirstWakeTime(time);
    },
    [persistFirstWakeTime]
  );

  return (
    <View className="flex-1 bg-background">
      <ScheduleHeader
        formulaRule={formulaRule}
        firstWakeTime={firstWakeTime}
        onWakeTimeChange={handleWakeTimeChange}
      />

      <ScrollView contentContainerClassName="p-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        <Text className="text-xs text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

        {groupedSchedule.map((group, groupIndex) => {
          const phases = group.items.filter((item) => item.activityType !== 'Y');
          // Calculate baseMinutes for this group by summing durations of all previous groups
          let groupBaseMinutes = baseMinutes;
          for (let i = 0; i < groupIndex; i++) {
            const previousGroupPhases = groupedSchedule[i].items.filter(
              (item) => item.activityType !== 'Y'
            );
            const previousGroupDuration = previousGroupPhases.reduce(
              (sum, item) => sum + item.durationMinutes,
              0
            );
            groupBaseMinutes += previousGroupDuration;
          }
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

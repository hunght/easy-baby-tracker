import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Text } from '@/components/ui/text';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
import { useLocalization } from '@/localization/LocalizationProvider';
import { ScheduleHeader } from '@/pages/easy-schedule/components/ScheduleHeader';
import { ScheduleGroup } from '@/pages/easy-schedule/components/ScheduleGroup';
import { PhaseModal } from '@/pages/easy-schedule/components/PhaseModal';
import {
  generateEasySchedule,
  getEasyFormulaRuleByAge,
  getEasyFormulaRuleById,
  EASY_FORMULA_RULES,
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
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

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      void persistFirstWakeTime(newTime);
    }
  };

  const openTimePicker = () => {
    const [hours, minutes] = firstWakeTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setShowTimePicker(true);
  };

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
    (newWakeTime: string) => {
      void persistFirstWakeTime(newWakeTime);
    },
    [persistFirstWakeTime]
  );

  return (
    <View className="flex-1 bg-background">
      <ScheduleHeader formulaRule={formulaRule} onOpenTimePicker={openTimePicker} />

      <ScrollView contentContainerClassName="p-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        <Text className="text-xs text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

        {groupedSchedule.map((group) => {
          const phases = group.items.filter((item) => item.activityType !== 'Y');
          return (
            <ScheduleGroup
              key={group.number}
              phases={phases}
              baseMinutes={baseMinutes}
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

      {showTimePicker && (
        <View className="rounded-t-lg bg-card pt-3">
          <Text className="mb-2 text-center text-sm font-semibold text-foreground">
            {t('easySchedule.firstWakeTimeTitle')}
          </Text>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        </View>
      )}
    </View>
  );
}

import { useLocalization } from '@/localization/LocalizationProvider';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
import { useBrandColor } from '@/hooks/use-brand-color';
import {
  EasyScheduleItem,
  calculateAgeInWeeks,
  generateEasySchedule,
  getEasyFormulaRuleByAge,
} from '@/lib/easy-schedule-generator';
import {
  requestNotificationPermissions,
  scheduleEasyScheduleReminder,
} from '@/lib/notification-scheduler';

const MINUTES_IN_DAY = 24 * 60;

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function minutesToDate(minutesFromMidnight: number): Date {
  const dayOffset = Math.floor(minutesFromMidnight / MINUTES_IN_DAY);
  const normalizedMinutes = minutesFromMidnight % MINUTES_IN_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  const targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
}

function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default function EasyScheduleScreen() {
  const router = useRouter();
  const { t, locale } = useLocalization();
  const queryClient = useQueryClient();
  const brandColors = useBrandColor();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const wakeTimeSyncedRef = useRef<string | null>(null);
  const [firstWakeTime, setFirstWakeTime] = useState('07:00');
  const [scheduleItems, setScheduleItems] = useState<EasyScheduleItem[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [currentMinutes, setCurrentMinutes] = useState(() => getCurrentMinutes());
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{
    item: EasyScheduleItem;
    timing: { startMinutes: number; endMinutes: number };
    endTimeLabel: string;
    durationLabel: string;
  } | null>(null);
  const [adjustPickerVisible, setAdjustPickerVisible] = useState(false);
  const [adjustPickerValue, setAdjustPickerValue] = useState(new Date());

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

  const ageWeeks = useMemo(() => {
    if (!babyProfile?.birthDate) {
      return undefined;
    }
    return calculateAgeInWeeks(babyProfile.birthDate);
  }, [babyProfile]);

  const labels = useMemo(
    () => ({
      eat: t('easySchedule.activityLabels.eat'),
      activity: t('easySchedule.activityLabels.activity'),
      sleep: (napNumber: number) =>
        t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
      yourTime: t('easySchedule.activityLabels.yourTime'),
    }),
    [locale, t]
  );

  const formulaRule = getEasyFormulaRuleByAge(ageWeeks);
  const formulaNotice = babyProfile
    ? t('easySchedule.formulaTable.autoDetected', { params: { label: t(formulaRule.labelKey) } })
    : t('easySchedule.formulaTable.defaultNotice');

  const baseMinutes = useMemo(() => timeStringToMinutes(firstWakeTime), [firstWakeTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const { phaseTimingMap, spansOvernight } = useMemo(() => {
    const map = new Map<number, { startMinutes: number; endMinutes: number }>();
    let offset = 0;

    scheduleItems.forEach((item) => {
      if (item.activityType === 'Y') {
        return;
      }
      const startMinutes = baseMinutes + offset;
      const endMinutes = startMinutes + item.durationMinutes;
      map.set(item.order, { startMinutes, endMinutes });
      offset += item.durationMinutes;
    });

    const spansOvernight = Array.from(map.values()).some(
      (timing) => timing.endMinutes > MINUTES_IN_DAY
    );

    return { phaseTimingMap: map, spansOvernight };
  }, [scheduleItems, baseMinutes]);

  const normalizedCurrentMinutes = useMemo(() => {
    if (currentMinutes >= baseMinutes) {
      return currentMinutes;
    }
    return spansOvernight ? currentMinutes + MINUTES_IN_DAY : currentMinutes;
  }, [baseMinutes, currentMinutes, spansOvernight]);

  // Initialize schedule
  useEffect(() => {
    const items = generateEasySchedule(firstWakeTime, { labels, ageWeeks });
    setScheduleItems(items);
  }, [firstWakeTime, labels, ageWeeks]);

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

  // Group items by starting E blocks so toddler schedules can render multiple segments
  const groupedSchedule = useMemo(() => {
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
  }, [scheduleItems]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'E':
        return '🍼';
      case 'A':
        return '🧸';
      case 'S':
        return '😴';
      case 'Y':
        return '☕';
      default:
        return '•';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}${locale === 'vi' ? 'p' : 'm'}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}${locale === 'vi' ? 'g' : 'h'}`;
    }
    return `${hours}${locale === 'vi' ? 'g' : 'h'}${mins}${locale === 'vi' ? 'p' : 'm'}`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, mins] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const showPhaseInfo = (item: EasyScheduleItem, endTime: string, duration: string) => {
    Alert.alert(item.label, `${item.startTime} → ${endTime}\n${duration}`);
  };

  const handleScheduleReminder = useCallback(
    async (item: EasyScheduleItem, targetMinutes: number, endTimeLabel: string) => {
      const targetDate = minutesToDate(targetMinutes);
      const now = new Date();
      const secondsUntil = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

      if (secondsUntil <= 0) {
        Alert.alert(t('easySchedule.reminder.pastTitle'), t('easySchedule.reminder.pastMessage'));
        return;
      }

      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          t('easySchedule.reminder.permissionDeniedTitle'),
          t('easySchedule.reminder.permissionDeniedBody')
        );
        return;
      }

      try {
        const notificationId = await scheduleEasyScheduleReminder({
          targetDate,
          activityType: item.activityType,
          label: item.label,
          notificationTitle: t('easySchedule.reminder.notificationTitle'),
          notificationBody: t('easySchedule.reminder.notificationBody', {
            params: { label: item.label, time: endTimeLabel },
          }),
        });

        if (notificationId) {
          Alert.alert(
            t('easySchedule.reminder.scheduledTitle'),
            t('easySchedule.reminder.scheduledBody', { params: { time: endTimeLabel } })
          );
        } else {
          Alert.alert(t('common.error'), t('easySchedule.reminder.scheduleError'));
        }
      } catch (error) {
        Alert.alert(t('common.error'), error instanceof Error ? error.message : String(error));
      }
    },
    [t]
  );

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
    setAdjustPickerVisible(false);
  };

  const openAdjustPicker = () => {
    if (!selectedPhase) return;
    setAdjustPickerValue(minutesToDate(selectedPhase.timing.startMinutes));
    setAdjustPickerVisible(true);
  };

  const handleAdjustPickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setAdjustPickerValue(date);
    }
  };

  const applyAdjustment = () => {
    if (!selectedPhase) return;
    const dayOffset = Math.floor(selectedPhase.timing.startMinutes / MINUTES_IN_DAY);
    const pickedMinutes = adjustPickerValue.getHours() * 60 + adjustPickerValue.getMinutes();
    const absoluteMinutes = dayOffset * MINUTES_IN_DAY + pickedMinutes;
    const delta = absoluteMinutes - selectedPhase.timing.startMinutes;
    const newFirstMinutes = baseMinutes + delta;
    void persistFirstWakeTime(minutesToTimeString(newFirstMinutes));
    setAdjustPickerVisible(false);
    setPhaseModalVisible(false);
  };

  const getPhaseStyles = (type: string) => {
    // Phase backgrounds with dark mode support
    // Use lighter tints in light mode, darker muted tones in dark mode
    const lightMap: Record<string, string> = {
      E: '#FFF2F6', // Light pink tint (accent-related)
      A: '#EBF8F1', // Light green tint (mint-related)
      S: '#EFF3FF', // Light blue tint (primary-related)
    };

    const darkMap: Record<string, string> = {
      E: 'rgba(255, 138, 184, 0.15)', // Accent pink with opacity
      A: 'rgba(127, 227, 204, 0.15)', // Mint with opacity
      S: 'rgba(91, 127, 255, 0.15)', // Primary blue with opacity
    };

    return {
      container: {
        backgroundColor: isDark
          ? (darkMap[type] ?? 'rgba(245, 247, 250, 0.1)')
          : (lightMap[type] ?? '#F5F7FA'),
      },
    };
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
        <Pressable onPress={() => router.back()} testID="btn-close">
          <Text className="text-base font-semibold text-accent">{t('common.close')}</Text>
        </Pressable>
        <Text
          className="mx-3 flex-1 text-center text-xl font-bold text-foreground"
          numberOfLines={1}
          ellipsizeMode="tail">
          {t('easySchedule.title')}
        </Text>
        <TouchableOpacity onPress={openTimePicker} className="p-1" accessibilityRole="button">
          <Ionicons name="time-outline" size={24} color={brandColors.colors.lavender} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center gap-2.5 rounded-lg border border-border bg-card p-3 dark:bg-card/80"
            onPress={() =>
              router.push({ pathname: '/easy-schedule-info', params: { ruleId: formulaRule.id } })
            }
            accessibilityRole="button"
            accessibilityLabel={t('easySchedule.viewDetails')}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={brandColors.colors.lavender}
              className="mr-2.5"
            />
            <View className="flex-1">
              <Text
                className="text-sm font-semibold text-foreground"
                numberOfLines={1}
                ellipsizeMode="tail">
                {t(formulaRule.labelKey)}
              </Text>
              <Text
                className="text-xs text-muted-foreground"
                numberOfLines={1}
                ellipsizeMode="tail">
                {t(formulaRule.ageRangeKey)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

        {groupedSchedule.map((group) => {
          const phases = group.items.filter((item) => item.activityType !== 'Y');
          return (
            <View
              key={group.number}
              className="flex-row justify-between gap-2 rounded-lg border border-border bg-card p-3 dark:bg-card/50">
              {phases.map((item) => {
                const endTime = calculateEndTime(item.startTime, item.durationMinutes);
                const duration = formatDuration(item.durationMinutes);
                const phaseStyles = getPhaseStyles(item.activityType);
                const timing = phaseTimingMap.get(item.order);
                const startMinutes = timing?.startMinutes ?? timeStringToMinutes(item.startTime);
                const endMinutes = timing?.endMinutes ?? startMinutes + item.durationMinutes;
                const isCurrentPhase =
                  normalizedCurrentMinutes >= startMinutes && normalizedCurrentMinutes < endMinutes;
                const isPastPhase = normalizedCurrentMinutes >= endMinutes;
                const totalPhaseMinutes = endMinutes - startMinutes;
                const progressRatio =
                  isCurrentPhase && totalPhaseMinutes > 0
                    ? (normalizedCurrentMinutes - startMinutes) / totalPhaseMinutes
                    : 0;
                const clampedProgress = Math.min(Math.max(progressRatio, 0), 1);

                return (
                  <TouchableOpacity
                    key={`${group.number}-${item.order}`}
                    className={`relative min-h-[94px] flex-1 items-start justify-center overflow-hidden rounded-lg px-2.5 py-2.5 ${
                      isCurrentPhase
                        ? 'border border-lavender shadow-md shadow-lavender/15 dark:shadow-lavender/30'
                        : 'border border-transparent'
                    } ${!isCurrentPhase && isPastPhase ? 'opacity-60' : ''}`}
                    style={{ backgroundColor: phaseStyles.container.backgroundColor }}
                    activeOpacity={0.9}
                    onPress={() =>
                      openPhaseModal(item, { startMinutes, endMinutes }, endTime, duration)
                    }>
                    {isCurrentPhase && (
                      <View
                        pointerEvents="none"
                        className="bg-lavender/16 absolute bottom-0 left-0 top-0 z-0 dark:bg-lavender/25"
                        style={{ width: `${clampedProgress * 100}%` }}
                      />
                    )}
                    <TouchableOpacity
                      onPress={() => showPhaseInfo(item, endTime, duration)}
                      className="absolute right-1.5 top-1.5 z-[2] p-1"
                      accessibilityRole="button"
                      accessibilityLabel={item.label}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={brandColors.colors.lavender}
                      />
                    </TouchableOpacity>
                    <Text className="mb-1 text-lg">{getActivityIcon(item.activityType)}</Text>
                    <View className="w-full">
                      <Text className="text-sm font-semibold text-foreground">
                        {item.startTime} → {endTime}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted-foreground">{duration}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        transparent
        visible={phaseModalVisible}
        animationType="fade"
        onRequestClose={closePhaseModal}>
        <View className="flex-1 justify-center bg-black/50 p-6 dark:bg-black/70">
          <View className="rounded-lg bg-card p-5 dark:bg-card">
            {selectedPhase && (
              <>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-foreground">
                    {selectedPhase.item.label}
                  </Text>
                  <TouchableOpacity onPress={closePhaseModal} testID="modal-close">
                    <Ionicons name="close" size={22} color={brandColors.colors.black} />
                  </TouchableOpacity>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {selectedPhase.item.startTime} → {selectedPhase.endTimeLabel}
                </Text>
                <Text className="mb-4 text-[13px] text-muted-foreground">
                  {selectedPhase.durationLabel}
                </Text>
                <View className="gap-3">
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 rounded-lg bg-lavender py-3"
                    onPress={() =>
                      handleScheduleReminder(
                        selectedPhase.item,
                        selectedPhase.timing.endMinutes,
                        selectedPhase.endTimeLabel
                      )
                    }>
                    <Ionicons name="alarm-outline" size={18} color={brandColors.colors.white} />
                    <Text className="text-lavender-foreground font-semibold">
                      {t('easySchedule.phaseModal.setReminder')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 rounded-lg border border-border py-3"
                    onPress={openAdjustPicker}>
                    <Ionicons name="time-outline" size={18} color={brandColors.colors.lavender} />
                    <Text className="font-semibold text-lavender">
                      {t('easySchedule.phaseModal.adjustTime')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {adjustPickerVisible && (
                  <View className="mt-5 rounded-lg border border-border bg-card p-4">
                    <Text className="mb-2 text-center text-sm font-semibold text-foreground">
                      {t('easySchedule.phaseModal.adjustHeading')}
                    </Text>
                    <DateTimePicker
                      value={adjustPickerValue}
                      mode="time"
                      is24Hour
                      display="spinner"
                      onChange={handleAdjustPickerChange}
                    />
                    <View className="mt-3 flex-row justify-between gap-3">
                      <TouchableOpacity
                        className="flex-1 items-center rounded-md border border-border py-2.5"
                        onPress={() => setAdjustPickerVisible(false)}>
                        <Text className="font-semibold text-muted-foreground">
                          {t('common.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 items-center rounded-md bg-lavender py-2.5"
                        onPress={applyAdjustment}>
                        <Text className="text-lavender-foreground font-semibold">
                          {t('common.save')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

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

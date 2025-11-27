import { useLocalization } from '@/localization/LocalizationProvider';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateBabyFirstWakeTime } from '@/database/baby-profile';
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
      sleep: (napNumber: number) => t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
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

    const spansOvernight = Array.from(map.values()).some((timing) => timing.endMinutes > MINUTES_IN_DAY);

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
        Alert.alert(t('common.error'), (error as Error).message);
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
        Alert.alert(t('common.error'), (error as Error).message);
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
    const map: Record<string, string> = {
      E: '#FFF2F6',
      A: '#EBF8F1',
      S: '#EFF3FF',
    };

    return {
      container: {
        backgroundColor: map[type] ?? '#F5F5F5',
      },
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {t('easySchedule.title')}
        </Text>
        <TouchableOpacity onPress={openTimePicker} style={styles.headerIconButton} accessibilityRole="button">
          <Ionicons name="time-outline" size={24} color="#9B7EBD" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.ruleChip}
            onPress={() => router.push({ pathname: '/easy-schedule-info', params: { ruleId: formulaRule.id } })}
            accessibilityRole="button"
            accessibilityLabel={t('easySchedule.viewDetails')}
          >
            <Ionicons name="information-circle-outline" size={18} color="#6D4F91" style={styles.quickIcon} />
            <View style={styles.chipTextContainer}>
              <Text style={styles.ruleChipTitle} numberOfLines={1} ellipsizeMode="tail">
                {t(formulaRule.labelKey)}
              </Text>
              <Text style={styles.ruleChipSub} numberOfLines={1} ellipsizeMode="tail">
                {t(formulaRule.ageRangeKey)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.noticeText} numberOfLines={1} ellipsizeMode="tail">
          {formulaNotice}
        </Text>

        {groupedSchedule.map((group) => {
          const phases = group.items.filter((item) => item.activityType !== 'Y');
          return (
            <View key={group.number} style={styles.compactCard}>
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
                    style={[
                      styles.compactPhase,
                      phaseStyles.container,
                      isCurrentPhase && styles.compactPhaseActive,
                      !isCurrentPhase && isPastPhase && styles.compactPhasePast,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => openPhaseModal(item, { startMinutes, endMinutes }, endTime, duration)}
                  >
                    {isCurrentPhase && (
                      <View
                        pointerEvents="none"
                        style={[styles.phaseProgressFill, { width: `${clampedProgress * 100}%` }]}
                      />
                    )}
                    <TouchableOpacity
                      onPress={() => showPhaseInfo(item, endTime, duration)}
                      style={styles.phaseInfoButton}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Ionicons name="information-circle-outline" size={16} color="#6D4F91" />
                    </TouchableOpacity>
                    <Text style={styles.phaseIcon}>{getActivityIcon(item.activityType)}</Text>
                    <View style={styles.phaseTextWrap}>
                      <Text style={[styles.phaseTime, isCurrentPhase && styles.phaseTimeActive]}>
                        {item.startTime} → {endTime}
                      </Text>
                      <Text style={styles.phaseDuration}>{duration}</Text>
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
        onRequestClose={closePhaseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedPhase && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPhase.item.label}</Text>
                  <TouchableOpacity onPress={closePhaseModal}>
                    <Ionicons name="close" size={22} color="#2D2D2D" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTime}>
                  {selectedPhase.item.startTime} → {selectedPhase.endTimeLabel}
                </Text>
                <Text style={styles.modalDuration}>{selectedPhase.durationLabel}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionPrimary}
                    onPress={() =>
                      handleScheduleReminder(
                        selectedPhase.item,
                        selectedPhase.timing.endMinutes,
                        selectedPhase.endTimeLabel
                      )
                    }
                  >
                    <Ionicons name="alarm-outline" size={18} color="#FFF" />
                    <Text style={styles.modalActionPrimaryText}>
                      {t('easySchedule.phaseModal.setReminder')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalActionSecondary} onPress={openAdjustPicker}>
                    <Ionicons name="time-outline" size={18} color="#6D4F91" />
                    <Text style={styles.modalActionSecondaryText}>
                      {t('easySchedule.phaseModal.adjustTime')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {adjustPickerVisible && (
                  <View style={styles.adjustPickerCard}>
                    <Text style={styles.adjustPickerTitle}>
                      {t('easySchedule.phaseModal.adjustHeading')}
                    </Text>
                    <DateTimePicker
                      value={adjustPickerValue}
                      mode="time"
                      is24Hour
                      display="spinner"
                      onChange={handleAdjustPickerChange}
                    />
                    <View style={styles.adjustPickerActions}>
                      <TouchableOpacity
                        style={styles.adjustPickerButtonSecondary}
                        onPress={() => setAdjustPickerVisible(false)}
                      >
                        <Text style={styles.adjustPickerButtonSecondaryText}>
                          {t('common.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.adjustPickerButtonPrimary}
                        onPress={applyAdjustment}
                      >
                        <Text style={styles.adjustPickerButtonPrimaryText}>
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

      {
        showTimePicker && (
          <View style={styles.timePickerSheet}>
            <Text style={styles.timePickerTitle}>{t('easySchedule.firstWakeTimeTitle')}</Text>
            <DateTimePicker
              value={tempTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
            />
          </View>
        )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerIconButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickIcon: {
    marginRight: 10,
  },
  ruleChip: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#F5EFFA',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipTextContainer: {
    flex: 1,
  },
  ruleChipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C3A6D',
  },
  ruleChipSub: {
    fontSize: 12,
    color: '#7B6F9D',
  },
  noticeText: {
    fontSize: 12,
    color: '#7B6F9D',
  },
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E9FA',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactPhase: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 94,
    overflow: 'hidden',
  },
  compactPhaseActive: {
    borderWidth: 1,
    borderColor: '#7B5AB1',
    shadowColor: '#7B5AB1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  compactPhasePast: {
    opacity: 0.6,
  },
  phaseIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  phaseTextWrap: {
    width: '100%',
  },
  phaseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  phaseTimeActive: {
    color: '#4C3A6D',
  },
  phaseDuration: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  phaseInfoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    zIndex: 2,
  },
  phaseProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(109, 79, 145, 0.16)',
    zIndex: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  modalTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C3A6D',
  },
  modalDuration: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  modalActions: {
    gap: 12,
  },
  modalActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7B5AB1',
    borderRadius: 12,
    paddingVertical: 12,
  },
  modalActionPrimaryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5DDF4',
    borderRadius: 12,
    paddingVertical: 12,
  },
  modalActionSecondaryText: {
    color: '#6D4F91',
    fontWeight: '600',
  },
  adjustPickerCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F0E9FA',
    borderRadius: 16,
    padding: 16,
  },
  adjustPickerTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  adjustPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  adjustPickerButtonSecondary: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  adjustPickerButtonSecondaryText: {
    color: '#6B6B6B',
    fontWeight: '600',
  },
  adjustPickerButtonPrimary: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#7B5AB1',
    paddingVertical: 10,
    alignItems: 'center',
  },
  adjustPickerButtonPrimaryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  timePickerSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
});

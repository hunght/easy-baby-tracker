import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { ModalHeader } from '@/components/ModalHeader';
import { StickySaveBar } from '@/components/StickySaveBar';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { useLocalization } from '@/localization/LocalizationProvider';
import { adjustSchedulePhaseTiming } from '@/database/easy-formula-rules';
import { getActiveBabyProfile } from '@/database/baby-profile';
import { BABY_PROFILE_QUERY_KEY, formulaRuleByIdKey } from '@/constants/query-keys';

const MINUTES_IN_DAY = 1440;

function minutesToDate(minutes: number): Date {
  const dayOffset = Math.floor(minutes / MINUTES_IN_DAY);
  const minutesInDay = minutes % MINUTES_IN_DAY;
  const hours = Math.floor(minutesInDay / 60);
  const mins = minutesInDay % 60;
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, mins, 0, 0);
  return date;
}

function minutesToTimeString(minutes: number): string {
  const normalizedMinutes = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

type ActivityType = 'E' | 'A' | 'S' | 'Y';

function getActivityStyle(activityType: ActivityType) {
  switch (activityType) {
    case 'E':
      return { icon: 'silverware-fork-knife' as const, color: '#F97316', bg: 'bg-orange-500/10' };
    case 'A':
      return { icon: 'play-circle' as const, color: '#3B82F6', bg: 'bg-blue-500/10' };
    case 'S':
      return { icon: 'moon-waning-crescent' as const, color: '#8B5CF6', bg: 'bg-purple-500/10' };
    default:
      return { icon: 'account' as const, color: '#10B981', bg: 'bg-emerald-500/10' };
  }
}

export default function PhaseEditScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    order: string;
    label: string;
    activityType: string;
    startMinutes: string;
    endMinutes: string;
  }>();

  const order = Number(params.order);
  const label = params.label ?? '';
  const activityTypeRaw = params.activityType ?? 'E';
  const activityType: ActivityType =
    activityTypeRaw === 'E' ||
    activityTypeRaw === 'A' ||
    activityTypeRaw === 'S' ||
    activityTypeRaw === 'Y'
      ? activityTypeRaw
      : 'E';
  const initialStartMinutes = Number(params.startMinutes);
  const initialEndMinutes = Number(params.endMinutes);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());
  const [currentStartMinutes, setCurrentStartMinutes] = useState(0);
  const [currentEndMinutes, setCurrentEndMinutes] = useState(0);

  // Get baby profile
  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Initialize values
  useEffect(() => {
    const startTime = minutesToTimeString(initialStartMinutes);
    const endTime = minutesToTimeString(initialEndMinutes);
    setStartTimeValue(startTime);
    setEndTimeValue(endTime);
    setStartTimeDate(minutesToDate(initialStartMinutes));
    setEndTimeDate(minutesToDate(initialEndMinutes));
    setCurrentStartMinutes(initialStartMinutes);
    setCurrentEndMinutes(initialEndMinutes);
  }, [initialStartMinutes, initialEndMinutes]);

  const handleStartTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStartTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const newStartMinutes = date.getHours() * 60 + date.getMinutes();
      const timeDiff = newStartMinutes - currentStartMinutes;

      const newEndMinutes = currentEndMinutes + timeDiff;
      const newEndTime = minutesToTimeString(newEndMinutes);
      const newEndDate = minutesToDate(newEndMinutes);

      setStartTimeValue(timeString);
      setEndTimeValue(newEndTime);
      setEndTimeDate(newEndDate);
      setCurrentStartMinutes(newStartMinutes);
      setCurrentEndMinutes(newEndMinutes);
    }
  };

  const handleEndTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEndTimeDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEndTimeValue(timeString);
      setCurrentEndMinutes(date.getHours() * 60 + date.getMinutes());
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!startTimeValue || !endTimeValue || !babyProfile) {
        throw new Error('Missing required data');
      }

      return await adjustSchedulePhaseTiming({
        babyId: babyProfile.id,
        itemOrder: order,
        newStartTime: startTimeValue,
        newEndTime: endTimeValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });
      if (babyProfile?.selectedEasyFormulaId) {
        queryClient.invalidateQueries({
          queryKey: formulaRuleByIdKey(babyProfile.selectedEasyFormulaId, babyProfile.id),
        });
      }

      const oldStartTime = minutesToTimeString(initialStartMinutes);
      const _startChanged = oldStartTime !== startTimeValue;

      const activityLabel =
        activityType === 'E'
          ? t('easySchedule.activityLabels.eat')
          : activityType === 'A'
            ? t('easySchedule.activityLabels.activity')
            : activityType === 'S'
              ? t('easySchedule.activityLabels.sleep').replace('{{number}}', '')
              : t('easySchedule.activityLabels.yourTime');

      showNotification(
        t('easySchedule.phaseModal.adjustmentSuccess', {
          defaultValue: `Schedule adjusted: ${activityLabel}`,
          params: { activity: activityLabel },
        }),
        'success'
      );
      router.back();
    },
    onError: (error) => {
      console.error('Failed to save adjustment:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSave = () => {
    if (!startTimeValue || !endTimeValue) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const oldStartTime = minutesToTimeString(initialStartMinutes);
    const oldEndTime = minutesToTimeString(initialEndMinutes);

    const startChanged = oldStartTime !== startTimeValue;
    const endChanged = oldEndTime !== endTimeValue;

    if (startChanged || endChanged) {
      mutation.mutate();
    } else {
      router.back();
    }
  };

  const activityStyle = getActivityStyle(activityType);
  const newDuration = currentEndMinutes - currentStartMinutes;

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={t('easySchedule.phaseModal.editTitle', { defaultValue: 'Edit Time' })}
        closeLabel={t('common.close')}
      />

      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-4">
            <View
              className={`h-16 w-16 items-center justify-center rounded-2xl ${activityStyle.bg}`}>
              <MaterialCommunityIcons
                name={activityStyle.icon}
                size={32}
                color={activityStyle.color}
              />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{label}</Text>
              <Text className="text-lg text-muted-foreground">
                {formatDuration(
                  newDuration > 0 ? newDuration : initialEndMinutes - initialStartMinutes
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Selection Cards */}
        <View className="mb-4 gap-3">
          {/* Start Time Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowStartPicker(true);
            }}
            className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <MaterialCommunityIcons name="clock-start" size={24} color="#666" />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">
                  {t('easySchedule.phaseModal.startTime')}
                </Text>
                <Text className="text-2xl font-bold text-foreground">{startTimeValue}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </Pressable>

          {/* End Time Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEndPicker(true);
            }}
            className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <MaterialCommunityIcons name="clock-end" size={24} color="#666" />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">
                  {t('easySchedule.phaseModal.endTime')}
                </Text>
                <Text className="text-2xl font-bold text-foreground">{endTimeValue}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
        </View>

        {/* Notice */}
        <View className="flex-row items-start gap-3 rounded-2xl bg-accent/10 p-4">
          <MaterialCommunityIcons name="information-outline" size={20} color="#7C3AED" />
          <Text className="flex-1 text-sm leading-5 text-muted-foreground">
            {t('easySchedule.phaseModal.todayOnlyNotice', {
              defaultValue: 'Changes apply only for today and will reset tomorrow',
            })}
          </Text>
        </View>
      </ScrollView>

      <StickySaveBar onPress={handleSave} isSaving={mutation.isPending} />

      {/* Time Pickers */}
      <DateTimePickerModal
        visible={showStartPicker}
        value={startTimeDate}
        mode="time"
        onClose={() => setShowStartPicker(false)}
        onChange={handleStartTimeChange}
      />
      <DateTimePickerModal
        visible={showEndPicker}
        value={endTimeDate}
        mode="time"
        onClose={() => setShowEndPicker(false)}
        onChange={handleEndTimeChange}
      />
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View, Pressable, TouchableOpacity } from 'react-native';

import { Text } from '@/components/ui/text';
import { useNotification } from '@/components/NotificationContext';
import { BABY_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateSelectedEasyFormula } from '@/database/baby-profile';
import { getAppState } from '@/database/app-state';
import { useBrandColor } from '@/hooks/use-brand-color';
import {
  EASY_FORMULA_RULES,
  type EasyFormulaRuleId,
  getEasyFormulaRuleByAge,
  getEasyFormulaRuleById,
} from '@/lib/easy-schedule-generator';
import {
  requestNotificationPermissions,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { useLocalization } from '@/localization/LocalizationProvider';

function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
}

export default function EasyScheduleSelectScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  const ageWeeks = babyProfile?.birthDate ? calculateAgeInWeeks(babyProfile.birthDate) : undefined;

  const availableRuleIds = EASY_FORMULA_RULES.map((rule) => rule.id);
  const storedFormulaId = babyProfile?.selectedEasyFormulaId;
  let validStoredId: EasyFormulaRuleId | undefined = undefined;
  if (storedFormulaId && availableRuleIds.some((id) => id === storedFormulaId)) {
    validStoredId = storedFormulaId as EasyFormulaRuleId;
  }

  const formulaRule = validStoredId
    ? getEasyFormulaRuleById(validStoredId)
    : getEasyFormulaRuleByAge(ageWeeks);

  const mutation = useMutation({
    mutationFn: async (ruleId: EasyFormulaRuleId) => {
      if (!babyProfile?.id) {
        throw new Error('No active baby profile');
      }
      await updateSelectedEasyFormula(babyProfile.id, ruleId);
    },
    onSuccess: async (_data, ruleId) => {
      // Update query cache with new formula
      const updatedProfile = queryClient.setQueryData<BabyProfileRecord | null>(
        BABY_PROFILE_QUERY_KEY,
        (previous) => (previous ? { ...previous, selectedEasyFormulaId: ruleId } : previous)
      );

      // Check if reminders are enabled and reschedule them
      const reminderEnabledValue = await getAppState('easyScheduleReminderEnabled');
      const reminderEnabled = reminderEnabledValue === 'true';

      if (reminderEnabled && updatedProfile) {
        try {
          const hasPermission = await requestNotificationPermissions();
          if (hasPermission) {
            const advanceMinutesValue = await getAppState('easyScheduleReminderAdvanceMinutes');
            const reminderAdvanceMinutes = advanceMinutesValue
              ? parseInt(advanceMinutesValue, 10)
              : 5;

            const firstWakeTime = updatedProfile.firstWakeTime || '07:00';

            const labels: EasyScheduleReminderLabels = {
              eat: t('easySchedule.activityLabels.eat'),
              activity: t('easySchedule.activityLabels.activity'),
              sleep: (napNumber: number) =>
                t('easySchedule.activityLabels.sleep').replace('{{number}}', String(napNumber)),
              yourTime: t('easySchedule.activityLabels.yourTime'),
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

            await rescheduleEasyReminders(
              updatedProfile,
              firstWakeTime,
              reminderAdvanceMinutes,
              labels
            );
          }
        } catch (error) {
          console.error('Failed to reschedule reminders after formula change:', error);
          // Don't show error to user - formula update succeeded, reminder update is secondary
        }
      }

      showNotification(t('easySchedule.formulaUpdated'), 'success');
      setTimeout(() => router.back(), 300);
    },
    onError: (error) => {
      console.error('Failed to update formula:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSelectFormula = (ruleId: EasyFormulaRuleId) => {
    mutation.mutate(ruleId);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}>
          <Text className="text-base font-semibold text-accent">{t('common.close')}</Text>
        </Pressable>
        <Text
          className="mx-3 flex-1 text-center text-xl font-bold text-foreground"
          numberOfLines={1}
          ellipsizeMode="tail">
          {t('easySchedule.selectFormulaTitle')}
        </Text>
        <View className="w-7" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-10 gap-3"
        showsVerticalScrollIndicator={false}>
        {EASY_FORMULA_RULES.map((rule) => {
          const isActive = rule.id === formulaRule.id;
          return (
            <TouchableOpacity
              key={rule.id}
              className={`rounded-lg border p-4 ${
                isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
              accessibilityRole="button"
              accessibilityLabel={t(rule.labelKey)}
              disabled={mutation.isPending}
              onPress={() => handleSelectFormula(rule.id)}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                    {t(rule.labelKey)}
                  </Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {t(rule.ageRangeKey)}
                  </Text>
                </View>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'chevron-forward'}
                  size={20}
                  color={isActive ? brandColors.colors.lavender : brandColors.colors.black}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

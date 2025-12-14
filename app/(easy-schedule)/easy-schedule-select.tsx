import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View, Pressable, TouchableOpacity } from 'react-native';

import { Text } from '@/components/ui/text';
import { useNotification } from '@/components/NotificationContext';
import {
  BABY_PROFILE_QUERY_KEY,
  PREDEFINED_FORMULA_RULES_QUERY_KEY,
  userCustomFormulaRulesKey,
  daySpecificFormulaRulesKey,
  formulaRuleByIdKey,
} from '@/constants/query-keys';
import type { BabyProfileRecord } from '@/database/baby-profile';
import { getActiveBabyProfile, updateSelectedEasyFormula } from '@/database/baby-profile';
import { getAppState } from '@/database/app-state';
import {
  getFormulaRuleById,
  getPredefinedFormulaRules,
  getUserCustomFormulaRules,
  getDaySpecificFormulaRules,
} from '@/database/easy-formula-rules';
import { useBrandColor } from '@/hooks/use-brand-color';
import type { EasyFormulaRuleId } from '@/lib/easy-schedule-generator';
import {
  requestNotificationPermissions,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from '@/lib/notification-scheduler';
import { useLocalization } from '@/localization/LocalizationProvider';

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

  // Fetch predefined formulas
  const { data: predefinedRules = [], isLoading: isLoadingPredefined } = useQuery({
    queryKey: PREDEFINED_FORMULA_RULES_QUERY_KEY,
    queryFn: getPredefinedFormulaRules,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user custom formulas
  const { data: userCustomRules = [], isLoading: isLoadingUserCustom } = useQuery({
    queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0),
    queryFn: () => getUserCustomFormulaRules(babyProfile!.id),
    enabled: !!babyProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch day-specific (temporary) formulas
  const { data: daySpecificRules = [], isLoading: isLoadingDaySpecific } = useQuery({
    queryKey: daySpecificFormulaRulesKey(babyProfile?.id ?? 0),
    queryFn: () => getDaySpecificFormulaRules(babyProfile!.id),
    enabled: !!babyProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Get the active formula by selected ID from database
  const { data: formulaRule } = useQuery({
    queryKey: formulaRuleByIdKey(babyProfile?.selectedEasyFormulaId ?? '', babyProfile?.id),
    queryFn: () => getFormulaRuleById(babyProfile!.selectedEasyFormulaId!, babyProfile?.id),
    enabled: !!babyProfile?.selectedEasyFormulaId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoadingFormula = isLoadingPredefined || isLoadingUserCustom || isLoadingDaySpecific;

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
      setTimeout(() => {
        try {
          if (router.canGoBack()) {
            router.back();
          }
        } catch (error) {
          console.warn('Navigation error:', error);
        }
      }, 500);
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

      {isLoadingFormula && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      )}

      {!isLoadingFormula && (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-10 gap-4"
          showsVerticalScrollIndicator={false}>
          {/* Predefined Rules Group */}
          {predefinedRules.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('easySchedule.formulaGroups.predefined')}
              </Text>
              {predefinedRules.map((rule) => {
                const isActive = rule.id === formulaRule?.id;
                return (
                  <TouchableOpacity
                    key={rule.id}
                    className={`rounded-lg border p-4 ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={rule.labelKey ? t(rule.labelKey) : rule.labelText || ''}
                    disabled={mutation.isPending}
                    onPress={() => handleSelectFormula(rule.id)}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {rule.labelKey ? t(rule.labelKey) : rule.labelText || rule.id}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {rule.ageRangeKey ? t(rule.ageRangeKey) : rule.ageRangeText || ''}
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
            </View>
          )}

          {/* User Custom Rules Group */}
          {userCustomRules.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('easySchedule.formulaGroups.userCustom')}
              </Text>
              {userCustomRules.map((rule) => {
                const isActive = rule.id === formulaRule?.id;
                return (
                  <TouchableOpacity
                    key={rule.id}
                    className={`rounded-lg border p-4 ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={rule.labelText || rule.labelKey || rule.id}
                    disabled={mutation.isPending}
                    onPress={() => handleSelectFormula(rule.id)}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {rule.labelText || (rule.labelKey ? t(rule.labelKey) : rule.id)}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {rule.ageRangeText ||
                            (rule.ageRangeKey ? t(rule.ageRangeKey) : '') ||
                            t('easySchedule.formulaGroups.custom')}
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
            </View>
          )}

          {/* Day-Specific (Temporary) Rules Group */}
          {daySpecificRules.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('easySchedule.formulaGroups.daySpecific')}
              </Text>
              {daySpecificRules.map((rule) => {
                const isActive = rule.id === formulaRule?.id;
                const dateStr = rule.validDate
                  ? new Date(rule.validDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';
                return (
                  <TouchableOpacity
                    key={rule.id}
                    className={`rounded-lg border p-4 ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={
                      rule.labelText ||
                      (rule.labelKey ? t(rule.labelKey) : rule.id) +
                        (dateStr ? ` - ${dateStr}` : '')
                    }
                    disabled={mutation.isPending}
                    onPress={() => handleSelectFormula(rule.id)}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {rule.labelText || (rule.labelKey ? t(rule.labelKey) : rule.id)}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {dateStr || t('easySchedule.formulaGroups.temporary')}
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
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

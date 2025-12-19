import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View, Pressable, TouchableOpacity, Alert } from 'react-native';

import { Text } from '@/components/ui/text';
import { useNotification } from '@/components/NotificationContext';
import {
  BABY_PROFILE_QUERY_KEY,
  PREDEFINED_FORMULA_RULES_QUERY_KEY,
  userCustomFormulaRulesKey,
  daySpecificFormulaRulesKey,
  formulaRuleByIdKey,
} from '@/constants/query-keys';
import { getActiveBabyProfile , updateSelectedEasyFormula } from '@/database/baby-profile';
import {
  getFormulaRuleById,
  getPredefinedFormulaRules,
  getUserCustomFormulaRules,
  getDaySpecificFormulaRules,
  deleteCustomFormulaRule,
} from '@/database/easy-formula-rules';
import { useBrandColor } from '@/hooks/use-brand-color';
import type { EasyFormulaRuleId } from '@/lib/easy-schedule-generator';
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
    onSuccess: () => {
      // Invalidate query to refresh baby profile
      queryClient.invalidateQueries({ queryKey: BABY_PROFILE_QUERY_KEY });

      showNotification(t('easySchedule.formulaUpdated'), 'success');

      if (router.canGoBack()) {
        router.back();
      }
    },
    onError: (error) => {
      console.error('Failed to update formula:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSelectFormula = (ruleId: EasyFormulaRuleId) => {
    mutation.mutate(ruleId);
  };

  const deleteMutation = useMutation({
    mutationFn: async (payload: { ruleId: string; babyId: number }) => {
      await deleteCustomFormulaRule(payload.ruleId, payload.babyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0) });
      queryClient.invalidateQueries({ queryKey: daySpecificFormulaRulesKey(babyProfile?.id ?? 0) });
      showNotification(t('common.deleteSuccess'), 'success');
    },
    onError: (error) => {
      console.error('Failed to delete formula:', error);
      showNotification(t('common.deleteError'), 'error');
    },
  });

  const handleDeleteFormula = (ruleId: string, ruleName: string) => {
    // Check if this is the currently active formula
    if (formulaRule?.id === ruleId) {
      showNotification(t('easySchedule.deleteFormula.cannotDeleteActive'), 'error');
      return;
    }

    if (!babyProfile?.id) {
      showNotification(t('common.error'), 'error');
      return;
    }

    Alert.alert(
      t('easySchedule.deleteFormula.title'),
      t('easySchedule.deleteFormula.message', { params: { name: ruleName } }),
      [
        {
          text: t('easySchedule.deleteFormula.cancel'),
          style: 'cancel',
        },
        {
          text: t('easySchedule.deleteFormula.confirm'),
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate({ ruleId, babyId: babyProfile.id });
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
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
        <Pressable
          onPress={() => router.push('/(easy-schedule)/easy-schedule-create')}
          accessibilityRole="button"
          accessibilityLabel={t('easySchedule.createFormula')}>
          <Ionicons name="add-circle-outline" size={28} color={brandColors.colors.primary} />
        </Pressable>
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
                  <View
                    key={rule.id}
                    className={`flex-row items-center gap-2 rounded-lg border ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}>
                    <TouchableOpacity
                      className="flex-1 p-4"
                      accessibilityRole="button"
                      accessibilityLabel={rule.labelKey ? t(rule.labelKey) : rule.labelText || ''}
                      onPress={() =>
                        router.push(`/(easy-schedule)/easy-schedule-form?ruleId=${rule.id}`)
                      }>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {rule.labelKey ? t(rule.labelKey) : rule.labelText || rule.id}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {rule.ageRangeKey ? t(rule.ageRangeKey) : rule.ageRangeText || ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isActive ? (
                      <View className="px-4 py-4">
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={brandColors.colors.primary}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="px-4 py-4"
                        accessibilityRole="button"
                        accessibilityLabel="Select formula"
                        disabled={mutation.isPending}
                        onPress={() => handleSelectFormula(rule.id)}>
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color={brandColors.colors.secondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
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
                  <View
                    key={rule.id}
                    className={`flex-row items-center gap-2 rounded-lg border ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}>
                    <TouchableOpacity
                      className="flex-1 p-4"
                      accessibilityRole="button"
                      accessibilityLabel={rule.labelText || rule.labelKey || rule.id}
                      onPress={() =>
                        router.push(`/(easy-schedule)/easy-schedule-form?ruleId=${rule.id}`)
                      }>
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
                    </TouchableOpacity>
                    {isActive ? (
                      <View className="px-4 py-4">
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={brandColors.colors.primary}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="px-4 py-4"
                        accessibilityRole="button"
                        accessibilityLabel="Select formula"
                        disabled={mutation.isPending}
                        onPress={() => handleSelectFormula(rule.id)}>
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color={brandColors.colors.secondary}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      className="p-4"
                      accessibilityRole="button"
                      accessibilityLabel="Delete"
                      disabled={deleteMutation.isPending}
                      onPress={() =>
                        handleDeleteFormula(
                          rule.id,
                          rule.labelText || (rule.labelKey ? t(rule.labelKey) : rule.id)
                        )
                      }>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={brandColors.colors.destructive}
                      />
                    </TouchableOpacity>
                  </View>
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
                  <View
                    key={rule.id}
                    className={`flex-row items-center gap-2 rounded-lg border ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}>
                    <TouchableOpacity
                      className="flex-1 p-4"
                      accessibilityRole="button"
                      accessibilityLabel={
                        rule.labelText ||
                        (rule.labelKey ? t(rule.labelKey) : rule.id) +
                          (dateStr ? ` - ${dateStr}` : '')
                      }
                      onPress={() =>
                        router.push(`/(easy-schedule)/easy-schedule-form?ruleId=${rule.id}`)
                      }>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {rule.labelText || (rule.labelKey ? t(rule.labelKey) : rule.id)}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {dateStr || t('easySchedule.formulaGroups.temporary')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isActive ? (
                      <View className="px-4 py-4">
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={brandColors.colors.primary}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="px-4 py-4"
                        accessibilityRole="button"
                        accessibilityLabel="Select formula"
                        disabled={mutation.isPending}
                        onPress={() => handleSelectFormula(rule.id)}>
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color={brandColors.colors.secondary}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      className="p-4"
                      accessibilityRole="button"
                      accessibilityLabel="Delete"
                      disabled={deleteMutation.isPending}
                      onPress={() =>
                        handleDeleteFormula(
                          rule.id,
                          rule.labelText || (rule.labelKey ? t(rule.labelKey) : rule.id)
                        )
                      }>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={brandColors.colors.destructive}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

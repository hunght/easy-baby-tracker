import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/components/NotificationContext';
import {
  BABY_PROFILE_QUERY_KEY,
  FORMULA_RULES_QUERY_KEY,
  formulaRuleByIdKey,
  userCustomFormulaRulesKey,
} from '@/constants/query-keys';
import { getActiveBabyProfile } from '@/database/baby-profile';
import {
  getFormulaRuleById,
  getFormulaRules,
  deleteCustomFormulaRule,
  createCustomFormulaRule,
  updateCustomFormulaRule,
} from '@/database/easy-formula-rules';
import { useBrandColor } from '@/hooks/use-brand-color';
import type { EasyFormulaRuleId, EasyCyclePhase } from '@/lib/easy-schedule-generator';
import { useLocalization } from '@/localization/LocalizationProvider';

type PhaseInput = {
  eat: string;
  activity: string;
  sleep: string;
};

export default function EasyScheduleFormScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ ruleId?: EasyFormulaRuleId }>();
  const requestedRuleId = params.ruleId;

  // Load baby profile
  const { data: babyProfile } = useQuery({
    queryKey: BABY_PROFILE_QUERY_KEY,
    queryFn: getActiveBabyProfile,
    staleTime: 30 * 1000,
  });

  // Load all formula rules from database
  const { data: allRules = [] } = useQuery({
    queryKey: FORMULA_RULES_QUERY_KEY,
    queryFn: () => getFormulaRules(babyProfile?.id),
    enabled: !!babyProfile,
  });

  const availableRuleIds = allRules.map((rule) => rule.id);
  const fallbackRuleId: EasyFormulaRuleId = allRules[0]?.id ?? 'newborn';
  const ruleId: EasyFormulaRuleId =
    requestedRuleId && availableRuleIds.includes(requestedRuleId)
      ? requestedRuleId
      : fallbackRuleId;

  // Load the selected formula rule from database
  const { data: formulaRule } = useQuery({
    queryKey: formulaRuleByIdKey(ruleId),
    queryFn: () => getFormulaRuleById(ruleId, babyProfile?.id),
    enabled: !!babyProfile && !!ruleId,
  });

  // Edit mode state
  const [formulaName, setFormulaName] = useState('');
  const [minWeeks, setMinWeeks] = useState('');
  const [maxWeeks, setMaxWeeks] = useState('');
  const [description, setDescription] = useState('');
  const [phases, setPhases] = useState<PhaseInput[]>([]);

  // Initialize form state when formula loads
  useEffect(() => {
    if (!formulaRule) return;

    const safeTranslateForInit = (key: string) => {
      if (key.includes('.')) {
        const translated = t(key);
        return translated !== key ? translated : key;
      }
      return key || '';
    };

    setFormulaName(formulaRule.labelText || safeTranslateForInit(formulaRule.labelKey));
    setMinWeeks(formulaRule.minWeeks.toString());
    setMaxWeeks(formulaRule.maxWeeks?.toString() || '');

    // Process phases - phases are already typed as EasyCyclePhase[] from dbToFormulaRule
    const processedPhases = formulaRule.phases.map((p) => ({
      eat: (p.eat ?? 0).toString(),
      activity: (p.activity ?? 0).toString(),
      sleep: p.sleep.toString(),
    }));
    setPhases(processedPhases);

    // Process description - translate if it looks like a key
    const desc = formulaRule.description || '';
    if (desc && desc.includes('.') && desc.startsWith('easySchedule.')) {
      setDescription(t(desc));
    } else {
      setDescription(desc);
    }
  }, [formulaRule, t]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!babyProfile?.id || !formulaRule) {
        throw new Error('Missing required data');
      }

      const minWeeksNum = parseInt(minWeeks);
      const maxWeeksNum = maxWeeks ? parseInt(maxWeeks) : null;

      const convertedPhases: EasyCyclePhase[] = phases.map((phase) => ({
        eat: parseInt(phase.eat),
        activity: parseInt(phase.activity),
        sleep: parseInt(phase.sleep),
      }));

      await updateCustomFormulaRule(formulaRule.id, babyProfile.id, {
        name: formulaName.trim(),
        minWeeks: minWeeksNum,
        maxWeeks: maxWeeksNum,
        labelKey: '',
        ageRangeKey: '',
        description: description.trim(),
        phases: convertedPhases,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaRuleByIdKey(ruleId) });
      queryClient.invalidateQueries({ queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0) });
      queryClient.invalidateQueries({ queryKey: FORMULA_RULES_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
    },
    onError: (error) => {
      console.error('Failed to update formula:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!babyProfile?.id) {
        throw new Error('No active baby profile');
      }
      if (!formulaRule) {
        throw new Error('No formula rule loaded');
      }
      await deleteCustomFormulaRule(formulaRule.id, babyProfile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0) });
      queryClient.invalidateQueries({ queryKey: FORMULA_RULES_QUERY_KEY });
      showNotification(t('common.deleteSuccess'), 'success');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(easy-schedule)/easy-schedule-select');
        }
      }, 500);
    },
    onError: (error) => {
      console.error('Failed to delete formula:', error);
      showNotification(t('common.deleteError'), 'error');
    },
  });

  // Clone mutation
  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!babyProfile?.id) {
        throw new Error('No active baby profile');
      }
      if (!formulaRule) {
        throw new Error('No formula rule loaded');
      }

      // Helper to safely translate or use direct text (defined inline for mutation)
      const safeTranslateForClone = (key: string) => {
        if (key.includes('.')) {
          const translated = t(key);
          return translated !== key ? translated : key;
        }
        return key || '';
      };

      const clonedName = `${formulaRule.labelText || safeTranslateForClone(formulaRule.labelKey)} (Copy)`;

      await createCustomFormulaRule(babyProfile.id, {
        id: '',
        name: clonedName,
        minWeeks: formulaRule.minWeeks,
        maxWeeks: formulaRule.maxWeeks,
        labelKey: '',
        ageRangeKey: '',
        description: formulaRule.description ?? null,
        phases: [...formulaRule.phases],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0) });
      queryClient.invalidateQueries({ queryKey: FORMULA_RULES_QUERY_KEY });
      showNotification(t('easySchedule.formulaCloned'), 'success');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(easy-schedule)/easy-schedule-select');
        }
      }, 500);
    },
    onError: (error) => {
      console.error('Failed to clone formula:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleDelete = () => {
    if (!formulaRule) return;

    // Helper to safely translate or use direct text
    const safeTranslateLocal = (key: string) => {
      if (key.includes('.')) {
        const translated = t(key);
        return translated !== key ? translated : key;
      }
      return key || '';
    };

    Alert.alert(
      t('easySchedule.deleteFormula.title'),
      t('easySchedule.deleteFormula.message', {
        params: { name: formulaRule.labelText || safeTranslateLocal(formulaRule.labelKey) },
      }),
      [
        {
          text: t('easySchedule.deleteFormula.cancel'),
          style: 'cancel',
        },
        {
          text: t('easySchedule.deleteFormula.confirm'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const handleClone = () => {
    cloneMutation.mutate();
  };

  // Show loading state while data is loading
  if (!formulaRule) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  // Check if this is a custom formula (ID starts with 'custom_')
  const isCustomFormula = formulaRule.id.startsWith('custom_');
  const isEditable = isCustomFormula;

  const handleSave = () => {
    updateMutation.mutate();
  };

  const addPhase = () => {
    setPhases([...phases, { eat: '30', activity: '90', sleep: '120' }]);
  };

  const removePhase = (index: number) => {
    if (phases.length <= 1) return;
    setPhases(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: keyof PhaseInput, value: string) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const calculateTotalCycle = (phase: PhaseInput): number => {
    return (
      parseInt(phase.eat || '0') + parseInt(phase.activity || '0') + parseInt(phase.sleep || '0')
    );
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="bg-background">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border bg-card px-5 py-4">
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.back()}
            accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} />
          </Button>
          <Text className="flex-1 text-center text-lg font-semibold text-foreground">
            {isEditable ? t('easySchedule.editTitle') : t('easySchedule.infoTitle')}
          </Text>
          <View className="flex-row items-center gap-2">
            {isEditable && (
              <Button
                variant="ghost"
                size="icon"
                onPress={handleSave}
                disabled={updateMutation.isPending}
                accessibilityLabel={t('common.save')}>
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons name="checkmark" size={24} />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onPress={handleClone}
              disabled={cloneMutation.isPending}
              accessibilityLabel={t('easySchedule.cloneFormula')}>
              <Ionicons name="copy-outline" size={20} />
            </Button>
            {isCustomFormula && (
              <Button
                variant="ghost"
                size="icon"
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                accessibilityLabel={t('common.delete')}>
                <Ionicons name="trash-outline" size={20} />
              </Button>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-5">
          {/* Basic Information Card */}
          <Card className="mb-4 rounded-lg">
            <CardHeader>
              <CardTitle>{t('easySchedule.create.basicInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View>
                <Label nativeID="formulaName">{t('easySchedule.create.basicInfo.name')}</Label>
                <Input
                  value={formulaName}
                  onChangeText={setFormulaName}
                  placeholder={t('easySchedule.create.basicInfo.namePlaceholder')}
                  editable={isEditable}
                  className={!isEditable ? 'opacity-60' : ''}
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Label nativeID="minWeeks">{t('easySchedule.create.basicInfo.minWeeks')}</Label>
                  <Input
                    value={minWeeks}
                    onChangeText={setMinWeeks}
                    keyboardType="numeric"
                    placeholder="0"
                    editable={isEditable}
                    className={!isEditable ? 'opacity-60' : ''}
                  />
                </View>
                <View className="flex-1">
                  <Label nativeID="maxWeeks">{t('easySchedule.create.basicInfo.maxWeeks')}</Label>
                  <Input
                    value={maxWeeks}
                    onChangeText={setMaxWeeks}
                    keyboardType="numeric"
                    placeholder={t('easySchedule.create.basicInfo.maxWeeksPlaceholder')}
                    editable={isEditable}
                    className={!isEditable ? 'opacity-60' : ''}
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Cycles Card */}
          <Card className="mb-4 rounded-lg">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>{t('easySchedule.create.cycles.title')}</CardTitle>
                {isEditable && (
                  <TouchableOpacity onPress={addPhase}>
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={brandColors.colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              {phases.map((phase, index) => (
                <View key={index} className="rounded-md border border-border p-3">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-semibold text-foreground">
                      {t('easySchedule.create.cycles.cycleNumber', {
                        params: { number: index + 1 },
                      })}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Badge variant="secondary">
                        <Text className="text-xs">
                          {formatDuration(calculateTotalCycle(phase))}
                        </Text>
                      </Badge>
                      {isEditable && phases.length > 1 && (
                        <TouchableOpacity onPress={() => removePhase(index)}>
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={brandColors.colors.destructive}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Badge
                        variant="default"
                        className="bg-accent"
                        style={{ backgroundColor: brandColors.colors.accent }}>
                        <Text className="text-white">E</Text>
                      </Badge>
                      <Input
                        value={phase.eat}
                        onChangeText={(val) => updatePhase(index, 'eat', val)}
                        keyboardType="numeric"
                        placeholder="30"
                        className="flex-1"
                        editable={isEditable}
                      />
                      <Text className="text-sm text-muted-foreground">
                        {t('easySchedule.create.cycles.minutes')}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Badge variant="secondary">
                        <Text>A</Text>
                      </Badge>
                      <Input
                        value={phase.activity}
                        onChangeText={(val) => updatePhase(index, 'activity', val)}
                        keyboardType="numeric"
                        placeholder="90"
                        className="flex-1"
                        editable={isEditable}
                      />
                      <Text className="text-sm text-muted-foreground">
                        {t('easySchedule.create.cycles.minutes')}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Badge
                        variant="default"
                        className="bg-mint"
                        style={{ backgroundColor: brandColors.colors.mint }}>
                        <Text className="text-white">S</Text>
                      </Badge>
                      <Input
                        value={phase.sleep}
                        onChangeText={(val) => updatePhase(index, 'sleep', val)}
                        keyboardType="numeric"
                        placeholder="120"
                        className="flex-1"
                        editable={isEditable}
                      />
                      <Text className="text-sm text-muted-foreground">
                        {t('easySchedule.create.cycles.minutes')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="mb-4 rounded-lg">
            <CardHeader>
              <CardTitle>{t('easySchedule.create.description.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('easySchedule.create.description.placeholder')}
                multiline
                numberOfLines={6}
                editable={isEditable}
                className={`min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ${!isEditable ? 'opacity-60' : ''}`}
                textAlignVertical="top"
              />
              {isEditable && (
                <Text className="mt-2 text-xs text-muted-foreground">
                  {t('easySchedule.create.description.hint')}
                </Text>
              )}
            </CardContent>
          </Card>

          <View className="h-10" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

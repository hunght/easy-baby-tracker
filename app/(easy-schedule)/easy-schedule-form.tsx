import { useMutation, useQuery } from 'convex/react';
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
import { api } from '@/convex/_generated/api';
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
  const params = useLocalSearchParams<{ ruleId?: EasyFormulaRuleId }>();
  const requestedRuleId = params.ruleId;

  // Load baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

  // Load all formula rules from database
  const allRules = useQuery(
    api.easyFormulaRules.list,
    babyProfile?._id ? { babyId: babyProfile._id } : "skip"
  ) ?? [];

  const availableRuleIds = allRules.map((rule) => rule.ruleId);
  const fallbackRuleId: EasyFormulaRuleId = allRules[0]?.ruleId ?? 'newborn';
  const ruleId: EasyFormulaRuleId =
    requestedRuleId && availableRuleIds.includes(requestedRuleId)
      ? requestedRuleId
      : fallbackRuleId;

  // Load the selected formula rule from database
  const formulaRule = useQuery(
    api.easyFormulaRules.getById,
    babyProfile?._id && ruleId ? { ruleId, babyId: babyProfile._id } : "skip"
  );

  // Convex mutations
  const updateRule = useMutation(api.easyFormulaRules.update);
  const deleteRule = useMutation(api.easyFormulaRules.remove);
  const createRule = useMutation(api.easyFormulaRules.create);

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

    setFormulaName(formulaRule.labelText || safeTranslateForInit(formulaRule.labelKey ?? ''));
    setMinWeeks(formulaRule.minWeeks.toString());
    setMaxWeeks(formulaRule.maxWeeks?.toString() || '');

    // Process phases - parse from JSON string
    const parsedPhases: EasyCyclePhase[] = typeof formulaRule.phases === 'string'
      ? JSON.parse(formulaRule.phases)
      : formulaRule.phases;
    const processedPhases = parsedPhases.map((p: EasyCyclePhase) => ({
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

  // Mutation state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  // Handle update
  const handleUpdateFormula = async () => {
    if (!babyProfile?._id || !formulaRule) {
      showNotification('Missing required data', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const minWeeksNum = parseInt(minWeeks);
      const maxWeeksNum = maxWeeks ? parseInt(maxWeeks) : undefined;

      const convertedPhases: EasyCyclePhase[] = phases.map((phase) => ({
        eat: parseInt(phase.eat),
        activity: parseInt(phase.activity),
        sleep: parseInt(phase.sleep),
      }));

      await updateRule({
        ruleId: formulaRule.ruleId,
        babyId: babyProfile._id,
        labelText: formulaName.trim(),
        minWeeks: minWeeksNum,
        maxWeeks: maxWeeksNum,
        description: description.trim() || undefined,
        phases: JSON.stringify(convertedPhases),
      });

      showNotification(t('common.saveSuccess'), 'success');
    } catch (error) {
      console.error('Failed to update formula:', error);
      showNotification(t('common.saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDeleteFormula = async () => {
    if (!babyProfile?._id || !formulaRule) return;

    setIsDeleting(true);
    try {
      await deleteRule({
        ruleId: formulaRule.ruleId,
        babyId: babyProfile._id,
      });

      showNotification(t('common.deleteSuccess'), 'success');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(easy-schedule)/easy-schedule-select');
        }
      }, 500);
    } catch (error) {
      console.error('Failed to delete formula:', error);
      showNotification(t('common.deleteError'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clone
  const handleCloneFormula = async () => {
    if (!babyProfile?._id || !formulaRule) return;

    setIsCloning(true);
    try {
      // Helper to safely translate or use direct text
      const safeTranslateForClone = (key: string | null | undefined) => {
        if (key && key.includes('.')) {
          const translated = t(key);
          return translated !== key ? translated : key;
        }
        return key || '';
      };

      const clonedName = `${formulaRule.labelText || safeTranslateForClone(formulaRule.labelKey)} (Copy)`;

      // Parse phases from JSON if needed
      const phasesData = typeof formulaRule.phases === 'string'
        ? JSON.parse(formulaRule.phases)
        : formulaRule.phases;

      await createRule({
        babyId: babyProfile._id,
        labelText: clonedName,
        minWeeks: formulaRule.minWeeks,
        maxWeeks: formulaRule.maxWeeks ?? undefined,
        description: formulaRule.description ?? undefined,
        phases: phasesData,
      });

      showNotification(t('easySchedule.formulaCloned'), 'success');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(easy-schedule)/easy-schedule-select');
        }
      }, 500);
    } catch (error) {
      console.error('Failed to clone formula:', error);
      showNotification(t('common.saveError'), 'error');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = () => {
    if (!formulaRule) return;

    // Helper to safely translate or use direct text
    const safeTranslateLocal = (key: string | null | undefined) => {
      if (key && key.includes('.')) {
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
          onPress: handleDeleteFormula,
        },
      ]
    );
  };

  const handleClone = () => {
    handleCloneFormula();
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
  const isCustomFormula = formulaRule.ruleId.startsWith('custom_');
  const isEditable = isCustomFormula;

  const handleSave = () => {
    handleUpdateFormula();
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
        <ScrollView className="flex-1" contentContainerClassName="p-5 pb-32">
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

        {/* Sticky Bottom Bar */}
        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              size="lg"
              onPress={() => router.back()}
              className="flex-1 bg-muted">
              <Ionicons name="close-outline" size={20} color="#71717a" />
              <Text className="text-muted-foreground">{t('common.close')}</Text>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onPress={handleClone}
              disabled={isCloning}>
              <Ionicons name="copy-outline" size={20} color={brandColors.colors.black} />
              <Text>{t('easySchedule.clone')}</Text>
            </Button>

            {isCustomFormula && (
              <Button
                variant="destructive"
                size="lg"
                className="aspect-square bg-destructive/10 px-0"
                onPress={handleDelete}
                disabled={isDeleting}>
                <Ionicons name="trash-outline" size={24} color={brandColors.colors.destructive} />
              </Button>
            )}

            {isEditable && (
              <Button
                variant="default"
                size="lg"
                onPress={handleSave}
                disabled={isSaving}
                className="flex-[2]">
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text>{t('common.save')}</Text>
                  </>
                )}
              </Button>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

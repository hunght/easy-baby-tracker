import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/components/NotificationContext';
import { BABY_PROFILE_QUERY_KEY, userCustomFormulaRulesKey } from '@/constants/query-keys';
import { getActiveBabyProfile } from '@/database/baby-profile';
import { createCustomFormulaRule } from '@/database/easy-formula-rules';
import { useBrandColor } from '@/hooks/use-brand-color';
import type { EasyCyclePhase } from '@/lib/easy-schedule-generator';
import { useLocalization } from '@/localization/LocalizationProvider';

type PhaseInput = {
  eat: string;
  activity: string;
  sleep: string;
};

type FormErrors = {
  name?: string;
  minWeeks?: string;
  maxWeeks?: string;
  phases?: { [key: number]: { eat?: string; activity?: string; sleep?: string } };
};

export default function EasyScheduleCreateScreen() {
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

  // Form state
  const [formulaName, setFormulaName] = useState('');
  const [minWeeks, setMinWeeks] = useState('');
  const [maxWeeks, setMaxWeeks] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Default with 3 naps (common starting point)
  const [phases, setPhases] = useState<PhaseInput[]>([
    { eat: '30', activity: '90', sleep: '120' },
    { eat: '30', activity: '90', sleep: '120' },
    { eat: '30', activity: '90', sleep: '90' },
  ]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formulaName.trim()) {
      newErrors.name = t('easySchedule.create.errors.nameRequired');
    }

    const minWeeksNum = parseInt(minWeeks);
    const maxWeeksNum = parseInt(maxWeeks);

    if (!minWeeks || isNaN(minWeeksNum) || minWeeksNum < 0) {
      newErrors.minWeeks = t('easySchedule.create.errors.minWeeksInvalid');
    }

    if (maxWeeks && !isNaN(maxWeeksNum) && maxWeeksNum <= minWeeksNum) {
      newErrors.maxWeeks = t('easySchedule.create.errors.maxWeeksInvalid');
    }

    const phaseErrors: FormErrors['phases'] = {};
    phases.forEach((phase, index) => {
      const eat = parseInt(phase.eat);
      const activity = parseInt(phase.activity);
      const sleep = parseInt(phase.sleep);

      if (isNaN(eat) || eat <= 0) {
        phaseErrors[index] = {
          ...phaseErrors[index],
          eat: t('easySchedule.create.errors.invalidDuration'),
        };
      }
      if (isNaN(activity) || activity <= 0) {
        phaseErrors[index] = {
          ...phaseErrors[index],
          activity: t('easySchedule.create.errors.invalidDuration'),
        };
      }
      if (isNaN(sleep) || sleep <= 0) {
        phaseErrors[index] = {
          ...phaseErrors[index],
          sleep: t('easySchedule.create.errors.invalidDuration'),
        };
      }
    });

    if (Object.keys(phaseErrors).length > 0) {
      newErrors.phases = phaseErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!babyProfile?.id) {
        throw new Error('No active baby profile');
      }

      const minWeeksNum = parseInt(minWeeks);
      const maxWeeksNum = maxWeeks ? parseInt(maxWeeks) : null;

      const convertedPhases: EasyCyclePhase[] = phases.map((phase) => ({
        eat: parseInt(phase.eat),
        activity: parseInt(phase.activity),
        sleep: parseInt(phase.sleep),
      }));

      await createCustomFormulaRule(babyProfile.id, {
        id: '',
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
      queryClient.invalidateQueries({ queryKey: userCustomFormulaRulesKey(babyProfile?.id ?? 0) });
      showNotification(t('easySchedule.formulaCreated'), 'success');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(easy-schedule)/easy-schedule-select');
        }
      }, 500);
    },
    onError: (error) => {
      console.error('Failed to create formula:', error);
      showNotification(error instanceof Error ? error.message : t('common.saveError'), 'error');
    },
  });

  const handleSave = () => {
    if (validateForm()) {
      mutation.mutate();
    }
  };

  const addPhase = () => {
    setPhases([...phases, { eat: '30', activity: '90', sleep: '90' }]);
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const updatePhase = (index: number, field: keyof PhaseInput, value: string) => {
    const newPhases = [...phases];
    newPhases[index][field] = value;
    setPhases(newPhases);
  };

  const calculateTotalCycle = (phase: PhaseInput) => {
    const eat = parseInt(phase.eat) || 0;
    const activity = parseInt(phase.activity) || 0;
    const sleep = parseInt(phase.sleep) || 0;
    return eat + activity + sleep;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
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
          {t('easySchedule.create.title')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={mutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}>
          <Text
            className={`text-base font-semibold ${mutation.isPending ? 'text-muted-foreground' : 'text-primary'}`}>
            {t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-10 gap-4"
        showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <Card className="rounded-lg border-info/20 bg-info/5">
          <CardContent className="p-4">
            <View className="flex-row gap-3">
              <Ionicons name="information-circle" size={24} color={brandColors.colors.info} />
              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-foreground">
                  {t('easySchedule.create.infoTitle')}
                </Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  {t('easySchedule.create.infoDescription')}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{t('easySchedule.create.basicInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <View>
              <Label nativeID="formulaName">{t('easySchedule.create.basicInfo.name')}</Label>
              <Input
                placeholder={t('easySchedule.create.basicInfo.namePlaceholder')}
                value={formulaName}
                onChangeText={setFormulaName}
                aria-labelledby="formulaName"
              />
              {errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label nativeID="minWeeks">{t('easySchedule.create.basicInfo.minWeeks')}</Label>
                <Input
                  placeholder="0"
                  value={minWeeks}
                  onChangeText={setMinWeeks}
                  keyboardType="number-pad"
                  aria-labelledby="minWeeks"
                />
                {errors.minWeeks && (
                  <Text className="text-sm text-destructive">{errors.minWeeks}</Text>
                )}
              </View>
              <View className="flex-1">
                <Label nativeID="maxWeeks">{t('easySchedule.create.basicInfo.maxWeeks')}</Label>
                <Input
                  placeholder={t('easySchedule.create.basicInfo.maxWeeksPlaceholder')}
                  value={maxWeeks}
                  onChangeText={setMaxWeeks}
                  keyboardType="number-pad"
                  aria-labelledby="maxWeeks"
                />
                {errors.maxWeeks && (
                  <Text className="text-sm text-destructive">{errors.maxWeeks}</Text>
                )}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Cycle Phases */}
        <Card className="rounded-lg">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle>{t('easySchedule.create.cycles.title')}</CardTitle>
              <TouchableOpacity
                onPress={addPhase}
                className="flex-row items-center gap-1 rounded-md bg-primary px-3 py-2">
                <Ionicons name="add" size={16} color={brandColors.colors.white} />
                <Text className="text-xs font-semibold text-white">
                  {t('easySchedule.create.cycles.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent className="gap-4">
            <Text className="text-xs text-muted-foreground">
              {t('easySchedule.create.cycles.subtitle')}
            </Text>

            {phases.map((phase, index) => (
              <Card key={index} className="rounded-lg border-border/50 bg-card">
                <CardHeader>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">
                      {t('easySchedule.create.cycles.cycleNumber', {
                        params: { number: index + 1 },
                      })}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs text-muted-foreground">
                        {t('easySchedule.create.cycles.total')}:{' '}
                        {formatDuration(calculateTotalCycle(phase))}
                      </Text>
                      {phases.length > 1 && (
                        <TouchableOpacity onPress={() => removePhase(index)}>
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={brandColors.colors.destructive}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </CardHeader>
                <CardContent className="gap-3">
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <View className="mb-1.5 flex-row items-center gap-1">
                        <Badge className="bg-accent">
                          <Text className="font-semibold text-white">E</Text>
                        </Badge>
                        <Label className="text-xs">
                          {t('easySchedule.create.cycles.eatLabel')}
                        </Label>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="30"
                          value={phase.eat}
                          onChangeText={(value) => updatePhase(index, 'eat', value)}
                          keyboardType="number-pad"
                          aria-labelledby={`eat-${index}`}
                        />
                        <Text className="text-xs text-muted-foreground">min</Text>
                      </View>
                      {errors.phases?.[index]?.eat && (
                        <Text className="text-xs text-destructive">{errors.phases[index].eat}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="mb-1.5 flex-row items-center gap-1">
                        <Badge variant="secondary">
                          <Text className="font-semibold">A</Text>
                        </Badge>
                        <Label className="text-xs">
                          {t('easySchedule.create.cycles.activityLabel')}
                        </Label>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="90"
                          value={phase.activity}
                          onChangeText={(value) => updatePhase(index, 'activity', value)}
                          keyboardType="number-pad"
                          aria-labelledby={`activity-${index}`}
                        />
                        <Text className="text-xs text-muted-foreground">min</Text>
                      </View>
                      {errors.phases?.[index]?.activity && (
                        <Text className="text-xs text-destructive">
                          {errors.phases[index].activity}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="mb-1.5 flex-row items-center gap-1">
                        <Badge className="bg-mint">
                          <Text className="font-semibold text-white">S</Text>
                        </Badge>
                        <Label className="text-xs">
                          {t('easySchedule.create.cycles.sleepLabel')}
                        </Label>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="120"
                          value={phase.sleep}
                          onChangeText={(value) => updatePhase(index, 'sleep', value)}
                          keyboardType="number-pad"
                          aria-labelledby={`sleep-${index}`}
                        />
                        <Text className="text-xs text-muted-foreground">min</Text>
                      </View>
                      {errors.phases?.[index]?.sleep && (
                        <Text className="text-xs text-destructive">
                          {errors.phases[index].sleep}
                        </Text>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="rounded-lg">
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
              className="min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
              textAlignVertical="top"
            />
            <Text className="mt-2 text-xs text-muted-foreground">
              {t('easySchedule.create.description.hint')}
            </Text>
          </CardContent>
        </Card>
      </ScrollView>

      {mutation.isPending && (
        <View className="absolute inset-0 items-center justify-center bg-background/80">
          <ActivityIndicator size="large" color={brandColors.colors.primary} />
        </View>
      )}
    </View>
  );
}

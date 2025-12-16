import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { BABY_HABITS_QUERY_KEY, HABIT_DEFINITIONS_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfileId, getActiveBabyProfile } from '@/database/baby-profile';
import {
  getHabitDefinitions,
  getBabyHabits,
  addBabyHabit,
  removeBabyHabit,
  HABIT_CATEGORIES,
  isHabitAgeAppropriate,
  type HabitCategory,
  type HabitDefinition,
} from '@/database/habits';
import { useLocalization } from '@/localization/LocalizationProvider';

// Color mapping for categories
const categoryColors: Record<HabitCategory, string> = {
  health: '#FF5C8D',
  learning: '#6366F1',
  physical: '#22C55E',
  sleep: '#8B5CF6',
  social: '#F59E0B',
  nutrition: '#10B981',
};

// Light background colors for categories
const categoryBgColors: Record<HabitCategory, string> = {
  health: '#FF5C8D20',
  learning: '#6366F120',
  physical: '#22C55E20',
  sleep: '#8B5CF620',
  social: '#F59E0B20',
  nutrition: '#10B98120',
};

export default function HabitSelectScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [babyId, setBabyId] = useState<number | null>(null);
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(0);

  // Get current baby ID (do this once on mount)
  useEffect(() => {
    const loadBabyId = async () => {
      const id = await getActiveBabyProfileId();
      setBabyId(id);

      if (id) {
        const profile = await getActiveBabyProfile();
        if (profile?.birthDate) {
          const birthDate = new Date(profile.birthDate);
          const now = new Date();
          const ageMonths =
            (now.getFullYear() - birthDate.getFullYear()) * 12 +
            (now.getMonth() - birthDate.getMonth());
          setBabyAgeMonths(Math.max(0, ageMonths));
        }
      }
    };
    loadBabyId();
  }, []);

  // Fetch ALL habits (no age filter for faster query)
  const { data: allHabits, isLoading: isLoadingHabits } = useQuery({
    queryKey: [HABIT_DEFINITIONS_QUERY_KEY],
    queryFn: () => getHabitDefinitions(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch baby's current habits
  const { data: babyHabits } = useQuery({
    queryKey: [BABY_HABITS_QUERY_KEY, babyId],
    queryFn: () => (babyId ? getBabyHabits(babyId) : []),
    enabled: !!babyId,
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // Get IDs of already selected habits
  const selectedHabitIds = new Set(babyHabits?.map((h) => h.habitDefinitionId) ?? []);

  // Add habit mutation
  const addMutation = useMutation({
    mutationFn: async (habitDefinitionId: string) => {
      if (!babyId) throw new Error('No baby selected');
      await addBabyHabit(babyId, habitDefinitionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
      showNotification(t('habit.habitLogged', { defaultValue: 'Habit added!' }), 'success');
    },
    onError: (error) => {
      console.error('Failed to add habit:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  // Remove habit mutation
  const removeMutation = useMutation({
    mutationFn: async (habitDefinitionId: string) => {
      const habit = babyHabits?.find((h) => h.habitDefinitionId === habitDefinitionId);
      if (!habit) throw new Error('Habit not found');
      await removeBabyHabit(habit.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Failed to remove habit:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleToggleHabit = (habitId: string) => {
    if (selectedHabitIds.has(habitId)) {
      removeMutation.mutate(habitId);
    } else {
      addMutation.mutate(habitId);
    }
  };

  const handleOpenDetail = (habit: HabitDefinition) => {
    router.push({
      pathname: '/(habit)/habit-detail',
      params: {
        id: habit.id,
        labelKey: habit.labelKey,
        descriptionKey: habit.descriptionKey,
        category: habit.category,
        minAge: habit.minAgeMonths?.toString() ?? '0',
        maxAge: habit.maxAgeMonths?.toString() ?? '',
      },
    });
  };

  // Group habits by category
  const habitsByCategory = allHabits?.reduce<Partial<Record<HabitCategory, HabitDefinition[]>>>(
    (acc, habit) => {
      if (!acc[habit.category]) {
        acc[habit.category] = [];
      }
      acc[habit.category]!.push(habit);
      return acc;
    },
    {}
  ) as Record<HabitCategory, HabitDefinition[]>;

  if (isLoadingHabits) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader
          title={t('habit.selectHabits', { defaultValue: 'Habits' })}
          closeLabel={t('common.close')}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5C8D" />
        </View>
      </View>
    );
  }

  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={t('habit.selectHabits', { defaultValue: 'Habits' })}
        closeLabel={t('common.close')}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}>
        {/* All habits grouped by category as list items */}
        {HABIT_CATEGORIES.map((category) => {
          const habits = habitsByCategory?.[category.id] ?? [];
          if (habits.length === 0) return null;

          const categoryColor = categoryColors[category.id] || '#FF5C8D';
          const categoryBgColor = categoryBgColors[category.id] || '#FF5C8D20';

          return (
            <View key={category.id} className="mb-6">
              {/* Category header */}
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                <Text className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(category.labelKey, { defaultValue: category.id })}
                </Text>
              </View>

              {/* Habit list items - full width for easy one-handed tapping */}
              <View className="gap-2">
                {habits.map((habit) => {
                  const isSelected = selectedHabitIds.has(habit.id);
                  const isAgeMatch = isHabitAgeAppropriate(habit, babyAgeMonths);

                  // Age range text for non-matching habits
                  const ageRangeText = !isAgeMatch
                    ? habit.maxAgeMonths
                      ? `${habit.minAgeMonths}-${habit.maxAgeMonths}m`
                      : `${habit.minAgeMonths}m+`
                    : null;

                  return (
                    <View
                      key={habit.id}
                      className={`flex-row items-center overflow-hidden rounded-2xl border ${
                        isSelected
                          ? 'border-green-500/30 bg-green-500/10'
                          : isAgeMatch
                            ? 'border-border bg-card'
                            : 'border-border/50 bg-muted/30'
                      }`}>
                      {/* Left side: Checkbox area - large touch target for one-handed use */}
                      <Pressable
                        onPress={() => handleToggleHabit(habit.id)}
                        disabled={isPending}
                        hitSlop={{ top: 12, bottom: 12, left: 16, right: 0 }}
                        className="items-center justify-center p-4 active:opacity-70">
                        <View
                          className={`h-7 w-7 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-green-500' : 'border-2 border-border bg-background'
                          }`}>
                          {isSelected && <Check size={18} color="#FFF" strokeWidth={3} />}
                        </View>
                      </Pressable>

                      {/* Middle: Habit info - tap to see details */}
                      <Pressable
                        onPress={() => handleOpenDetail(habit)}
                        className="flex-1 flex-row items-center py-4 pr-2 active:opacity-70"
                        hitSlop={{ top: 8, bottom: 8 }}>
                        {/* Category color indicator */}
                        <View
                          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: categoryBgColor }}>
                          <View
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                        </View>

                        <View className="flex-1">
                          <Text
                            className={`text-base font-medium ${
                              isSelected
                                ? 'text-foreground'
                                : isAgeMatch
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                            }`}>
                            {t(habit.labelKey, { defaultValue: habit.id })}
                          </Text>
                          {ageRangeText && (
                            <Text className="mt-0.5 text-xs text-muted-foreground">
                              {ageRangeText}
                            </Text>
                          )}
                          {isSelected && (
                            <View className="mt-1 flex-row items-center gap-1">
                              <View className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <Text className="text-xs text-green-600">
                                {t('habit.tracking', { defaultValue: 'Tracking' })}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      {/* Right side: Info button for details */}
                      <Pressable
                        onPress={() => handleOpenDetail(habit)}
                        hitSlop={{ top: 12, bottom: 12, left: 0, right: 16 }}
                        className="items-center justify-center p-4 active:opacity-70">
                        <ChevronRight size={20} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

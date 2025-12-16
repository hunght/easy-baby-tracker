import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Check, Info } from 'lucide-react-native';
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
          title={t('habit.selectHabits', { defaultValue: 'Select Habits' })}
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
        title={t('habit.selectHabits', { defaultValue: 'Select Habits' })}
        closeLabel={t('common.close')}
      />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
        {/* Instructions */}
        <View className="mb-4 rounded-lg bg-muted/50 px-3 py-2">
          <Text className="text-center text-xs text-muted-foreground">
            {t('habit.selectInstructions', {
              defaultValue: 'Tap checkbox to select • Tap name to learn more',
            })}
          </Text>
        </View>

        {/* All habits grouped by category as tags */}
        {HABIT_CATEGORIES.map((category) => {
          const habits = habitsByCategory?.[category.id] ?? [];
          if (habits.length === 0) return null;

          const categoryColor = categoryColors[category.id] || '#FF5C8D';

          return (
            <View key={category.id} className="mb-5">
              {/* Category header */}
              <Text className="mb-2 text-sm font-semibold text-muted-foreground">
                {t(category.labelKey, { defaultValue: category.id })}
              </Text>

              {/* Habit tags with checkbox */}
              <View className="flex-row flex-wrap gap-2">
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
                      className={`flex-row items-center overflow-hidden rounded-full ${
                        isSelected
                          ? 'bg-accent'
                          : isAgeMatch
                            ? 'border border-border bg-muted'
                            : 'border border-border/50 bg-muted/50'
                      }`}>
                      {/* Checkbox area */}
                      <Pressable
                        onPress={() => handleToggleHabit(habit.id)}
                        disabled={isPending}
                        className="px-2 py-1.5 active:opacity-70"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 0 }}>
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-sm ${
                            isSelected ? 'bg-white/30' : 'border border-border bg-background'
                          }`}>
                          {isSelected && <Check size={12} color="#FFF" />}
                        </View>
                      </Pressable>

                      {/* Label area - tap to see details */}
                      <Pressable
                        onPress={() => handleOpenDetail(habit)}
                        className="flex-row items-center py-1.5 pr-3 active:opacity-70"
                        hitSlop={{ top: 8, bottom: 8, left: 0, right: 8 }}>
                        <Text
                          className={`text-sm ${
                            isSelected
                              ? 'font-medium text-white'
                              : isAgeMatch
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                          }`}>
                          {t(habit.labelKey, { defaultValue: habit.id })}
                        </Text>
                        {ageRangeText && (
                          <Text className="ml-1 text-xs text-muted-foreground">
                            ({ageRangeText})
                          </Text>
                        )}
                        <Info
                          size={12}
                          color={isSelected ? '#FFFFFF80' : categoryColor}
                          style={{ marginLeft: 4 }}
                        />
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

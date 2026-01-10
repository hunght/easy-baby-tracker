import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { api } from '@/convex/_generated/api';
import {
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
  const { showNotification } = useNotification();
  const [isPending, setIsPending] = useState(false);

  // Get active baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

  // Calculate baby age in months
  const babyAgeMonths = useMemo(() => {
    if (babyProfile?.birthDate) {
      const birthDate = new Date(babyProfile.birthDate);
      const now = new Date();
      const ageMonths =
        (now.getFullYear() - birthDate.getFullYear()) * 12 +
        (now.getMonth() - birthDate.getMonth());
      return Math.max(0, ageMonths);
    }
    return 0;
  }, [babyProfile?.birthDate]);

  // Fetch ALL habits (no age filter for faster query)
  const allHabits = useQuery(api.habits.getDefinitions, {});
  const isLoadingHabits = allHabits === undefined;

  // Fetch baby's current habits
  const babyHabits = useQuery(
    api.habits.getBabyHabits,
    babyProfile?._id ? { babyId: babyProfile._id } : "skip"
  );

  // Convex mutations
  const addHabitMutation = useMutation(api.habits.addBabyHabit);
  const removeHabitMutation = useMutation(api.habits.removeBabyHabit);

  // Get habit definition IDs that are already selected (using Convex IDs as strings for Set comparison)
  const selectedHabitDefIds = new Set(
    babyHabits?.map((h) => String(h.habitDefinitionId)) ?? []
  );

  const handleToggleHabit = async (habit: NonNullable<typeof allHabits>[number]) => {
    if (!babyProfile?._id) return;

    setIsPending(true);
    try {
      // Check if already selected using the Convex ID
      const existingBabyHabit = babyHabits?.find((h) => String(h.habitDefinitionId) === String(habit._id));

      if (existingBabyHabit) {
        await removeHabitMutation({ babyHabitId: existingBabyHabit._id });
      } else {
        await addHabitMutation({
          babyId: babyProfile._id,
          habitDefinitionId: habit._id,
        });
        showNotification(t('habit.habitLogged', { defaultValue: 'Habit added!' }), 'success');
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
      showNotification(t('common.saveError'), 'error');
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenDetail = (habit: NonNullable<typeof allHabits>[number]) => {
    router.push({
      pathname: '/(habit)/habit-detail',
      params: {
        id: habit.definitionId,
        labelKey: habit.labelKey,
        descriptionKey: habit.descriptionKey,
        category: habit.category,
        minAge: habit.minAgeMonths?.toString() ?? '0',
        maxAge: habit.maxAgeMonths?.toString() ?? '',
      },
    });
  };

  // Group habits by category
  const habitsByCategory =
    allHabits?.reduce<Partial<Record<HabitCategory, typeof allHabits>>>((acc, habit) => {
      const cat = habit.category as HabitCategory;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat]!.push(habit);
      return acc;
    }, {}) ?? {};

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
                  const isSelected = selectedHabitDefIds.has(String(habit._id));
                  const isAgeMatch = isHabitAgeAppropriate(habit, babyAgeMonths);

                  // Age range text for non-matching habits
                  const ageRangeText = !isAgeMatch
                    ? habit.maxAgeMonths
                      ? `${habit.minAgeMonths}-${habit.maxAgeMonths}m`
                      : `${habit.minAgeMonths}m+`
                    : null;

                  return (
                    <View
                      key={habit._id}
                      className={`flex-row items-center overflow-hidden rounded-2xl border ${
                        isSelected
                          ? 'border-green-500/30 bg-green-500/10'
                          : isAgeMatch
                            ? 'border-border bg-card'
                            : 'border-border/50 bg-muted/30'
                      }`}>
                      {/* Left side: Checkbox area - large touch target for one-handed use */}
                      <Pressable
                        onPress={() => handleToggleHabit(habit)}
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
                            {t(habit.labelKey, { defaultValue: habit.definitionId })}
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Baby,
  BookOpen,
  Check,
  Dumbbell,
  Heart,
  Moon,
  Plus,
  Users,
  Apple,
  Flame,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View, Platform } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { Text } from '@/components/ui/text';
import { BABY_HABITS_QUERY_KEY, HABIT_LOGS_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfileId } from '@/database/baby-profile';
import {
  getBabyHabits,
  getTodayHabitLogs,
  logHabit,
  getHabitStreak,
  type BabyHabitWithDefinition,
  type HabitCategory,
} from '@/database/habits';
import { useLocalization } from '@/localization/LocalizationProvider';

// Icon mapping for categories
const categoryIcons: Record<HabitCategory, typeof Heart> = {
  health: Heart,
  learning: BookOpen,
  physical: Dumbbell,
  sleep: Moon,
  social: Users,
  nutrition: Apple,
};

// Color mapping for categories
const categoryColors: Record<HabitCategory, string> = {
  health: '#FF5C8D',
  learning: '#6366F1',
  physical: '#22C55E',
  sleep: '#8B5CF6',
  social: '#F59E0B',
  nutrition: '#10B981',
};

interface HabitWithStatus extends BabyHabitWithDefinition {
  completedToday: boolean;
  streak: number;
}

export default function HabitScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [babyId, setBabyId] = useState<number | null>(null);

  // Get current baby ID
  useEffect(() => {
    const loadBabyId = async () => {
      const id = await getActiveBabyProfileId();
      setBabyId(id);

      // Baby ID is loaded, no need to calculate age here
    };
    loadBabyId();
  }, []);

  // Fetch baby's habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery({
    queryKey: [BABY_HABITS_QUERY_KEY, babyId],
    queryFn: () => (babyId ? getBabyHabits(babyId) : []),
    enabled: !!babyId,
  });

  // Fetch today's logs
  const { data: todayLogs } = useQuery({
    queryKey: [HABIT_LOGS_QUERY_KEY, 'today', babyId],
    queryFn: () => (babyId ? getTodayHabitLogs(babyId) : []),
    enabled: !!babyId,
  });

  // Combine habits with completion status
  const [habitsWithStatus, setHabitsWithStatus] = useState<HabitWithStatus[]>([]);

  useEffect(() => {
    const loadStreaks = async () => {
      if (!habits) return;

      const habitsData = await Promise.all(
        habits.map(async (habit) => {
          const completedToday = todayLogs?.some((log) => log.babyHabitId === habit.id) ?? false;
          const streak = await getHabitStreak(habit.id);
          return { ...habit, completedToday, streak };
        })
      );
      setHabitsWithStatus(habitsData);
    };
    loadStreaks();
  }, [habits, todayLogs]);

  // Log habit mutation
  const logMutation = useMutation({
    mutationFn: async (babyHabitId: number) => {
      if (!babyId) throw new Error('No baby selected');
      await logHabit(babyId, babyHabitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABIT_LOGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
    },
  });

  const handleQuickLog = async (habitId: number) => {
    // Haptic feedback for one-handed use
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    logMutation.mutate(habitId);
  };

  const navigateToAddHabit = () => {
    router.push('/habit-select');
  };

  if (isLoadingHabits) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader title={t('tracking.tiles.habit.label')} closeLabel={t('common.close')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5C8D" />
        </View>
      </View>
    );
  }

  const completedCount = habitsWithStatus.filter((h) => h.completedToday).length;
  const totalCount = habitsWithStatus.length;

  return (
    <View className="flex-1 bg-background">
      <ModalHeader title={t('tracking.tiles.habit.label')} closeLabel={t('common.close')} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-6 gap-4">
        {/* Progress Card */}
        {totalCount > 0 && (
          <View className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-foreground">
                  {t('habit.todayProgress', { defaultValue: "Today's Progress" })}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {completedCount} / {totalCount}{' '}
                  {t('habit.completed', { defaultValue: 'completed' })}
                </Text>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Text className="text-xl font-bold text-accent">
                  {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                </Text>
              </View>
            </View>
            {/* Progress bar */}
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-accent"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </View>
          </View>
        )}

        {/* Habits List */}
        {habitsWithStatus.length > 0 ? (
          <View className="gap-3">
            {habitsWithStatus.map((habit) => {
              const CategoryIcon = categoryIcons[habit.habit.category] || Heart;
              const categoryColor = categoryColors[habit.habit.category] || '#FF5C8D';

              const handleOpenDetail = () => {
                router.push({
                  pathname: '/(habit)/habit-detail',
                  params: {
                    id: habit.habit.id,
                    labelKey: habit.habit.labelKey,
                    descriptionKey: habit.habit.descriptionKey,
                    category: habit.habit.category,
                    minAge: habit.habit.minAgeMonths?.toString() ?? '0',
                    maxAge: habit.habit.maxAgeMonths?.toString() ?? '',
                  },
                });
              };

              return (
                <Pressable
                  key={habit.id}
                  onPress={() => !habit.completedToday && handleQuickLog(habit.id)}
                  disabled={habit.completedToday || logMutation.isPending}
                  className={`flex-row items-center rounded-2xl border p-4 active:opacity-80 ${
                    habit.completedToday
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-border bg-card'
                  }`}>
                  {/* Clickable area - Icon for details */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenDetail();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-1 flex-row items-center active:opacity-70">
                    {/* Icon */}
                    <View
                      className="h-12 w-12 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${categoryColor}20` }}>
                      <CategoryIcon size={24} color={categoryColor} />
                    </View>

                    {/* Habit Info */}
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {t(habit.habit.labelKey, { defaultValue: habit.habit.id })}
                      </Text>
                      {habit.streak > 0 && (
                        <View className="mt-1 flex-row items-center gap-1">
                          <Flame size={14} color="#F59E0B" />
                          <Text className="text-xs text-amber-500">
                            {habit.streak} {t('habit.streak', { defaultValue: 'day streak' })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Quick Log Button - larger for one-handed use */}
                  {habit.completedToday ? (
                    <View className="ml-3 h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-md">
                      <Check size={28} color="#FFF" />
                    </View>
                  ) : (
                    <View className="ml-3 h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent shadow-md">
                      <Check size={28} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="items-center rounded-2xl border border-dashed border-border bg-muted/50 p-6">
            <Baby size={48} color="#9CA3AF" />
            <Text className="mt-4 text-center text-base font-semibold text-foreground">
              {t('habit.noHabitsYet', { defaultValue: 'No habits added yet' })}
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              {t('habit.noHabitsDescription', {
                defaultValue: 'Tap "Add Habit" to start tracking habits for your baby.',
              })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for one-handed use */}
      <Pressable
        onPress={navigateToAddHabit}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg active:opacity-80"
        style={{
          shadowColor: '#FF5C8D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
        <Plus size={32} color="#FFF" />
      </Pressable>
    </View>
  );
}

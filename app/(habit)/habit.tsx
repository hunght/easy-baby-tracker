import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View, Platform } from "react-native";

import { ModalHeader } from "@/components/ModalHeader";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { HabitCategory } from "@/database/habits";
import { useLocalization } from "@/localization/LocalizationProvider";

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
  health: "#FF5C8D",
  learning: "#6366F1",
  physical: "#22C55E",
  sleep: "#8B5CF6",
  social: "#F59E0B",
  nutrition: "#10B981",
};

interface HabitDefinition {
  definitionId: string;
  category: string;
  labelKey: string;
  descriptionKey: string;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
}

interface HabitWithStatus {
  _id: any; // Convex Id type
  habitDefinitionId: any;
  habit: HabitDefinition | null;
  completedToday: boolean;
  streak: number;
}

export default function HabitScreen() {
  const { t } = useLocalization();
  const router = useRouter();

  // Get active baby profile
  const profile = useQuery(api.babyProfiles.getActive);

  // Fetch baby's habits
  const habits = useQuery(
    api.habits.getBabyHabits,
    profile?._id ? { babyId: profile._id } : "skip"
  );

  // Fetch today's logs
  const todayLogs = useQuery(
    api.habits.getTodayHabitLogs,
    profile?._id ? { babyId: profile._id } : "skip"
  );

  // Log habit mutation
  const logHabitMutation = useMutation(api.habits.logHabit);

  const isLoadingHabits = profile === undefined || habits === undefined;

  // Combine habits with completion status and streaks
  const [habitsWithStatus, setHabitsWithStatus] = useState<HabitWithStatus[]>([]);

  useEffect(() => {
    if (!habits || !todayLogs) return;

    const habitsData = habits.map((habit) => {
      const completedToday = todayLogs.some(
        (log) => log.babyHabitId === habit._id
      );
      // For now, streak is 0 - would need to implement streak calculation
      const streak = 0;
      return {
        _id: habit._id,
        habitDefinitionId: habit.habitDefinitionId,
        habit: habit.definition as HabitDefinition,
        completedToday,
        streak,
      };
    });
    setHabitsWithStatus(habitsData);
  }, [habits, todayLogs]);

  const handleQuickLog = async (habitId: any) => {
    if (!profile?._id) return;

    // Haptic feedback for one-handed use
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logHabitMutation({ babyId: profile._id, babyHabitId: habitId });
  };

  const navigateToAddHabit = () => {
    router.push("/habit-select");
  };

  if (isLoadingHabits) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader
          title={t("tracking.tiles.habit.label")}
          closeLabel={t("common.close")}
        />
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
      <ModalHeader
        title={t("tracking.tiles.habit.label")}
        closeLabel={t("common.close")}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-6 gap-4"
      >
        {/* Progress Card */}
        {totalCount > 0 && (
          <View className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-foreground">
                  {t("habit.todayProgress", { defaultValue: "Today's Progress" })}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {completedCount} / {totalCount}{" "}
                  {t("habit.completed", { defaultValue: "completed" })}
                </Text>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Text className="text-xl font-bold text-accent">
                  {totalCount > 0
                    ? Math.round((completedCount / totalCount) * 100)
                    : 0}
                  %
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
              const category = (habit.habit?.category || 'health') as HabitCategory;
              const CategoryIcon = categoryIcons[category] || Heart;
              const categoryColor = categoryColors[category] || "#FF5C8D";

              const handleOpenDetail = () => {
                if (!habit.habit) return;
                router.push({
                  pathname: "/(habit)/habit-detail",
                  params: {
                    id: habit.habit.definitionId,
                    labelKey: habit.habit.labelKey,
                    descriptionKey: habit.habit.descriptionKey,
                    category: habit.habit.category,
                    minAge: habit.habit.minAgeMonths?.toString() ?? "0",
                    maxAge: habit.habit.maxAgeMonths?.toString() ?? "",
                  },
                });
              };

              return (
                <Pressable
                  key={habit._id}
                  onPress={() => !habit.completedToday && handleQuickLog(habit._id)}
                  disabled={habit.completedToday}
                  className={`flex-row items-center rounded-2xl border p-4 active:opacity-80 ${
                    habit.completedToday
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Clickable area - Icon for details */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenDetail();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-1 flex-row items-center active:opacity-70"
                  >
                    {/* Icon */}
                    <View
                      className="h-12 w-12 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <CategoryIcon size={24} color={categoryColor} />
                    </View>

                    {/* Habit Info */}
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {t(habit.habit?.labelKey || '', { defaultValue: habit.habit?.definitionId || '' })}
                      </Text>
                      {habit.streak > 0 && (
                        <View className="mt-1 flex-row items-center gap-1">
                          <Flame size={14} color="#F59E0B" />
                          <Text className="text-xs text-amber-500">
                            {habit.streak}{" "}
                            {t("habit.streak", { defaultValue: "day streak" })}
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
              {t("habit.noHabitsYet", { defaultValue: "No habits added yet" })}
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              {t("habit.noHabitsDescription", {
                defaultValue:
                  'Tap "Add Habit" to start tracking habits for your baby.',
              })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for one-handed use */}
      <Pressable
        testID="btn-add-habit"
        onPress={navigateToAddHabit}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg active:opacity-80"
      >
        <Plus size={32} color="#FFF" />
      </Pressable>
    </View>
  );
}

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type HabitCategory = "health" | "learning" | "physical" | "sleep" | "social" | "nutrition";

// Convex document types
export type HabitDefinitionDoc = Doc<"habitDefinitions">;
export type BabyHabitDoc = Doc<"babyHabits">;
export type HabitLogDoc = Doc<"habitLogs">;

// Convex ID types
export type HabitDefinitionId = Id<"habitDefinitions">;
export type BabyHabitId = Id<"babyHabits">;
export type HabitLogId = Id<"habitLogs">;

// Record types (alias for consistency)
export type HabitDefinition = HabitDefinitionDoc;
export type BabyHabit = BabyHabitDoc;
export type HabitLog = HabitLogDoc;

// Combined type for baby habit with definition (returned from queries)
// Matches the Convex query return type: { ...babyHabit, definition }
export type BabyHabitWithDefinition = BabyHabitDoc & {
  definition: HabitDefinitionDoc | null;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const habitsApi = {
  getDefinitions: api.habits.getDefinitions,
  getDefinitionById: api.habits.getDefinitionById,
  getBabyHabits: api.habits.getBabyHabits,
  getBabyHabitsWithReminders: api.habits.getBabyHabitsWithReminders,
  getTodayHabitLogs: api.habits.getTodayHabitLogs,
  getHabitLogs: api.habits.getHabitLogs,
  getHabitStreak: api.habits.getHabitStreak,
};

// Mutations
export const habitsMutations = {
  addBabyHabit: api.habits.addBabyHabit,
  removeBabyHabit: api.habits.removeBabyHabit,
  updateBabyHabitReminder: api.habits.updateBabyHabitReminder,
  logHabit: api.habits.logHabit,
  seedDefinitions: api.habits.seedDefinitions,
};

// ============================================
// AGE MATCHING HELPER
// ============================================

export function isHabitAgeAppropriate(
  habit: { minAgeMonths?: number | null; maxAgeMonths?: number | null },
  ageMonths: number
): boolean {
  const minAge = habit.minAgeMonths ?? 0;
  const maxAge = habit.maxAgeMonths;
  // If maxAge is null, it means "no upper limit"
  return ageMonths >= minAge && (maxAge === null || maxAge === undefined || ageMonths <= maxAge);
}

// ============================================
// CATEGORY HELPERS
// ============================================

export const HABIT_CATEGORIES: { id: HabitCategory; labelKey: string; iconName: string }[] = [
  { id: "health", labelKey: "habit.category.health", iconName: "Heart" },
  { id: "learning", labelKey: "habit.category.learning", iconName: "BookOpen" },
  { id: "physical", labelKey: "habit.category.physical", iconName: "Dumbbell" },
  { id: "sleep", labelKey: "habit.category.sleep", iconName: "Moon" },
  { id: "social", labelKey: "habit.category.social", iconName: "Users" },
  { id: "nutrition", labelKey: "habit.category.nutrition", iconName: "Apple" },
];

// ============================================
// ASYNC WRAPPER FUNCTIONS (for non-React usage)
// ============================================

// Get baby habits with reminders
export async function getBabyHabitsWithReminders(babyId: Id<"babyProfiles">) {
  return await convex.query(api.habits.getBabyHabitsWithReminders, { babyId });
}

// Seed habit definitions
export async function seedHabitDefinitions(
  definitions: Array<{
    definitionId: string;
    category: string;
    iconName: string;
    labelKey: string;
    descriptionKey: string;
    minAgeMonths?: number;
    maxAgeMonths?: number;
    defaultFrequency: string;
    sortOrder?: number;
    isActive: boolean;
  }>
): Promise<void> {
  await convex.mutation(api.habits.seedDefinitions, { definitions });
}

// Re-export the full API for convenience
export { api };

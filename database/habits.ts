import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';

import * as schema from '@/db/schema';

import { getDb } from './db';
import { PREDEFINED_HABITS } from './predefined-habits';

// ============================================
// TYPES - Using Drizzle inferred types
// ============================================

// Use Drizzle's inferred types from schema
type HabitDefinitionSelect = typeof schema.habitDefinitions.$inferSelect;
type BabyHabitSelect = typeof schema.babyHabits.$inferSelect;
type HabitLogSelect = typeof schema.habitLogs.$inferSelect;

// Re-export types from schema
export type HabitCategory = HabitDefinitionSelect['category'];
// HabitFrequency is used internally but not exported to avoid unused export warning
type HabitFrequency = HabitDefinitionSelect['defaultFrequency'];

// Export types using Drizzle inferred types
export type HabitDefinition = HabitDefinitionSelect;
// HabitLog is used internally but not exported to avoid unused export warning
type HabitLog = HabitLogSelect;

// Combined type for baby habit with definition (from joined queries)
export interface BabyHabitWithDefinition extends BabyHabitSelect {
  habit: HabitDefinitionSelect;
}

// ============================================
// SEED FUNCTIONS
// ============================================

export async function seedHabitDefinitions() {
  const db = getDb();

  // Batch insert all habits at once for better performance
  await db
    .insert(schema.habitDefinitions)
    .values(
      PREDEFINED_HABITS.map((habit) => ({
        ...habit,
        isActive: true,
      }))
    )
    .onConflictDoNothing();
}

// ============================================
// AGE MATCHING HELPER
// ============================================

export function isHabitAgeAppropriate(
  habit: { minAgeMonths: number | null; maxAgeMonths: number | null },
  ageMonths: number
): boolean {
  const minAge = habit.minAgeMonths ?? 0;
  const maxAge = habit.maxAgeMonths;
  return ageMonths >= minAge && (maxAge === null || ageMonths <= maxAge);
}

// ============================================
// HABIT DEFINITION FUNCTIONS
// ============================================

export async function getHabitDefinitions(ageMonths?: number): Promise<HabitDefinition[]> {
  const db = getDb();

  let query = db
    .select()
    .from(schema.habitDefinitions)
    .where(eq(schema.habitDefinitions.isActive, true));

  if (ageMonths !== undefined) {
    query = db
      .select()
      .from(schema.habitDefinitions)
      .where(
        and(
          eq(schema.habitDefinitions.isActive, true),
          lte(schema.habitDefinitions.minAgeMonths, ageMonths),
          or(
            isNull(schema.habitDefinitions.maxAgeMonths),
            gte(schema.habitDefinitions.maxAgeMonths, ageMonths)
          )
        )
      );
  }

  const results = await query;
  return results;
}

// Removed unused export - getHabitDefinitionsByCategory

// ============================================
// BABY HABIT FUNCTIONS
// ============================================

export async function getBabyHabits(babyId: number): Promise<BabyHabitWithDefinition[]> {
  const db = getDb();
  const results = await db
    .select({
      id: schema.babyHabits.id,
      babyId: schema.babyHabits.babyId,
      habitDefinitionId: schema.babyHabits.habitDefinitionId,
      isActive: schema.babyHabits.isActive,
      targetFrequency: schema.babyHabits.targetFrequency,
      reminderTime: schema.babyHabits.reminderTime,
      reminderDays: schema.babyHabits.reminderDays,
      createdAt: schema.babyHabits.createdAt,
      habit: {
        id: schema.habitDefinitions.id,
        category: schema.habitDefinitions.category,
        iconName: schema.habitDefinitions.iconName,
        labelKey: schema.habitDefinitions.labelKey,
        descriptionKey: schema.habitDefinitions.descriptionKey,
        minAgeMonths: schema.habitDefinitions.minAgeMonths,
        maxAgeMonths: schema.habitDefinitions.maxAgeMonths,
        defaultFrequency: schema.habitDefinitions.defaultFrequency,
        sortOrder: schema.habitDefinitions.sortOrder,
        isActive: schema.habitDefinitions.isActive,
      },
    })
    .from(schema.babyHabits)
    .innerJoin(
      schema.habitDefinitions,
      eq(schema.babyHabits.habitDefinitionId, schema.habitDefinitions.id)
    )
    .where(and(eq(schema.babyHabits.babyId, babyId), eq(schema.babyHabits.isActive, true)));

  return results;
}

// Get habits with active reminders (for scheduling page)
export async function getBabyHabitsWithReminders(
  babyId: number
): Promise<BabyHabitWithDefinition[]> {
  const db = getDb();
  const results = await db
    .select({
      id: schema.babyHabits.id,
      babyId: schema.babyHabits.babyId,
      habitDefinitionId: schema.babyHabits.habitDefinitionId,
      isActive: schema.babyHabits.isActive,
      targetFrequency: schema.babyHabits.targetFrequency,
      reminderTime: schema.babyHabits.reminderTime,
      reminderDays: schema.babyHabits.reminderDays,
      createdAt: schema.babyHabits.createdAt,
      habit: {
        id: schema.habitDefinitions.id,
        category: schema.habitDefinitions.category,
        iconName: schema.habitDefinitions.iconName,
        labelKey: schema.habitDefinitions.labelKey,
        descriptionKey: schema.habitDefinitions.descriptionKey,
        minAgeMonths: schema.habitDefinitions.minAgeMonths,
        maxAgeMonths: schema.habitDefinitions.maxAgeMonths,
        defaultFrequency: schema.habitDefinitions.defaultFrequency,
        sortOrder: schema.habitDefinitions.sortOrder,
        isActive: schema.habitDefinitions.isActive,
      },
    })
    .from(schema.babyHabits)
    .innerJoin(
      schema.habitDefinitions,
      eq(schema.babyHabits.habitDefinitionId, schema.habitDefinitions.id)
    )
    .where(
      and(
        eq(schema.babyHabits.babyId, babyId),
        eq(schema.babyHabits.isActive, true),
        // Only get habits that have a reminder time set
        schema.babyHabits.reminderTime
      )
    );

  return results;
}

export async function addBabyHabit(
  babyId: number,
  habitDefinitionId: string,
  targetFrequency?: HabitFrequency,
  reminderTime?: string,
  reminderDays?: string
): Promise<number> {
  const db = getDb();

  // First check if the habit already exists (including inactive ones)
  const existing = await db
    .select({ id: schema.babyHabits.id })
    .from(schema.babyHabits)
    .where(
      and(
        eq(schema.babyHabits.babyId, babyId),
        eq(schema.babyHabits.habitDefinitionId, habitDefinitionId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Reactivate and update existing habit
    await db
      .update(schema.babyHabits)
      .set({
        isActive: true,
        targetFrequency: targetFrequency ?? null,
        reminderTime: reminderTime ?? null,
        reminderDays: reminderDays ?? null,
      })
      .where(eq(schema.babyHabits.id, existing[0].id));
    return existing[0].id;
  }

  // Insert new habit
  const result = await db
    .insert(schema.babyHabits)
    .values({
      babyId,
      habitDefinitionId,
      isActive: true,
      targetFrequency: targetFrequency ?? null,
      reminderTime: reminderTime ?? null,
      reminderDays: reminderDays ?? null,
    })
    .returning({ id: schema.babyHabits.id });

  return result[0].id;
}

export async function removeBabyHabit(babyHabitId: number): Promise<void> {
  const db = getDb();
  await db
    .update(schema.babyHabits)
    .set({ isActive: false })
    .where(eq(schema.babyHabits.id, babyHabitId));
}

// Removed unused export - deleteBabyHabit

export async function updateBabyHabitReminder(
  babyHabitId: number,
  reminderTime: string | null,
  reminderDays: string | null = null
): Promise<void> {
  const db = getDb();
  await db
    .update(schema.babyHabits)
    .set({ reminderTime, reminderDays })
    .where(eq(schema.babyHabits.id, babyHabitId));
}

// ============================================
// HABIT LOG FUNCTIONS
// ============================================

export async function logHabit(
  babyId: number,
  babyHabitId: number,
  completedAt?: number,
  duration?: number,
  notes?: string
): Promise<number> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const result = await db
    .insert(schema.habitLogs)
    .values({
      babyId,
      babyHabitId,
      completedAt: completedAt ?? now,
      duration: duration ?? null,
      notes: notes ?? null,
      recordedAt: now,
    })
    .returning({ id: schema.habitLogs.id });

  return result[0].id;
}

// Removed unused export - getHabitLogs

export async function getTodayHabitLogs(babyId: number): Promise<HabitLog[]> {
  const db = getDb();

  // Get start of today (midnight) in seconds
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTime = Math.floor(startOfDay.getTime() / 1000);

  const results = await db
    .select()
    .from(schema.habitLogs)
    .where(and(eq(schema.habitLogs.babyId, babyId), gte(schema.habitLogs.completedAt, startTime)))
    .orderBy(desc(schema.habitLogs.completedAt));

  return results;
}

// ============================================
// STREAK CALCULATION
// ============================================

export async function getHabitStreak(babyHabitId: number): Promise<number> {
  const db = getDb();

  // Get all logs ordered by date descending
  const logs = await db
    .select({
      completedAt: schema.habitLogs.completedAt,
    })
    .from(schema.habitLogs)
    .where(eq(schema.habitLogs.babyHabitId, babyHabitId))
    .orderBy(desc(schema.habitLogs.completedAt));

  if (logs.length === 0) return 0;

  // Convert timestamps to dates (day only)
  const logDates = logs.map((log) => {
    const date = new Date(log.completedAt * 1000);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  });

  // Remove duplicate dates
  const uniqueDates = [...new Set(logDates)].sort((a, b) => b - a);

  // Check if there's a log today
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  let streak = 0;
  let expectedDate = todayStart;

  for (const date of uniqueDates) {
    // If the date matches expected date, increment streak
    if (date === expectedDate) {
      streak++;
      expectedDate -= 24 * 60 * 60 * 1000; // Go back one day
    } else if (date < expectedDate) {
      // If we're checking today and there's no log, check if yesterday had one
      if (streak === 0 && date === expectedDate - 24 * 60 * 60 * 1000) {
        streak++;
        expectedDate = date - 24 * 60 * 60 * 1000;
      } else {
        break; // Streak is broken
      }
    }
  }

  return streak;
}

// ============================================
// CATEGORY HELPERS
// ============================================

export const HABIT_CATEGORIES: { id: HabitCategory; labelKey: string; iconName: string }[] = [
  { id: 'health', labelKey: 'habit.category.health', iconName: 'Heart' },
  { id: 'learning', labelKey: 'habit.category.learning', iconName: 'BookOpen' },
  { id: 'physical', labelKey: 'habit.category.physical', iconName: 'Dumbbell' },
  { id: 'sleep', labelKey: 'habit.category.sleep', iconName: 'Moon' },
  { id: 'social', labelKey: 'habit.category.social', iconName: 'Users' },
  { id: 'nutrition', labelKey: 'habit.category.nutrition', iconName: 'Apple' },
];

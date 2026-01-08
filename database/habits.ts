import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { PREDEFINED_HABITS } from './predefined-habits';

// ============================================
// TYPES
// ============================================

type HabitDefinitionRow = Database['public']['Tables']['habit_definitions']['Row'];
type BabyHabitRow = Database['public']['Tables']['baby_habits']['Row'];
type HabitLogRow = Database['public']['Tables']['habit_logs']['Row'];

export type HabitCategory = HabitDefinitionRow['category'];
// HabitFrequency is used internally but not exported to avoid unused export warning (in original code)
// We export it if needed by other files, or keep as internal alias
type HabitFrequency = HabitDefinitionRow['default_frequency'];

export type HabitDefinition = {
  id: string;
  category: HabitCategory;
  iconName: string;
  labelKey: string;
  descriptionKey: string;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  defaultFrequency: string;
  sortOrder: number | null;
  isActive: boolean | null;
};

// Combined type for baby habit with definition (from joined queries)
export interface BabyHabitWithDefinition {
  id: number;
  babyId: number;
  habitDefinitionId: string;
  isActive: boolean | null;
  targetFrequency: string | null;
  reminderTime: string | null;
  reminderDays: string | null;
  createdAt: number;
  habit: HabitDefinition;
}

export type HabitLog = {
  id: number;
  babyHabitId: number;
  babyId: number;
  completedAt: number;
  duration: number | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER MAPPERS
// ============================================

function mapHabitDefinition(row: HabitDefinitionRow): HabitDefinition {
  return {
    id: row.id,
    category: row.category,
    iconName: row.icon_name,
    labelKey: row.label_key,
    descriptionKey: row.description_key,
    minAgeMonths: row.min_age_months,
    maxAgeMonths: row.max_age_months,
    defaultFrequency: row.default_frequency,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapBabyHabitWithDefinition(
  row: BabyHabitRow & { habit_definitions: HabitDefinitionRow | null }
): BabyHabitWithDefinition {
  if (!row.habit_definitions) {
    throw new Error(`Baby habit ${row.id} has no associated definition`);
  }
  return {
    id: row.id,
    babyId: row.baby_id,
    habitDefinitionId: row.habit_definition_id,
    isActive: row.is_active,
    targetFrequency: row.target_frequency,
    reminderTime: row.reminder_time,
    reminderDays: row.reminder_days,
    createdAt: row.created_at,
    habit: mapHabitDefinition(row.habit_definitions),
  };
}

function mapHabitLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    babyHabitId: row.baby_habit_id,
    babyId: row.baby_id,
    completedAt: row.completed_at,
    duration: row.duration,
    notes: row.notes,
    recordedAt: row.recorded_at,
  };
}

// ============================================
// SEED FUNCTIONS
// ============================================

export async function seedHabitDefinitions() {
  console.log('Seeding is now handled by Supabase SQL migration.');
  // No-op: Seeding is done via SQL migration to bypass RLS restrictions on client
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
  // If maxAge is null, it means "no upper limit"
  return ageMonths >= minAge && (maxAge === null || ageMonths <= maxAge);
}

// ============================================
// HABIT DEFINITION FUNCTIONS
// ============================================

export async function getHabitDefinitions(ageMonths?: number): Promise<HabitDefinition[]> {
  let query = supabase
    .from('habit_definitions')
    .select('*')
    .eq('is_active', true);

  if (ageMonths !== undefined) {
    // Filter in JS or intricate Postgrest syntax.
    // Postgrest OR logic is: .or(`max_age_months.is.null,max_age_months.gte.${ageMonths}`)
    // AND it with min_age_months.lte.${ageMonths}
    // And is_active.eq.true

    // Filter by min age: min_age_months <= ageMonths
    query = query.lte('min_age_months', ageMonths);

    // Filter by max age: (max_age_months IS NULL) OR (max_age_months >= ageMonths)
    query = query.or(`max_age_months.is.null,max_age_months.gte.${ageMonths}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapHabitDefinition);
}

// ============================================
// BABY HABIT FUNCTIONS
// ============================================

export async function getBabyHabits(babyId: number): Promise<BabyHabitWithDefinition[]> {
  const { data, error } = await supabase
    .from('baby_habits')
    .select('*, habit_definitions!inner(*)') // !inner join ensures habit definition exists
    .eq('baby_id', babyId)
    .eq('is_active', true);

  if (error) throw error;

  // Cast data to expected type structure for mapping
  // Supabase return type with join is { ...BabyHabitRow, habit_definitions: HabitDefinitionRow }
  const rows = data as (BabyHabitRow & { habit_definitions: HabitDefinitionRow })[];

  return rows.map(mapBabyHabitWithDefinition);
}

// Get habits with active reminders (for scheduling page)
export async function getBabyHabitsWithReminders(
  babyId: number
): Promise<BabyHabitWithDefinition[]> {
  const { data, error } = await supabase
    .from('baby_habits')
    .select('*, habit_definitions!inner(*)')
    .eq('baby_id', babyId)
    .eq('is_active', true)
    .not('reminder_time', 'is', null);

  if (error) throw error;

  const rows = data as (BabyHabitRow & { habit_definitions: HabitDefinitionRow })[];
  return rows.map(mapBabyHabitWithDefinition);
}

export async function addBabyHabit(
  babyId: number,
  habitDefinitionId: string,
  targetFrequency?: string,
  reminderTime?: string,
  reminderDays?: string
): Promise<number> {
  // First check if the habit already exists (including inactive ones)
  const { data: existing } = await supabase
    .from('baby_habits')
    .select('id')
    .eq('baby_id', babyId)
    .eq('habit_definition_id', habitDefinitionId)
    .single();

  if (existing) {
    // Reactivate and update existing habit
    const { error } = await supabase
      .from('baby_habits')
      .update({
        is_active: true,
        target_frequency: targetFrequency ?? null,
        reminder_time: reminderTime ?? null,
        reminder_days: reminderDays ?? null,
      })
      .eq('id', existing.id);

    if (error) throw error;
    return existing.id;
  }

  // Insert new habit
  const { data: inserted, error } = await supabase
    .from('baby_habits')
    .insert({
      baby_id: babyId,
      habit_definition_id: habitDefinitionId,
      is_active: true,
      target_frequency: targetFrequency ?? null,
      reminder_time: reminderTime ?? null,
      reminder_days: reminderDays ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function removeBabyHabit(babyHabitId: number): Promise<void> {
  const { error } = await supabase
    .from('baby_habits')
    .update({ is_active: false })
    .eq('id', babyHabitId);

  if (error) throw error;
}

export async function updateBabyHabitReminder(
  babyHabitId: number,
  reminderTime: string | null,
  reminderDays: string | null = null
): Promise<void> {
  const { error } = await supabase
    .from('baby_habits')
    .update({
      reminder_time: reminderTime,
      reminder_days: reminderDays
    })
    .eq('id', babyHabitId);

  if (error) throw error;
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
  const now = Math.floor(Date.now() / 1000);

  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      baby_id: babyId,
      baby_habit_id: babyHabitId,
      completed_at: completedAt ?? now,
      duration: duration ?? null,
      notes: notes ?? null,
      recorded_at: now,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getTodayHabitLogs(babyId: number): Promise<HabitLog[]> {
  // Get start of today (midnight) in seconds
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTime = Math.floor(startOfDay.getTime() / 1000);

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('baby_id', babyId)
    .gte('completed_at', startTime)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapHabitLog);
}

// ============================================
// STREAK CALCULATION
// ============================================

export async function getHabitStreak(babyHabitId: number): Promise<number> {
  // Get all logs ordered by date descending
  const { data: logs, error } = await supabase
    .from('habit_logs')
    .select('completed_at')
    .eq('baby_habit_id', babyHabitId)
    .order('completed_at', { ascending: false });

  if (error || !logs || logs.length === 0) return 0;

  // Convert timestamps to dates (day only)
  const logDates = logs.map((log) => {
    const date = new Date(log.completed_at * 1000);
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

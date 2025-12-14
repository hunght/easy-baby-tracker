import { and, eq, gte, isNotNull, isNull, lte, or, type SQLWrapper } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';
import type {
  EasyFormulaRule,
  EasyFormulaRuleId,
  EasyCyclePhase,
} from '@/lib/easy-schedule-generator';
import { getActiveBabyProfile, updateSelectedEasyFormula } from '@/database/baby-profile';

export type FormulaRuleInsert = typeof schema.easyFormulaRules.$inferInsert;
type FormulaRuleSelect = typeof schema.easyFormulaRules.$inferSelect;

/**
 * Seed predefined formula rules - called during migration or first app load
 */
export async function seedPredefinedFormulas(): Promise<void> {
  const predefinedRules: FormulaRuleInsert[] = [
    {
      id: 'newborn',
      isCustom: false,
      minWeeks: 0,
      maxWeeks: 16,
      labelKey: 'easySchedule.formulas.newborn.label',
      ageRangeKey: 'easySchedule.formulas.newborn.ageRange',
      cycleKey: 'easySchedule.formulas.newborn.cycle',
      eatKey: 'easySchedule.formulas.newborn.eat',
      activityKey: 'easySchedule.formulas.newborn.activity',
      sleepKey: 'easySchedule.formulas.newborn.sleep',
      yourTimeKey: 'easySchedule.formulas.newborn.yourTime',
      logicKeys: JSON.stringify([
        'easySchedule.formulas.newborn.logic.cycle',
        'easySchedule.formulas.newborn.logic.activity',
      ]),
      // 4 naps: Eat 35m, Activity 55m, Sleep varies
      phases: JSON.stringify([
        { eat: 35, activity: 55, sleep: 120 },
        { eat: 35, activity: 55, sleep: 120 },
        { eat: 35, activity: 55, sleep: 90 },
        { eat: 35, activity: 55, sleep: 60 },
      ]),
    },
    {
      id: 'fourToSixMonths',
      isCustom: false,
      minWeeks: 16,
      maxWeeks: 24,
      labelKey: 'easySchedule.formulas.fourToSixMonths.label',
      ageRangeKey: 'easySchedule.formulas.fourToSixMonths.ageRange',
      cycleKey: 'easySchedule.formulas.fourToSixMonths.cycle',
      eatKey: 'easySchedule.formulas.fourToSixMonths.eat',
      activityKey: 'easySchedule.formulas.fourToSixMonths.activity',
      sleepKey: 'easySchedule.formulas.fourToSixMonths.sleep',
      yourTimeKey: 'easySchedule.formulas.fourToSixMonths.yourTime',
      logicKeys: JSON.stringify([
        'easySchedule.formulas.fourToSixMonths.logic.cycle',
        'easySchedule.formulas.fourToSixMonths.logic.balance',
      ]),
      // 3 naps: Eat 30m, Activity 90m, Sleep varies
      phases: JSON.stringify([
        { eat: 30, activity: 90, sleep: 120 },
        { eat: 30, activity: 90, sleep: 120 },
        { eat: 30, activity: 90, sleep: 90 },
      ]),
    },
    {
      id: 'sixToNineMonths',
      isCustom: false,
      minWeeks: 24,
      maxWeeks: 40,
      labelKey: 'easySchedule.formulas.sixToNineMonths.label',
      ageRangeKey: 'easySchedule.formulas.sixToNineMonths.ageRange',
      cycleKey: 'easySchedule.formulas.sixToNineMonths.cycle',
      eatKey: 'easySchedule.formulas.sixToNineMonths.eat',
      activityKey: 'easySchedule.formulas.sixToNineMonths.activity',
      sleepKey: 'easySchedule.formulas.sixToNineMonths.sleep',
      yourTimeKey: 'easySchedule.formulas.sixToNineMonths.yourTime',
      logicKeys: JSON.stringify([
        'easySchedule.formulas.sixToNineMonths.logic.window',
        'easySchedule.formulas.sixToNineMonths.logic.dropNap',
      ]),
      // 3 naps: Eat 30m, Activity 120m, Sleep varies
      phases: JSON.stringify([
        { eat: 30, activity: 120, sleep: 90 },
        { eat: 30, activity: 120, sleep: 90 },
        { eat: 30, activity: 120, sleep: 60 },
      ]),
    },
    {
      id: 'nineToTwelveMonths',
      isCustom: false,
      minWeeks: 40,
      maxWeeks: 52,
      labelKey: 'easySchedule.formulas.nineToTwelveMonths.label',
      ageRangeKey: 'easySchedule.formulas.nineToTwelveMonths.ageRange',
      cycleKey: 'easySchedule.formulas.nineToTwelveMonths.cycle',
      eatKey: 'easySchedule.formulas.nineToTwelveMonths.eat',
      activityKey: 'easySchedule.formulas.nineToTwelveMonths.activity',
      sleepKey: 'easySchedule.formulas.nineToTwelveMonths.sleep',
      yourTimeKey: 'easySchedule.formulas.nineToTwelveMonths.yourTime',
      logicKeys: JSON.stringify([
        'easySchedule.formulas.nineToTwelveMonths.logic.feedBalance',
        'easySchedule.formulas.nineToTwelveMonths.logic.capNap',
      ]),
      // 2 naps: Eat 25m, Activity 150m, Sleep varies
      phases: JSON.stringify([
        { eat: 25, activity: 150, sleep: 90 },
        { eat: 25, activity: 150, sleep: 120 },
      ]),
    },
    {
      id: 'toddler',
      isCustom: false,
      minWeeks: 52,
      maxWeeks: null,
      labelKey: 'easySchedule.formulas.toddler.label',
      ageRangeKey: 'easySchedule.formulas.toddler.ageRange',
      cycleKey: 'easySchedule.formulas.toddler.cycle',
      eatKey: 'easySchedule.formulas.toddler.eat',
      activityKey: 'easySchedule.formulas.toddler.activity',
      sleepKey: 'easySchedule.formulas.toddler.sleep',
      yourTimeKey: 'easySchedule.formulas.toddler.yourTime',
      logicKeys: JSON.stringify([
        'easySchedule.formulas.toddler.logic.napStart',
        'easySchedule.formulas.toddler.logic.duration',
      ]),
      // 1 nap: Eat 20m, Activity 240m, Sleep 120m
      phases: JSON.stringify([{ eat: 20, activity: 240, sleep: 120 }]),
    },
  ];

  await db.insert(schema.easyFormulaRules).values(predefinedRules).onConflictDoNothing();
}

/**
 * Convert DB record to EasyFormulaRule
 */
function dbToFormulaRule(record: FormulaRuleSelect): EasyFormulaRule {
  return {
    id: record.id as EasyFormulaRuleId,
    minWeeks: record.minWeeks,
    maxWeeks: record.maxWeeks,
    labelKey: record.labelKey ?? record.labelText ?? '',
    labelText: record.labelText ?? null,
    ageRangeKey: record.ageRangeKey ?? record.ageRangeText ?? '',
    ageRangeText: record.ageRangeText ?? null,
    cycleKey: record.cycleKey ?? record.cycleText ?? '',
    eatKey: record.eatKey ?? record.eatText ?? '',
    activityKey: record.activityKey ?? record.activityText ?? '',
    sleepKey: record.sleepKey ?? record.sleepText ?? '',
    yourTimeKey: record.yourTimeKey ?? record.yourTimeText ?? '',
    logicKeys: JSON.parse(record.logicKeys ?? record.logicTexts ?? '[]'),
    // Parse phases from JSON, default to empty array if missing (old data)
    phases: record.phases ? JSON.parse(record.phases) : [],
    validDate: record.validDate ?? null,
  };
}

/**
 * Get all formula rules (predefined + user custom for specific baby)
 * Excludes day-specific rules (validDate is set)
 */
export async function getFormulaRules(babyId?: number): Promise<EasyFormulaRule[]> {
  const conditions: SQLWrapper[] = [
    // Exclude day-specific rules
    isNull(schema.easyFormulaRules.validDate),
  ];

  // Get predefined rules OR rules created by this baby
  if (babyId) {
    conditions.push(
      or(eq(schema.easyFormulaRules.isCustom, false), eq(schema.easyFormulaRules.babyId, babyId))!
    );
  } else {
    conditions.push(eq(schema.easyFormulaRules.isCustom, false));
  }

  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(and(...conditions))
    .orderBy(schema.easyFormulaRules.minWeeks);

  return records.map(dbToFormulaRule);
}

/**
 * Get formula rule by ID
 * Can retrieve day-specific rules (validDate is set) if babyId matches
 */
export async function getFormulaRuleById(
  ruleId: string,
  babyId?: number
): Promise<EasyFormulaRule | null> {
  const conditions: SQLWrapper[] = [eq(schema.easyFormulaRules.id, ruleId)];

  if (babyId) {
    conditions.push(
      or(eq(schema.easyFormulaRules.isCustom, false), eq(schema.easyFormulaRules.babyId, babyId))!
    );
  } else {
    conditions.push(eq(schema.easyFormulaRules.isCustom, false));
  }

  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(and(...conditions))
    .limit(1);

  return records[0] ? dbToFormulaRule(records[0]) : null;
}

/**
 * Delete day-specific formula rule for a specific date
 * This resets the schedule to use the original formula rule
 */
export async function deleteDaySpecificRule(babyId: number, date: string): Promise<void> {
  await db
    .delete(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.validDate, date),
        eq(schema.easyFormulaRules.isCustom, true)
      )
    );
}

/**
 * Get formula rule by age in weeks
 */
export async function getFormulaRuleByAge(
  ageWeeks: number,
  babyId?: number
): Promise<EasyFormulaRule | null> {
  const conditions: SQLWrapper[] = [
    gte(schema.easyFormulaRules.minWeeks, 0),
    or(
      and(
        lte(schema.easyFormulaRules.minWeeks, ageWeeks),
        gte(schema.easyFormulaRules.maxWeeks, ageWeeks)
      ),
      and(lte(schema.easyFormulaRules.minWeeks, ageWeeks), isNull(schema.easyFormulaRules.maxWeeks))
    )!,
    // Exclude day-specific rules (validDate is set)
    isNull(schema.easyFormulaRules.validDate),
  ];

  if (babyId) {
    conditions.push(
      or(eq(schema.easyFormulaRules.isCustom, false), eq(schema.easyFormulaRules.babyId, babyId))!
    );
  } else {
    conditions.push(eq(schema.easyFormulaRules.isCustom, false));
  }

  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(and(...conditions))
    .orderBy(schema.easyFormulaRules.minWeeks)
    .limit(1);

  return records[0] ? dbToFormulaRule(records[0]) : null;
}

/**
 * Get day-specific formula rule for a baby and date
 * Returns the custom rule for that specific date, or null if none exists
 */
export async function getFormulaRuleByDate(
  babyId: number,
  date: string // YYYY-MM-DD format
): Promise<EasyFormulaRule | null> {
  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.validDate, date),
        eq(schema.easyFormulaRules.isCustom, true)
      )
    )
    .limit(1);

  return records[0] ? dbToFormulaRule(records[0]) : null;
}

/**
 * Get predefined formula rules (not custom, not day-specific)
 */
export async function getPredefinedFormulaRules(): Promise<EasyFormulaRule[]> {
  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(
      and(eq(schema.easyFormulaRules.isCustom, false), isNull(schema.easyFormulaRules.validDate))
    )
    .orderBy(schema.easyFormulaRules.minWeeks);

  return records.map(dbToFormulaRule);
}

/**
 * Get user custom formula rules (custom, not day-specific, for specific baby)
 */
export async function getUserCustomFormulaRules(babyId: number): Promise<EasyFormulaRule[]> {
  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.isCustom, true),
        isNull(schema.easyFormulaRules.validDate)
      )
    )
    .orderBy(schema.easyFormulaRules.createdAt);

  return records.map(dbToFormulaRule);
}

/**
 * Get day-specific (temporary) formula rules for a baby
 * These are custom rules that apply only to a specific date
 */
export async function getDaySpecificFormulaRules(babyId: number): Promise<EasyFormulaRule[]> {
  const records = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.isCustom, true),
        isNotNull(schema.easyFormulaRules.validDate)
      )
    )
    .orderBy(schema.easyFormulaRules.validDate);

  const rules = records.map(dbToFormulaRule);

  // Sort by date, most recent first
  return rules.sort((a, b) => {
    if (a.validDate && b.validDate) {
      return b.validDate.localeCompare(a.validDate);
    }
    return 0;
  });
}

/**
 * Clone a formula rule for a specific date with custom phases
 * This creates a day-specific custom rule that applies only to the given date
 */
export async function cloneFormulaRuleForDate(
  babyId: number,
  sourceRuleId: string,
  date: string, // YYYY-MM-DD format
  phases: { eat: number; activity: number; sleep: number }[]
): Promise<string> {
  // Get the source rule as raw database record
  const sourceRecords = await db
    .select()
    .from(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.id, sourceRuleId),
        or(eq(schema.easyFormulaRules.isCustom, false), eq(schema.easyFormulaRules.babyId, babyId))!
      )
    )
    .limit(1);

  if (sourceRecords.length === 0) {
    throw new Error(`Source formula rule ${sourceRuleId} not found`);
  }

  const sourceRecord = sourceRecords[0];

  // Check if a day-specific rule already exists for this date
  const existing = await getFormulaRuleByDate(babyId, date);
  if (existing) {
    // Update existing day-specific rule with new phases
    await db
      .update(schema.easyFormulaRules)
      .set({
        sourceRuleId: sourceRuleId,
        phases: JSON.stringify(phases),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(schema.easyFormulaRules.id, existing.id));
    return existing.id;
  }

  // Create new day-specific rule by cloning the source record
  const newRuleId = `day_${babyId}_${date.replace(/-/g, '')}_${Date.now()}`;
  const insert: FormulaRuleInsert = {
    ...sourceRecord,
    id: newRuleId,
    babyId,
    isCustom: true,
    validDate: date,
    sourceRuleId: sourceRuleId,
    phases: JSON.stringify(phases),
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  await db.insert(schema.easyFormulaRules).values(insert);
  return newRuleId;
}

/**
 * Create custom formula rule (for future feature)
 */
export async function createCustomFormulaRule(
  babyId: number,
  rule: Omit<EasyFormulaRule, 'id'> & { id: string; name: string }
): Promise<string> {
  const insert: FormulaRuleInsert = {
    id: `custom_${babyId}_${Date.now()}`,
    babyId,
    isCustom: true,
    minWeeks: rule.minWeeks,
    maxWeeks: rule.maxWeeks,
    labelText: rule.name,
    ageRangeText: `${rule.minWeeks} - ${rule.maxWeeks ?? '∞'} weeks`,
    cycleText: rule.cycleKey,
    eatText: rule.eatKey,
    activityText: rule.activityKey,
    sleepText: rule.sleepKey,
    yourTimeText: rule.yourTimeKey,
    logicTexts: JSON.stringify(rule.logicKeys),
    phases: JSON.stringify(rule.phases),
  };

  const result = await db
    .insert(schema.easyFormulaRules)
    .values(insert)
    .returning({ id: schema.easyFormulaRules.id });
  return result[0].id;
}

/**
 * Delete custom formula rule
 */
export async function deleteCustomFormulaRule(ruleId: string, babyId: number): Promise<void> {
  await db
    .delete(schema.easyFormulaRules)
    .where(
      and(
        eq(schema.easyFormulaRules.id, ruleId),
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.isCustom, true)
      )
    );
}

/**
 * Calculate duration in minutes between two time strings (HH:MM)
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);

  let startMinutes = startHours * 60 + startMins;
  let endMinutes = endHours * 60 + endMins;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

/**
 * Adjust schedule phase timing and update formula rule
 * Gets current formula from baby profile, calculates new duration, and saves updated phases
 */
export async function adjustSchedulePhaseTiming(
  babyId: number,
  itemOrder: number,
  newStartTime: string,
  newEndTime: string
): Promise<string> {
  // Get baby profile and verify formula is selected
  const babyProfile = await getActiveBabyProfile();
  if (!babyProfile || babyProfile.id !== babyId) {
    throw new Error('Baby profile not found');
  }

  if (!babyProfile.selectedEasyFormulaId) {
    throw new Error('No formula selected for baby profile. Please select a formula first.');
  }

  // Get current formula rule
  const currentRule = await getFormulaRuleById(babyProfile.selectedEasyFormulaId, babyId);
  if (!currentRule) {
    throw new Error(`Formula rule with ID "${babyProfile.selectedEasyFormulaId}" not found`);
  }

  // Calculate which cycle and item type is being adjusted
  // Each EASY cycle has 4 schedule items: E=0, A=1, S=2, Y=3
  const cycleIndex = Math.floor(itemOrder / 4);
  const itemTypeIndex = itemOrder % 4; // 0=Eat, 1=Activity, 2=Sleep, 3=YourTime(overlaps Sleep)

  if (cycleIndex >= currentRule.phases.length) {
    throw new Error(`Invalid item order ${itemOrder} for ${currentRule.phases.length} cycles`);
  }

  // Calculate new duration from time adjustment
  const newDuration = calculateDurationMinutes(newStartTime, newEndTime);
  if (newDuration <= 0) {
    throw new Error('Invalid duration: end time must be after start time');
  }

  // Clone phases and update the adjusted one
  const phases: EasyCyclePhase[] = currentRule.phases.map((phase, idx) => {
    if (idx === cycleIndex) {
      // Update the specific property based on item type
      switch (itemTypeIndex) {
        case 0: // Eat
          return { ...phase, eat: newDuration };
        case 1: // Activity
          return { ...phase, activity: newDuration };
        case 2: // Sleep
        case 3: // Your Time (overlaps with Sleep, adjust Sleep)
          return { ...phase, sleep: newDuration };
        default:
          return { ...phase };
      }
    }
    return { ...phase };
  });

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Clone the formula rule for today with adjusted phases
  const daySpecificRuleId = await cloneFormulaRuleForDate(
    babyId,
    babyProfile.selectedEasyFormulaId,
    today,
    phases
  );

  // Update selectedEasyFormulaId to the day-specific rule
  await updateSelectedEasyFormula(babyId, daySpecificRuleId);

  return daySpecificRuleId;
}

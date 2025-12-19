import { and, eq, gte, isNotNull, isNull, lte, or, type SQLWrapper } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';
import type {
  EasyFormulaRule,
  EasyFormulaRuleId,
  EasyCyclePhase,
} from '@/lib/easy-schedule-generator';
import { getActiveBabyProfile, updateSelectedEasyFormula } from '@/database/baby-profile';
import { safeParseEasyCyclePhases } from '@/lib/json-parse';

export type FormulaRuleInsert = typeof schema.easyFormulaRules.$inferInsert;
type FormulaRuleSelect = typeof schema.easyFormulaRules.$inferSelect;

/**
 * Convert DB record to EasyFormulaRule
 */
function dbToFormulaRule(record: FormulaRuleSelect): EasyFormulaRule {
  // record.id is already a string, EasyFormulaRuleId is a string type alias
  // TypeScript accepts this assignment without assertion since both are strings
  const id: EasyFormulaRuleId = record.id;
  return {
    id,
    minWeeks: record.minWeeks,
    maxWeeks: record.maxWeeks,
    labelKey: record.labelKey ?? record.labelText ?? '',
    labelText: record.labelText ?? null,
    ageRangeKey: record.ageRangeKey ?? record.ageRangeText ?? '',
    ageRangeText: record.ageRangeText ?? null,
    description: record.description ?? null,
    // Parse phases from JSON, default to empty array if missing (old data)
    phases: safeParseEasyCyclePhases(record.phases),
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
  phases: EasyCyclePhase[]
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
    description: rule.description ?? null,
    phases: JSON.stringify(rule.phases),
  };

  const result = await db
    .insert(schema.easyFormulaRules)
    .values(insert)
    .returning({ id: schema.easyFormulaRules.id });
  return result[0].id;
}

/**
 * Update custom formula rule
 */
export async function updateCustomFormulaRule(
  ruleId: string,
  babyId: number,
  rule: Omit<EasyFormulaRule, 'id'> & { name: string }
): Promise<void> {
  await db
    .update(schema.easyFormulaRules)
    .set({
      labelText: rule.name,
      ageRangeText: `${rule.minWeeks} - ${rule.maxWeeks ?? '∞'} weeks`,
      minWeeks: rule.minWeeks,
      maxWeeks: rule.maxWeeks,
      description: rule.description ?? null,
      phases: JSON.stringify(rule.phases),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(
      and(
        eq(schema.easyFormulaRules.id, ruleId),
        eq(schema.easyFormulaRules.babyId, babyId),
        eq(schema.easyFormulaRules.isCustom, true)
      )
    );
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
export async function adjustSchedulePhaseTiming({
  babyId,
  itemOrder,
  newStartTime,
  newEndTime,
}: {
  babyId: number;
  itemOrder: number;
  newStartTime: string;
  newEndTime: string;
}): Promise<string> {
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

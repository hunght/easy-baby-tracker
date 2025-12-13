import { and, eq, gte, isNull, lte, or, type SQLWrapper } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';
import type { EasyFormulaRule, EasyFormulaRuleId } from '@/lib/easy-schedule-generator';

type FormulaRuleInsert = typeof schema.easyFormulaRules.$inferInsert;
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
      cycleLengthMinutes: 180,
      activityRangeMin: 45,
      activityRangeMax: 75,
      feedDurationMinutes: 35,
      napDurationsMinutes: JSON.stringify([120, 120, 90, 60]),
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
      cycleLengthMinutes: 240,
      activityRangeMin: 90,
      activityRangeMax: 120,
      feedDurationMinutes: 30,
      napDurationsMinutes: JSON.stringify([120, 120, 90]),
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
      cycleLengthMinutes: 240,
      activityRangeMin: 120,
      activityRangeMax: 180,
      feedDurationMinutes: 30,
      napDurationsMinutes: JSON.stringify([90, 90, 60]),
      thirdNapDropWakeThreshold: 180,
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
      activityRangeMin: 150,
      activityRangeMax: 240,
      feedDurationMinutes: 25,
      napDurationsMinutes: JSON.stringify([90, 120]),
      morningNapCapMinutes: 120,
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
      activityRangeMin: 240,
      activityRangeMax: 300,
      feedDurationMinutes: 20,
      napDurationsMinutes: JSON.stringify([120]),
      afternoonActivityRangeMin: 240,
      afternoonActivityRangeMax: 300,
      nightSleepMinutes: 660,
      bedtimeRoutineMinutes: 30,
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
    ageRangeKey: record.ageRangeKey ?? record.ageRangeText ?? '',
    cycleKey: record.cycleKey ?? record.cycleText ?? '',
    eatKey: record.eatKey ?? record.eatText ?? '',
    activityKey: record.activityKey ?? record.activityText ?? '',
    sleepKey: record.sleepKey ?? record.sleepText ?? '',
    yourTimeKey: record.yourTimeKey ?? record.yourTimeText ?? '',
    logicKeys: JSON.parse(record.logicKeys ?? record.logicTexts ?? '[]'),
    cycleLengthMinutes: record.cycleLengthMinutes ?? undefined,
    activityRangeMinutes: [record.activityRangeMin, record.activityRangeMax] as const,
    feedDurationMinutes: record.feedDurationMinutes,
    napDurationsMinutes: JSON.parse(record.napDurationsMinutes),
    thirdNapDropWakeThreshold: record.thirdNapDropWakeThreshold ?? undefined,
    morningNapCapMinutes: record.morningNapCapMinutes ?? undefined,
    afternoonActivityRangeMinutes:
      record.afternoonActivityRangeMin && record.afternoonActivityRangeMax
        ? ([record.afternoonActivityRangeMin, record.afternoonActivityRangeMax] as const)
        : undefined,
    nightSleepMinutes: record.nightSleepMinutes ?? undefined,
    bedtimeRoutineMinutes: record.bedtimeRoutineMinutes ?? undefined,
  };
}

/**
 * Get all formula rules (predefined + user custom for specific baby)
 */
export async function getFormulaRules(babyId?: number): Promise<EasyFormulaRule[]> {
  const conditions: SQLWrapper[] = [];

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
    cycleLengthMinutes: rule.cycleLengthMinutes,
    activityRangeMin: rule.activityRangeMinutes[0],
    activityRangeMax: rule.activityRangeMinutes[1],
    feedDurationMinutes: rule.feedDurationMinutes,
    napDurationsMinutes: JSON.stringify(rule.napDurationsMinutes),
    thirdNapDropWakeThreshold: rule.thirdNapDropWakeThreshold,
    morningNapCapMinutes: rule.morningNapCapMinutes,
    afternoonActivityRangeMin: rule.afternoonActivityRangeMinutes?.[0],
    afternoonActivityRangeMax: rule.afternoonActivityRangeMinutes?.[1],
    nightSleepMinutes: rule.nightSleepMinutes,
    bedtimeRoutineMinutes: rule.bedtimeRoutineMinutes,
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

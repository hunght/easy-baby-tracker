import { sql } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';

type FormulaRuleInsert = typeof schema.easyFormulaRules.$inferInsert;

/**
 * Seed predefined formula rules - called during migration or first app load
 */
export async function seedPredefinedFormulas(): Promise<void> {
  const predefinedRules: FormulaRuleInsert[] = [
    {
      id: 'easy3',
      isCustom: false,
      minWeeks: 0,
      maxWeeks: 6,
      labelKey: 'easySchedule.formulas.easy3.label',
      ageRangeKey: 'easySchedule.formulas.easy3.ageRange',
      description: 'easySchedule.formulas.easy3.description',
      // 4 naps + night sleep: E 45m, A 15m, S varies (2h, 2h, 2h, 45m, 12h night)
      phases: JSON.stringify([
        { eat: 45, activity: 15, sleep: 120 },
        { eat: 45, activity: 15, sleep: 120 },
        { eat: 45, activity: 15, sleep: 120 },
        { eat: 45, activity: 15, sleep: 45 },
        { eat: 0, activity: 75, sleep: 12 * 60 },
      ]),
    },
    {
      id: 'easy3_5',
      isCustom: false,
      minWeeks: 6,
      maxWeeks: 8,
      labelKey: 'easySchedule.formulas.easy3_5.label',
      ageRangeKey: 'easySchedule.formulas.easy3_5.ageRange',
      description: 'easySchedule.formulas.easy3_5.description',
      // Cycle 1: 7:00 - 10:30 (3.5h) | E 45, A 45, S 120
      // Cycle 2: 10:30 - 14:00 (3.5h) | E 45, A 45, S 120
      // Cycle 3: 14:00 - 17:00 (3h) | E 45, A 45, S 90
      // Cycle 4: 17:00 - 18:30 (1.5h) | E 30, A 30, S 30
      // Night sleep: 12h
      phases: JSON.stringify([
        { eat: 45, activity: 45, sleep: 120 },
        { eat: 45, activity: 45, sleep: 120 },
        { eat: 45, activity: 45, sleep: 90 },
        { eat: 30, activity: 30, sleep: 30 },
        { eat: 0, activity: 75, sleep: 12 * 60 },
      ]),
    },
    {
      id: 'easy4',
      isCustom: false,
      minWeeks: 8,
      maxWeeks: 19,
      labelKey: 'easySchedule.formulas.easy4.label',
      ageRangeKey: 'easySchedule.formulas.easy4.ageRange',
      description: 'easySchedule.formulas.easy4.description',
      // Cycle 1: 7:00 - 11:00 (4h) | E.A. 2h, S.Y. 2h
      // Cycle 2: 11:00 - 15:00 (4h) | E.A. 2h, S.Y. 2h
      // Cycle 3: 15:00 - 17:30 (2.5h) | E.A. 2h, S.Y. 30m (catnap)
      // Cycle 4: 17:30 - 19:00 | Optional feed, bedtime routine
      phases: JSON.stringify([
        { eat: 45, activity: 75, sleep: 120 },
        { eat: 45, activity: 75, sleep: 120 },
        { eat: 45, activity: 75, sleep: 30 },
        { eat: 30, activity: 60, sleep: 0 },
      ]),
    },
    {
      id: 'easy234',
      isCustom: false,
      minWeeks: 19,
      maxWeeks: 46,
      labelKey: 'easySchedule.formulas.easy234.label',
      ageRangeKey: 'easySchedule.formulas.easy234.ageRange',
      description: 'easySchedule.formulas.easy234.description',
      // 2-3-4 wake windows: 2h before nap 1, 3h before nap 2, 4h before bedtime
      // Cycle 1: 7:00 - 11:00 (4h) | E.A. 2h wake, S.Y. 2h nap
      // Cycle 2: 11:00 - 15:00 (4h) | E.A. 3h wake, S.Y. 1h nap
      // Cycle 3: 15:00 - 18:00 (3h) | E.A. 3h wake (4h to bedtime)
      // Cycle 4: 18:00 - 19:00 | Bedtime routine (bath, feed, sleep)
      phases: JSON.stringify([
        { eat: 45, activity: 75, sleep: 120 },
        { eat: 45, activity: 135, sleep: 60 },
        { eat: 45, activity: 135, sleep: 0 },
        { eat: 30, activity: 30, sleep: 0 },
      ]),
    },
    {
      id: 'easy56',
      isCustom: false,
      minWeeks: 46,
      maxWeeks: null,
      labelKey: 'easySchedule.formulas.easy56.label',
      ageRangeKey: 'easySchedule.formulas.easy56.ageRange',
      description: 'easySchedule.formulas.easy56.description',
      // Toddler 1-nap schedule: wake 5h, nap 1.5-2h, wake 6h to bedtime
      // 7:00: E breakfast, A morning activities
      // 12:00: S nap 1.5-2h
      // 14:00: E milk, A afternoon activities
      // 18:00: E dinner, bedtime routine
      // 19:00: Night sleep 10-12h
      phases: JSON.stringify([
        { eat: 30, activity: 270, sleep: 0 },
        { eat: 30, activity: 30, sleep: 120 },
        { eat: 30, activity: 210, sleep: 0 },
        { eat: 30, activity: 60, sleep: 0 },
      ]),
    },
  ];

  await db
    .insert(schema.easyFormulaRules)
    .values(predefinedRules)
    .onConflictDoUpdate({
      target: schema.easyFormulaRules.id,
      set: {
        description: sql`excluded.description`,
      },
    });
}

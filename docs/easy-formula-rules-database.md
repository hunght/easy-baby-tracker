# EASY Formula Rules Database Implementation

## Overview

This document describes the database implementation for storing EASY (Eat-Activity-Sleep-You) schedule formula rules, enabling both predefined rules and user-created custom formulas.

## Database Schema

### Table: `easy_formula_rules`

Stores both predefined EASY formula rules and user-created custom formulas.

**Key Fields:**

- `id` (TEXT, PRIMARY KEY): Unique identifier ('newborn', 'fourToSixMonths', etc. or 'custom*<babyId>*<timestamp>')
- `baby_id` (INTEGER, FK): NULL for predefined, set for user-created formulas
- `is_custom` (BOOLEAN): Distinguishes predefined (false) vs custom (true) formulas
- `min_weeks` / `max_weeks`: Age range applicability (max_weeks NULL = open-ended)

**Translation Fields** (for predefined formulas):

- `label_key`, `age_range_key`, `cycle_key`, etc.: i18n translation keys
- `label_text`, `age_range_text`, etc.: Direct text values for custom formulas

**Schedule Parameters:**

- `cycle_length_minutes`: Full EASY cycle duration
- `activity_range_min` / `activity_range_max`: Wake window range
- `feed_duration_minutes`: Expected feeding time
- `nap_durations_minutes` (JSON): Array of nap durations [120, 120, 90]
- `third_nap_drop_wake_threshold`: Wake window threshold to drop 3rd nap
- `morning_nap_cap_minutes`: Max morning nap duration
- `afternoon_activity_range_min` / `afternoon_activity_range_max`: Toddler-specific
- `night_sleep_minutes`: Expected night sleep duration
- `bedtime_routine_minutes`: Bedtime routine duration

**Indexes:**

- `idx_formula_rules_baby_id`: Query by baby
- `idx_formula_rules_custom`: Filter predefined vs custom
- `idx_formula_rules_weeks`: Age-based lookup

## Predefined Formula Rules

Five predefined formulas are seeded during migration:

1. **newborn** (0-16 weeks):
   - 3-hour cycle (180 min)
   - Activity: 45-75 min
   - Feed: 35 min
   - Naps: [120, 120, 90, 60] min

2. **fourToSixMonths** (16-24 weeks):
   - 4-hour cycle (240 min)
   - Activity: 90-120 min
   - Feed: 30 min
   - Naps: [120, 120, 90] min

3. **sixToNineMonths** (24-40 weeks):
   - 4-hour cycle (240 min)
   - Activity: 120-180 min
   - Feed: 30 min
   - Naps: [90, 90, 60] min
   - Third nap drops when wake window ≥ 180 min

4. **nineToTwelveMonths** (40-52 weeks):
   - Extended EASY (2-nap)
   - Activity: 150-240 min
   - Feed: 25 min
   - Naps: [90, 120] min
   - Morning nap capped at 120 min

5. **toddler** (52+ weeks):
   - 5-6 hour awake blocks (1 nap)
   - Activity: 240-300 min morning, 240-300 min afternoon
   - Feed: 20 min
   - Nap: [120] min
   - Night sleep: 660 min (11 hours)
   - Bedtime routine: 30 min

## Database Module: `database/easy-formula-rules.ts`

### Functions

#### `seedPredefinedFormulas(): Promise<void>`

Seeds the 5 predefined formulas. Uses `ON CONFLICT DO NOTHING` to be idempotent.

#### `getFormulaRules(babyId?: number): Promise<EasyFormulaRule[]>`

Returns all available formulas for a baby (predefined + their custom formulas).

#### `getFormulaRuleById(ruleId: string, babyId?: number): Promise<EasyFormulaRule | null>`

Fetches a specific formula by ID, checking baby access permissions.

#### `getFormulaRuleByAge(ageWeeks: number, babyId?: number): Promise<EasyFormulaRule | null>`

Auto-selects the appropriate formula based on baby's age in weeks.

#### `createCustomFormulaRule(babyId, rule): Promise<string>`

Creates a user-defined custom formula. Generates unique ID as `custom_<babyId>_<timestamp>`.

#### `deleteCustomFormulaRule(ruleId: string, babyId: number): Promise<void>`

Deletes a custom formula. Only works for custom formulas owned by the baby.

## React Query Integration

### Query Keys (in `constants/query-keys.ts`)

```typescript
export const FORMULA_RULES_QUERY_KEY = ['formulaRules'] as const;
export const formulaRulesByBabyKey = (babyId?: number) => ['formulaRules', babyId] as const;
export const formulaRuleByIdKey = (ruleId: string, babyId?: number) =>
  ['formulaRules', ruleId, babyId] as const;
export const formulaRuleByAgeKey = (ageWeeks: number, babyId?: number) =>
  ['formulaRules', 'age', ageWeeks, babyId] as const;
```

### Example Usage

```typescript
import { useQuery } from '@tanstack/react-query';
import { getFormulaRules, getFormulaRuleByAge } from '@/database/easy-formula-rules';
import { formulaRulesByBabyKey, formulaRuleByAgeKey } from '@/constants/query-keys';

// Get all formulas for current baby
const { data: formulas } = useQuery({
  queryKey: formulaRulesByBabyKey(babyId),
  queryFn: () => getFormulaRules(babyId),
});

// Auto-select formula by age
const { data: ageBasedFormula } = useQuery({
  queryKey: formulaRuleByAgeKey(ageWeeks, babyId),
  queryFn: () => getFormulaRuleByAge(ageWeeks, babyId),
  enabled: ageWeeks !== undefined,
});
```

## Migration

**File:** `drizzle/0002_wooden_zuras.sql`

The migration:

1. Creates the `easy_formula_rules` table
2. Creates 3 indexes for efficient querying
3. Seeds 5 predefined formulas using `INSERT ... ON CONFLICT DO NOTHING`
4. Updates specific formulas with optional parameters (third nap threshold, morning cap, toddler afternoon/night parameters)

**Running Migration:**

```bash
npm run db:generate  # Generate migration SQL
npm start            # Auto-runs migration on app startup
```

## Future: Custom Formula Creation

The database is prepared for user-created custom formulas:

1. **UI Flow:**
   - User creates custom formula from settings
   - Form collects: name, age range, cycle parameters, nap durations
   - Saves with `createCustomFormulaRule()`

2. **Storage:**
   - Custom formulas use `label_text`, `age_range_text`, etc. (not translation keys)
   - `is_custom = true` and `baby_id` set to owner
   - ID format: `custom_<babyId>_<timestamp>`

3. **Access Control:**
   - Custom formulas only visible to owning baby
   - Predefined formulas visible to all
   - Queries automatically filter based on `baby_id`

## Translation Keys

Added missing translation key for formula selection screen:

**English:** `easySchedule.selectFormulaTitle = 'Select Formula'`
**Vietnamese:** `easySchedule.selectFormulaTitle = 'Chọn Công thức'`

## Type Compatibility

The `EasyFormulaRule` type in `lib/easy-schedule-generator.ts` remains unchanged. The database module converts DB records to this type via `dbToFormulaRule()`, ensuring backward compatibility with existing schedule generation code.

## Next Steps

1. **Update `easy-schedule-generator.ts`** to optionally fetch formulas from DB instead of hardcoded constants
2. **Create React Query hooks** for formula CRUD operations
3. **Build UI components** for:
   - Formula selection modal (already exists at `app/(easy-schedule)/easy-schedule-select.tsx`)
   - Custom formula creation form (future)
   - Custom formula management (future)
4. **Add formula customization** to settings/preferences
5. **Implement formula versioning** if formulas need updates over time

## Notes

- Timestamps use Unix seconds (`unixepoch()` in SQL, `Math.floor(Date.now() / 1000)` in JS)
- JSON fields store arrays as strings (SQLite has no native JSON type)
- The schema supports both i18n keys (predefined) and direct text (custom)
- ON CONFLICT DO NOTHING ensures migration is idempotent (safe to re-run)

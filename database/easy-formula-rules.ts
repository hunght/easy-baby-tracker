import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import type {
  EasyFormulaRule,
  EasyFormulaRuleId,
  EasyCyclePhase,
} from '@/lib/easy-schedule-generator';
import { getActiveBabyProfile, updateSelectedEasyFormula } from '@/database/baby-profile';
import { safeParseEasyCyclePhases } from '@/lib/json-parse';

// ============================================
// TYPES
// ============================================

type FormulaRuleRow = Database['public']['Tables']['easy_formula_rules']['Row'];
type FormulaRuleInsert = Database['public']['Tables']['easy_formula_rules']['Insert'];

export { FormulaRuleInsert };

/**
 * Convert DB record to EasyFormulaRule
 */
function dbToFormulaRule(record: FormulaRuleRow): EasyFormulaRule {
  return {
    id: record.id,
    minWeeks: record.min_weeks,
    maxWeeks: record.max_weeks,
    labelKey: record.label_key ?? record.label_text ?? '',
    labelText: record.label_text ?? null,
    ageRangeKey: record.age_range_key ?? record.age_range_text ?? '',
    ageRangeText: record.age_range_text ?? null,
    description: record.description ?? null,
    // Parse phases from JSON string
    phases: safeParseEasyCyclePhases(record.phases),
    validDate: record.valid_date ?? null,
  };
}

/**
 * Get all formula rules (predefined + user custom for specific baby)
 * Excludes day-specific rules (validDate is set)
 */
export async function getFormulaRules(babyId?: number): Promise<EasyFormulaRule[]> {
  let query = supabase
    .from('easy_formula_rules')
    .select('*')
    .is('valid_date', null);

  if (babyId) {
    // (is_custom = false) OR (baby_id = babyId)
    // Postgrest syntax: or=(is_custom.eq.false,baby_id.eq.123)
    query = query.or(`is_custom.eq.false,baby_id.eq.${babyId}`);
  } else {
    query = query.eq('is_custom', false);
  }

  // Sort by min_weeks
  query = query.order('min_weeks', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(dbToFormulaRule);
}

/**
 * Get formula rule by ID
 * Can retrieve day-specific rules (validDate is set) if babyId matches
 */
export async function getFormulaRuleById(
  ruleId: string,
  babyId?: number
): Promise<EasyFormulaRule | null> {
  let query = supabase
    .from('easy_formula_rules')
    .select('*')
    .eq('id', ruleId);

  if (babyId) {
    query = query.or(`is_custom.eq.false,baby_id.eq.${babyId}`);
  } else {
    query = query.eq('is_custom', false);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;

  return dbToFormulaRule(data);
}

/**
 * Get formula rule by age in weeks
 */
export async function getFormulaRuleByAge(
  ageWeeks: number,
  babyId?: number
): Promise<EasyFormulaRule | null> {
  // Logic:
  // min_weeks >= 0
  // AND (
  //   (min_weeks <= ageWeeks AND max_weeks >= ageWeeks)
  //   OR
  //   (min_weeks <= ageWeeks AND max_weeks IS NULL)
  // )
  // AND valid_date IS NULL
  // AND (is_custom = false OR baby_id = babyId)

  // This complex filtering is hard in single Postgrest call if not carefully constructed.
  // We can fetch candidates (based on simple filters) and filter in JS, typically dataset is small (<20 rules).
  // Or construct complex Postgrest query.

  // Let's try to filter by min_weeks <= ageWeeks in DB, and filter the rest in JS as it's easier and specific enough.
  let query = supabase
    .from('easy_formula_rules')
    .select('*')
    .gte('min_weeks', 0)
    .lte('min_weeks', ageWeeks)
    .is('valid_date', null);

  if (babyId) {
    query = query.or(`is_custom.eq.false,baby_id.eq.${babyId}`);
  } else {
    query = query.eq('is_custom', false);
  }

  const { data, error } = await query.order('min_weeks', { ascending: true });
  if (error) throw error;

  // Filter in JS for max_weeks logic
  const match = (data ?? []).find(rule => {
    if (rule.max_weeks === null) return true;
    return rule.max_weeks >= ageWeeks;
  });

  return match ? dbToFormulaRule(match) : null;
}

/**
 * Get day-specific formula rule for a baby and date
 * Returns the custom rule for that specific date, or null if none exists
 */
export async function getFormulaRuleByDate(
  babyId: number,
  date: string // YYYY-MM-DD format
): Promise<EasyFormulaRule | null> {
  const { data, error } = await supabase
    .from('easy_formula_rules')
    .select('*')
    .eq('baby_id', babyId)
    .eq('valid_date', date)
    .eq('is_custom', true)
    .single();

  if (error || !data) return null;
  return dbToFormulaRule(data);
}

/**
 * Get predefined formula rules (not custom, not day-specific)
 */
export async function getPredefinedFormulaRules(): Promise<EasyFormulaRule[]> {
  const { data, error } = await supabase
    .from('easy_formula_rules')
    .select('*')
    .eq('is_custom', false)
    .is('valid_date', null)
    .order('min_weeks', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(dbToFormulaRule);
}

/**
 * Get user custom formula rules (custom, not day-specific, for specific baby)
 */
export async function getUserCustomFormulaRules(babyId: number): Promise<EasyFormulaRule[]> {
  const { data, error } = await supabase
    .from('easy_formula_rules')
    .select('*')
    .eq('baby_id', babyId)
    .eq('is_custom', true)
    .is('valid_date', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(dbToFormulaRule);
}

/**
 * Get day-specific (temporary) formula rules for a baby
 * These are custom rules that apply only to a specific date
 */
export async function getDaySpecificFormulaRules(babyId: number): Promise<EasyFormulaRule[]> {
  const { data, error } = await supabase
    .from('easy_formula_rules')
    .select('*')
    .eq('baby_id', babyId)
    .eq('is_custom', true)
    .not('valid_date', 'is', null)
    .order('valid_date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(dbToFormulaRule);
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
  // Get the source rule
  const sourceRule = await getFormulaRuleById(sourceRuleId, babyId);
  if (!sourceRule) {
    throw new Error(`Source formula rule ${sourceRuleId} not found`);
  }

  // Check if a day-specific rule already exists for this date
  const existing = await getFormulaRuleByDate(babyId, date);
  if (existing) {
    // Update existing day-specific rule with new phases
    const { error } = await supabase
      .from('easy_formula_rules')
      .update({
        source_rule_id: sourceRuleId,
        phases: JSON.stringify(phases),
        updated_at: Math.floor(Date.now() / 1000),
      })
      .eq('id', existing.id);

    if (error) throw error;
    return existing.id;
  }

  // Create new day-specific rule by cloning the source record
  const newRuleId = `day_${babyId}_${date.replace(/-/g, '')}_${Date.now()}`;

  const { error } = await supabase
    .from('easy_formula_rules')
    .insert({
      id: newRuleId,
      baby_id: babyId,
      min_weeks: sourceRule.minWeeks,
      max_weeks: sourceRule.maxWeeks,
      label_key: sourceRule.labelKey,
      label_text: sourceRule.labelText,
      age_range_key: sourceRule.ageRangeKey,
      age_range_text: sourceRule.ageRangeText,
      description: sourceRule.description,
      is_custom: true,
      valid_date: date,
      source_rule_id: sourceRuleId,
      phases: JSON.stringify(phases),
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    });

  if (error) throw error;
  return newRuleId;
}

/**
 * Create custom formula rule (for future feature)
 */
export async function createCustomFormulaRule(
  babyId: number,
  rule: Omit<EasyFormulaRule, 'id'> & { id: string; name: string }
): Promise<string> {
  const newId = `custom_${babyId}_${Date.now()}`;

  const { error } = await supabase
    .from('easy_formula_rules')
    .insert({
      id: newId,
      baby_id: babyId,
      is_custom: true,
      min_weeks: rule.minWeeks,
      max_weeks: rule.maxWeeks,
      label_text: rule.name,
      age_range_text: `${rule.minWeeks} - ${rule.maxWeeks ?? '∞'} weeks`,
      description: rule.description,
      phases: JSON.stringify(rule.phases),
    });

  if (error) throw error;
  return newId;
}

/**
 * Update custom formula rule
 */
export async function updateCustomFormulaRule(
  ruleId: string,
  babyId: number,
  rule: Omit<EasyFormulaRule, 'id'> & { name: string }
): Promise<void> {
  const { error } = await supabase
    .from('easy_formula_rules')
    .update({
      label_text: rule.name,
      age_range_text: `${rule.minWeeks} - ${rule.maxWeeks ?? '∞'} weeks`,
      min_weeks: rule.minWeeks,
      max_weeks: rule.maxWeeks,
      description: rule.description,
      phases: JSON.stringify(rule.phases),
      updated_at: Math.floor(Date.now() / 1000),
    })
    .eq('id', ruleId)
    .eq('baby_id', babyId)
    .eq('is_custom', true);

  if (error) throw error;
}

/**
 * Delete custom formula rule
 */
export async function deleteCustomFormulaRule(ruleId: string, babyId: number): Promise<void> {
  const { error } = await supabase
    .from('easy_formula_rules')
    .delete()
    .eq('id', ruleId)
    .eq('baby_id', babyId)
    .eq('is_custom', true);

  if (error) throw error;
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

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { EasyFormulaRule, EasyCyclePhase } from "@/lib/easy-schedule-generator";
import { convex } from "@/lib/convex";

// ============================================
// TYPE DEFINITIONS
// ============================================

// Convex document type
export type EasyFormulaRuleDoc = Doc<"easyFormulaRules">;

// Convex ID type
export type EasyFormulaRuleId = Id<"easyFormulaRules">;

// Re-export for convenience
export type { EasyFormulaRule, EasyCyclePhase };

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const easyFormulaRulesApi = {
  list: api.easyFormulaRules.list,
  getById: api.easyFormulaRules.getById,
  getByAge: api.easyFormulaRules.getByAge,
  getByDate: api.easyFormulaRules.getByDate,
  getPredefined: api.easyFormulaRules.getPredefined,
  getUserCustom: api.easyFormulaRules.getUserCustom,
  getDaySpecific: api.easyFormulaRules.getDaySpecific,
};

// Mutations
export const easyFormulaRulesMutations = {
  create: api.easyFormulaRules.create,
  update: api.easyFormulaRules.update,
  remove: api.easyFormulaRules.remove,
  cloneForDate: api.easyFormulaRules.cloneForDate,
  seedPredefined: api.easyFormulaRules.seedPredefined,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate duration in minutes between two time strings (HH:MM)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMins] = startTime.split(":").map(Number);
  const [endHours, endMins] = endTime.split(":").map(Number);

  let startMinutes = startHours * 60 + startMins;
  let endMinutes = endHours * 60 + endMins;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

// ============================================
// ASYNC WRAPPER FUNCTIONS (for non-React usage)
// ============================================

// Get formula rule by ID with phases parsed
export async function getFormulaRuleById(
  ruleId: string,
  babyId?: string
): Promise<EasyFormulaRule | null> {
  const rule = await convex.query(api.easyFormulaRules.getById, {
    ruleId,
    babyId: babyId as Id<"babyProfiles"> | undefined
  });

  if (!rule) return null;

  // Parse phases from JSON string
  const phases: EasyCyclePhase[] = typeof rule.phases === "string"
    ? JSON.parse(rule.phases)
    : rule.phases;

  return {
    id: rule.ruleId,
    minWeeks: rule.minWeeks,
    maxWeeks: rule.maxWeeks ?? null,
    labelKey: rule.labelKey ?? "",
    labelText: rule.labelText,
    ageRangeKey: rule.ageRangeKey ?? "",
    ageRangeText: rule.ageRangeText,
    description: rule.description,
    phases,
  };
}

// Re-export the full API for convenience
export { api };

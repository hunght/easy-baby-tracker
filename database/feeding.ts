import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type FeedingType = "breast" | "bottle" | "solids";
export type IngredientType = "breast_milk" | "formula" | "others";

// Convex document type
export type FeedingDoc = Doc<"feedings">;

// Convex ID type
export type FeedingId = Id<"feedings">;

// Record type (alias for consistency)
export type FeedingRecord = FeedingDoc;

// Payload for creating feedings
export type FeedingPayload = {
  babyId: Id<"babyProfiles">;
  type: string;
  startTime: number;
  duration?: number;
  leftDuration?: number;
  rightDuration?: number;
  ingredientType?: string;
  amountMl?: number;
  ingredient?: string;
  amountGrams?: number;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const feedingsApi = {
  list: api.feedings.list,
  getById: api.feedings.getById,
};

// Mutations
export const feedingsMutations = {
  create: api.feedings.create,
  update: api.feedings.update,
  remove: api.feedings.remove,
};

// Re-export the full API for convenience
export { api };

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

// Convex document type
export type PumpingDoc = Doc<"pumpings">;

// Convex ID type
export type PumpingId = Id<"pumpings">;

// Record type (alias for consistency)
export type PumpingRecord = PumpingDoc;

// Payload for creating pumpings
export type PumpingPayload = {
  babyId: Id<"babyProfiles">;
  startTime: number;
  amountMl: number;
  leftAmountMl?: number;
  rightAmountMl?: number;
  leftDuration?: number;
  rightDuration?: number;
  duration?: number;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const pumpingsApi = {
  list: api.pumpings.list,
  getById: api.pumpings.getById,
  getInventory: api.pumpings.getInventory,
};

// Mutations
export const pumpingsMutations = {
  create: api.pumpings.create,
  update: api.pumpings.update,
  remove: api.pumpings.remove,
};

// Re-export the full API for convenience
export { api };

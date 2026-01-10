import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

// Convex document type
export type GrowthRecordDoc = Doc<"growthRecords">;

// Convex ID type
export type GrowthRecordId = Id<"growthRecords">;

// Record type (alias for consistency)
export type GrowthRecord = GrowthRecordDoc;

// Payload for creating growth records
export type GrowthRecordPayload = {
  babyId: Id<"babyProfiles">;
  time: number;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const growthRecordsApi = {
  list: api.growthRecords.list,
  getById: api.growthRecords.getById,
};

// Mutations
export const growthRecordsMutations = {
  create: api.growthRecords.create,
  update: api.growthRecords.update,
  remove: api.growthRecords.remove,
};

// Re-export the full API for convenience
export { api };

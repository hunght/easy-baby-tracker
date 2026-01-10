import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type DiaperKind = "wet" | "dirty" | "mixed" | "dry";

export type PoopColor =
  | "yellow"
  | "brown"
  | "olive_green"
  | "dark_green"
  | "red"
  | "black"
  | "white";

// Convex document type
export type DiaperChangeDoc = Doc<"diaperChanges">;

// Convex ID type
export type DiaperChangeId = Id<"diaperChanges">;

// Record type (alias for consistency)
export type DiaperChangeRecord = DiaperChangeDoc;

// Payload for creating diaper changes
export type DiaperChangePayload = {
  babyId: Id<"babyProfiles">;
  kind: string;
  time: number;
  wetness?: number;
  color?: string;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const diaperChangesApi = {
  list: api.diaperChanges.list,
  getById: api.diaperChanges.getById,
};

// Mutations
export const diaperChangesMutations = {
  create: api.diaperChanges.create,
  update: api.diaperChanges.update,
  remove: api.diaperChanges.remove,
};

// Re-export the full API for convenience
export { api };

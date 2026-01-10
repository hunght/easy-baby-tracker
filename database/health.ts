import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type HealthRecordType = "temperature" | "medicine" | "symptom" | "vaccine" | "doctor_visit";
export type MedicineType = "medication" | "vaccine" | "liquid" | "tablet" | "drops" | "injection" | "cream" | "other";

// Convex document type
export type HealthRecordDoc = Doc<"healthRecords">;

// Convex ID type
export type HealthRecordId = Id<"healthRecords">;

// Record type (alias for consistency)
export type HealthRecord = HealthRecordDoc;

// Payload for creating health records
export type HealthRecordPayload = {
  babyId: Id<"babyProfiles">;
  type: string;
  time: number;
  temperature?: number;
  medicineType?: string;
  medication?: string;
  symptoms?: string;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const healthRecordsApi = {
  list: api.healthRecords.list,
  getById: api.healthRecords.getById,
};

// Mutations
export const healthRecordsMutations = {
  create: api.healthRecords.create,
  update: api.healthRecords.update,
  remove: api.healthRecords.remove,
};

// Re-export the full API for convenience
export { api };

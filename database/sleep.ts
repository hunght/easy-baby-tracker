import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SleepSessionKind = "nap" | "night";

// Convex document type
export type SleepSessionDoc = Doc<"sleepSessions">;

// Convex ID type
export type SleepSessionId = Id<"sleepSessions">;

// Record type (alias for consistency)
export type SleepSessionRecord = SleepSessionDoc;

// Payload for creating sleep sessions
export type SleepSessionPayload = {
  babyId: Id<"babyProfiles">;
  kind: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  notes?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const sleepSessionsApi = {
  list: api.sleepSessions.list,
  getById: api.sleepSessions.getById,
};

// Mutations
export const sleepSessionsMutations = {
  create: api.sleepSessions.create,
  update: api.sleepSessions.update,
  remove: api.sleepSessions.remove,
};

// Re-export the full API for convenience
export { api };

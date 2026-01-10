import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type TimelineActivityType =
  | "diaper"
  | "feeding"
  | "sleep"
  | "growth"
  | "health"
  | "pumping"
  | "diary";

// Timeline activity as returned by Convex
export type TimelineActivity = {
  id: Id<
    | "feedings"
    | "sleepSessions"
    | "diaperChanges"
    | "pumpings"
    | "growthRecords"
    | "healthRecords"
    | "diaryEntries"
  >;
  type: TimelineActivityType;
  time: number;
  data: Record<string, unknown>;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const timelineApi = {
  getActivities: api.timeline.getActivities,
};

// Mutations
export const timelineMutations = {
  deleteActivity: api.timeline.deleteActivity,
};

// Re-export the full API for convenience
export { api };

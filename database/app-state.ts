import { api } from "@/convex/_generated/api";

// ============================================
// TYPE DEFINITIONS
// ============================================

// App state keys
export const APP_STATE_KEYS = {
  ACTIVE_PROFILE_ID: "activeProfileId",
  EASY_REMINDER_ENABLED: "easyScheduleReminderEnabled",
  EASY_REMINDER_ADVANCE_MINUTES: "easyScheduleReminderAdvanceMinutes",
} as const;

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const appStateApi = {
  get: api.appState.get,
};

// Mutations
export const appStateMutations = {
  set: api.appState.set,
};

// Re-export the full API for convenience
export { api };

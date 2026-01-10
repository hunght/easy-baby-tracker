import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ============================================
// TYPE DEFINITIONS
// ============================================

// Convex document type
export type DiaryEntryDoc = Doc<"diaryEntries">;

// Convex ID type
export type DiaryEntryId = Id<"diaryEntries">;

// Record type (alias for consistency)
export type DiaryEntryRecord = DiaryEntryDoc;

// Payload for creating diary entries
export type DiaryEntryPayload = {
  babyId: Id<"babyProfiles">;
  title?: string;
  content?: string;
  photoUri?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const diaryEntriesApi = {
  list: api.diaryEntries.list,
  getById: api.diaryEntries.getById,
};

// Mutations
export const diaryEntriesMutations = {
  create: api.diaryEntries.create,
  update: api.diaryEntries.update,
  remove: api.diaryEntries.remove,
};

// Re-export the full API for convenience
export { api };

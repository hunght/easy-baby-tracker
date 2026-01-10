import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Gender = "boy" | "girl" | "unknown";

// Convex document type
export type BabyProfileDoc = Doc<"babyProfiles">;

// Payload for creating/updating baby profiles
export type BabyProfilePayload = {
  nickname: string;
  gender: string;
  birthDate: string;
  dueDate: string;
  avatarUri?: string;
  firstWakeTime?: string;
  selectedEasyFormulaId?: string;
  concerns?: string[];
};

// Record type with concerns (returned from queries)
export type BabyProfileRecord = BabyProfileDoc & {
  concerns: string[];
};

// Convex ID type for baby profiles
export type BabyProfileId = Id<"babyProfiles">;

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const babyProfilesApi = {
  list: api.babyProfiles.list,
  getById: api.babyProfiles.getById,
  getActive: api.babyProfiles.getActive,
  getActiveId: api.babyProfiles.getActiveId,
};

// Mutations
export const babyProfilesMutations = {
  create: api.babyProfiles.create,
  update: api.babyProfiles.update,
  setActive: api.babyProfiles.setActive,
  remove: api.babyProfiles.remove,
  updateFirstWakeTime: api.babyProfiles.updateFirstWakeTime,
  updateSelectedEasyFormula: api.babyProfiles.updateSelectedEasyFormula,
};

// ============================================
// ASYNC WRAPPER FUNCTIONS (for non-React usage)
// ============================================

// Get all baby profiles
export async function getBabyProfiles(): Promise<BabyProfileDoc[]> {
  return await convex.query(api.babyProfiles.list, {});
}

// Get active baby profile
export async function getActiveBabyProfile(): Promise<BabyProfileDoc | null> {
  return await convex.query(api.babyProfiles.getActive, {});
}

// Get active baby profile ID
export async function getActiveBabyProfileId(): Promise<Id<"babyProfiles"> | null> {
  const profile = await convex.query(api.babyProfiles.getActive, {});
  return profile?._id ?? null;
}

// Re-export the full API for convenience
export { api };

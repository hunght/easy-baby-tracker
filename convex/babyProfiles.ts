import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all baby profiles for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profiles = await ctx.db
      .query("babyProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();

    // Fetch concerns for each profile
    const profilesWithConcerns = await Promise.all(
      profiles.map(async (profile) => {
        const concerns = await ctx.db
          .query("concernChoices")
          .withIndex("by_baby", (q) => q.eq("babyId", profile._id))
          .collect();
        return {
          ...profile,
          concerns: concerns.map((c) => c.concernId),
        };
      })
    );

    return profilesWithConcerns;
  },
});

// Get a single baby profile by ID
export const getById = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.babyId);
    if (!profile) return null;

    const concerns = await ctx.db
      .query("concernChoices")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    return {
      ...profile,
      concerns: concerns.map((c) => c.concernId),
    };
  },
});

// Get active baby profile ID from app state
export const getActiveId = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const state = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", "activeProfileId")
      )
      .first();

    return state?.value ?? null;
  },
});

// Get the active baby profile
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const state = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", "activeProfileId")
      )
      .first();

    if (!state?.value) return null;

    // Parse and validate the stored baby profile ID
    const babyId = ctx.db.normalizeId("babyProfiles", state.value);
    if (!babyId) return null;

    const profile = await ctx.db.get(babyId);
    if (!profile) return null;

    const concerns = await ctx.db
      .query("concernChoices")
      .withIndex("by_baby", (q) => q.eq("babyId", babyId))
      .collect();

    return {
      ...profile,
      concerns: concerns.map((c) => c.concernId),
    };
  },
});

// Create a new baby profile
export const create = mutation({
  args: {
    nickname: v.string(),
    gender: v.string(),
    birthDate: v.string(),
    dueDate: v.string(),
    avatarUri: v.optional(v.string()),
    firstWakeTime: v.optional(v.string()),
    selectedEasyFormulaId: v.optional(v.string()),
    concerns: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Math.floor(Date.now() / 1000);
    const babyId = await ctx.db.insert("babyProfiles", {
      userId,
      nickname: args.nickname,
      gender: args.gender,
      birthDate: args.birthDate,
      dueDate: args.dueDate,
      avatarUri: args.avatarUri,
      firstWakeTime: args.firstWakeTime ?? "07:00",
      selectedEasyFormulaId: args.selectedEasyFormulaId,
      createdAt: now,
    });

    // Insert concerns
    if (args.concerns) {
      for (const concernId of args.concerns) {
        await ctx.db.insert("concernChoices", {
          babyId,
          concernId,
        });
      }
    }

    return babyId;
  },
});

// Update an existing baby profile
export const update = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    nickname: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    avatarUri: v.optional(v.string()),
    firstWakeTime: v.optional(v.string()),
    selectedEasyFormulaId: v.optional(v.string()),
    concerns: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { babyId, concerns, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(babyId, fieldsToUpdate);
    }

    // Update concerns if provided
    if (concerns !== undefined) {
      // Delete existing concerns
      const existingConcerns = await ctx.db
        .query("concernChoices")
        .withIndex("by_baby", (q) => q.eq("babyId", babyId))
        .collect();

      for (const concern of existingConcerns) {
        await ctx.db.delete(concern._id);
      }

      // Insert new concerns
      for (const concernId of concerns) {
        await ctx.db.insert("concernChoices", {
          babyId,
          concernId,
        });
      }
    }

    return babyId;
  },
});

// Set the active baby profile
export const setActive = mutation({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", "activeProfileId")
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.babyId });
    } else {
      await ctx.db.insert("appState", {
        userId,
        key: "activeProfileId",
        value: args.babyId,
      });
    }
  },
});

// Delete a baby profile
export const remove = mutation({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    // Delete concerns first
    const concerns = await ctx.db
      .query("concernChoices")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    for (const concern of concerns) {
      await ctx.db.delete(concern._id);
    }

    // Delete the profile
    await ctx.db.delete(args.babyId);
  },
});

// Update first wake time
export const updateFirstWakeTime = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    firstWakeTime: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.babyId, { firstWakeTime: args.firstWakeTime });
  },
});

// Update selected EASY formula
export const updateSelectedEasyFormula = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    selectedEasyFormulaId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let formulaId = args.selectedEasyFormulaId;

    // If no formula ID provided, auto-select based on baby's age
    if (!formulaId) {
      const baby = await ctx.db.get(args.babyId);
      if (baby) {
        const birthDate = new Date(baby.birthDate);
        const weeks = Math.floor(
          (Date.now() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );

        // Find a predefined formula that matches the age
        const allRules = await ctx.db.query("easyFormulaRules").collect();
        const matchingRule = allRules.find(
          (r) =>
            !r.isCustom &&
            r.minWeeks <= weeks &&
            (r.maxWeeks === undefined || r.maxWeeks >= weeks)
        );

        if (matchingRule) {
          formulaId = matchingRule.ruleId;
        }
      }
    }

    await ctx.db.patch(args.babyId, {
      selectedEasyFormulaId: formulaId,
    });
  },
});

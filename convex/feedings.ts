import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List feedings for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("feedings")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc");

    let results = await query.collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((f) => f.startTime >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((f) => f.startTime <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single feeding by ID
export const getById = query({
  args: { feedingId: v.id("feedings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.feedingId);
  },
});

// Create a new feeding
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    type: v.string(),
    startTime: v.number(),
    duration: v.optional(v.number()),
    leftDuration: v.optional(v.number()),
    rightDuration: v.optional(v.number()),
    ingredientType: v.optional(v.string()),
    amountMl: v.optional(v.number()),
    ingredient: v.optional(v.string()),
    amountGrams: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("feedings", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing feeding
export const update = mutation({
  args: {
    feedingId: v.id("feedings"),
    type: v.optional(v.string()),
    startTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    leftDuration: v.optional(v.number()),
    rightDuration: v.optional(v.number()),
    ingredientType: v.optional(v.string()),
    amountMl: v.optional(v.number()),
    ingredient: v.optional(v.string()),
    amountGrams: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { feedingId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(feedingId, fieldsToUpdate);
    }

    return feedingId;
  },
});

// Delete a feeding
export const remove = mutation({
  args: { feedingId: v.id("feedings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.feedingId);
  },
});

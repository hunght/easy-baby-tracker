import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List diaper changes for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("diaperChanges")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((d) => d.time >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((d) => d.time <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single diaper change by ID
export const getById = query({
  args: { diaperChangeId: v.id("diaperChanges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.diaperChangeId);
  },
});

// Create a new diaper change
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    kind: v.string(),
    time: v.number(),
    wetness: v.optional(v.number()),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("diaperChanges", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing diaper change
export const update = mutation({
  args: {
    diaperChangeId: v.id("diaperChanges"),
    kind: v.optional(v.string()),
    time: v.optional(v.number()),
    wetness: v.optional(v.number()),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { diaperChangeId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(diaperChangeId, fieldsToUpdate);
    }

    return diaperChangeId;
  },
});

// Delete a diaper change
export const remove = mutation({
  args: { diaperChangeId: v.id("diaperChanges") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.diaperChangeId);
  },
});

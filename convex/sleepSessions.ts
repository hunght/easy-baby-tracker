import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List sleep sessions for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    kind: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("sleepSessions")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by kind if provided
    if (args.kind !== undefined) {
      results = results.filter((s) => s.kind === args.kind);
    }

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((s) => s.startTime >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((s) => s.startTime <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single sleep session by ID
export const getById = query({
  args: { sleepSessionId: v.id("sleepSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sleepSessionId);
  },
});

// Create a new sleep session
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    kind: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("sleepSessions", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing sleep session
export const update = mutation({
  args: {
    sleepSessionId: v.id("sleepSessions"),
    kind: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sleepSessionId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(sleepSessionId, fieldsToUpdate);
    }

    return sleepSessionId;
  },
});

// Delete a sleep session
export const remove = mutation({
  args: { sleepSessionId: v.id("sleepSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sleepSessionId);
  },
});

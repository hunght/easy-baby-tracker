import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List growth records for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("growthRecords")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((g) => g.time >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((g) => g.time <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single growth record by ID
export const getById = query({
  args: { growthRecordId: v.id("growthRecords") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.growthRecordId);
  },
});

// Create a new growth record
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    time: v.number(),
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    headCircumferenceCm: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("growthRecords", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing growth record
export const update = mutation({
  args: {
    growthRecordId: v.id("growthRecords"),
    time: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    headCircumferenceCm: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { growthRecordId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(growthRecordId, fieldsToUpdate);
    }

    return growthRecordId;
  },
});

// Delete a growth record
export const remove = mutation({
  args: { growthRecordId: v.id("growthRecords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.growthRecordId);
  },
});

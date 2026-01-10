import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List health records for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    type: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("healthRecords")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by type if provided
    if (args.type !== undefined) {
      results = results.filter((h) => h.type === args.type);
    }

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((h) => h.time >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((h) => h.time <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single health record by ID
export const getById = query({
  args: { healthRecordId: v.id("healthRecords") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.healthRecordId);
  },
});

// Create a new health record
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    type: v.string(),
    time: v.number(),
    temperature: v.optional(v.number()),
    medicineType: v.optional(v.string()),
    medication: v.optional(v.string()),
    symptoms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("healthRecords", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing health record
export const update = mutation({
  args: {
    healthRecordId: v.id("healthRecords"),
    type: v.optional(v.string()),
    time: v.optional(v.number()),
    temperature: v.optional(v.number()),
    medicineType: v.optional(v.string()),
    medication: v.optional(v.string()),
    symptoms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { healthRecordId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(healthRecordId, fieldsToUpdate);
    }

    return healthRecordId;
  },
});

// Delete a health record
export const remove = mutation({
  args: { healthRecordId: v.id("healthRecords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.healthRecordId);
  },
});

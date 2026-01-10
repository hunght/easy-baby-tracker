import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List pumpings for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("pumpings")
      .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((p) => p.startTime >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((p) => p.startTime <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single pumping by ID
export const getById = query({
  args: { pumpingId: v.id("pumpings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pumpingId);
  },
});

// Get total pumping inventory (sum of all amounts)
export const getInventory = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const pumpings = await ctx.db
      .query("pumpings")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    return pumpings.reduce((total, p) => total + p.amountMl, 0);
  },
});

// Create a new pumping
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    startTime: v.number(),
    amountMl: v.number(),
    leftAmountMl: v.optional(v.number()),
    rightAmountMl: v.optional(v.number()),
    leftDuration: v.optional(v.number()),
    rightDuration: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("pumpings", {
      ...args,
      recordedAt: now,
    });
  },
});

// Update an existing pumping
export const update = mutation({
  args: {
    pumpingId: v.id("pumpings"),
    startTime: v.optional(v.number()),
    amountMl: v.optional(v.number()),
    leftAmountMl: v.optional(v.number()),
    rightAmountMl: v.optional(v.number()),
    leftDuration: v.optional(v.number()),
    rightDuration: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { pumpingId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(pumpingId, fieldsToUpdate);
    }

    return pumpingId;
  },
});

// Delete a pumping
export const remove = mutation({
  args: { pumpingId: v.id("pumpings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pumpingId);
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List diary entries for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("diaryEntries")
      .withIndex("by_baby_created", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      results = results.filter((d) => d.createdAt >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      results = results.filter((d) => d.createdAt <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single diary entry by ID
export const getById = query({
  args: { diaryEntryId: v.id("diaryEntries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.diaryEntryId);
  },
});

// Create a new diary entry
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    photoUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("diaryEntries", {
      ...args,
      createdAt: now,
    });
  },
});

// Update an existing diary entry
export const update = mutation({
  args: {
    diaryEntryId: v.id("diaryEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    photoUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { diaryEntryId, ...updateFields } = args;

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(diaryEntryId, fieldsToUpdate);
    }

    return diaryEntryId;
  },
});

// Delete a diary entry
export const remove = mutation({
  args: { diaryEntryId: v.id("diaryEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.diaryEntryId);
  },
});

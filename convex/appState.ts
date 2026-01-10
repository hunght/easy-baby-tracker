import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get a value from app state
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const state = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", args.key)
      )
      .first();

    return state?.value ?? null;
  },
});

// Set a value in app state
export const set = mutation({
  args: {
    key: v.string(),
    value: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("appState", {
        userId,
        key: args.key,
        value: args.value,
      });
    }
  },
});

// Get EASY reminder state
export const getEasyReminderState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const state = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", "easyReminderEnabled")
      )
      .first();

    return state?.value === "true";
  },
});

// Set EASY reminder state
export const setEasyReminderState = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("appState")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", userId).eq("key", "easyReminderEnabled")
      )
      .first();

    const value = args.enabled ? "true" : "false";

    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("appState", {
        userId,
        key: "easyReminderEnabled",
        value,
      });
    }
  },
});

// Delete all app state for a user
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const states = await ctx.db
      .query("appState")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const state of states) {
      await ctx.db.delete(state._id);
    }
  },
});

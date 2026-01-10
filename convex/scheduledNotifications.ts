import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List scheduled notifications for a baby profile
export const list = query({
  args: {
    babyId: v.id("babyProfiles"),
    notificationType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    // Filter by type if provided
    if (args.notificationType !== undefined) {
      results = results.filter(
        (n) => n.notificationType === args.notificationType
      );
    }

    return results;
  },
});

// Get active scheduled notifications (future notifications)
export const getActive = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    const notifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    return notifications.filter((n) => n.scheduledTime > now);
  },
});

// Get a notification by its notification ID
export const getByNotificationId = query({
  args: { notificationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_notification_id", (q) =>
        q.eq("notificationId", args.notificationId)
      )
      .first();
  },
});

// Create a new scheduled notification
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    notificationType: v.string(),
    notificationId: v.string(),
    scheduledTime: v.number(),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("scheduledNotifications", {
      ...args,
      createdAt: now,
    });
  },
});

// Delete a scheduled notification by notification ID
export const removeByNotificationId = mutation({
  args: { notificationId: v.string() },
  handler: async (ctx, args) => {
    const notification = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_notification_id", (q) =>
        q.eq("notificationId", args.notificationId)
      )
      .first();

    if (notification) {
      await ctx.db.delete(notification._id);
    }
  },
});

// Delete all scheduled notifications for a baby
export const removeAllForBaby = mutation({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

// Delete notifications by type for a baby
export const removeByType = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    notificationType: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("scheduledNotifications")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    const toDelete = notifications.filter(
      (n) => n.notificationType === args.notificationType
    );

    for (const notification of toDelete) {
      await ctx.db.delete(notification._id);
    }
  },
});

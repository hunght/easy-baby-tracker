import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Activity types for timeline
export type TimelineActivityType =
  | "feeding"
  | "sleep"
  | "diaper"
  | "pumping"
  | "growth"
  | "health"
  | "diary";

// Get aggregated timeline activities
export const getActivities = query({
  args: {
    babyId: v.id("babyProfiles"),
    beforeTime: v.optional(v.number()),
    limit: v.optional(v.number()),
    filterTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const beforeTime = args.beforeTime ?? Math.floor(Date.now() / 1000) + 86400;

    type TimelineItem = {
      id: Id<
        | "feedings"
        | "sleepSessions"
        | "diaperChanges"
        | "pumpings"
        | "growthRecords"
        | "healthRecords"
        | "diaryEntries"
      >;
      type: TimelineActivityType;
      time: number;
      data: Record<string, unknown>;
    };

    const activities: TimelineItem[] = [];

    // Helper to check if type should be included
    const shouldInclude = (type: TimelineActivityType) =>
      !args.filterTypes || args.filterTypes.includes(type);

    // Fetch feedings
    if (shouldInclude("feeding")) {
      const feedings = await ctx.db
        .query("feedings")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const feeding of feedings) {
        if (feeding.startTime <= beforeTime) {
          activities.push({
            id: feeding._id,
            type: "feeding",
            time: feeding.startTime,
            data: feeding,
          });
        }
      }
    }

    // Fetch sleep sessions
    if (shouldInclude("sleep")) {
      const sleepSessions = await ctx.db
        .query("sleepSessions")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const session of sleepSessions) {
        if (session.startTime <= beforeTime) {
          activities.push({
            id: session._id,
            type: "sleep",
            time: session.startTime,
            data: session,
          });
        }
      }
    }

    // Fetch diaper changes
    if (shouldInclude("diaper")) {
      const diaperChanges = await ctx.db
        .query("diaperChanges")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const change of diaperChanges) {
        if (change.time <= beforeTime) {
          activities.push({
            id: change._id,
            type: "diaper",
            time: change.time,
            data: change,
          });
        }
      }
    }

    // Fetch pumpings
    if (shouldInclude("pumping")) {
      const pumpings = await ctx.db
        .query("pumpings")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const pumping of pumpings) {
        if (pumping.startTime <= beforeTime) {
          activities.push({
            id: pumping._id,
            type: "pumping",
            time: pumping.startTime,
            data: pumping,
          });
        }
      }
    }

    // Fetch growth records
    if (shouldInclude("growth")) {
      const growthRecords = await ctx.db
        .query("growthRecords")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const record of growthRecords) {
        if (record.time <= beforeTime) {
          activities.push({
            id: record._id,
            type: "growth",
            time: record.time,
            data: record,
          });
        }
      }
    }

    // Fetch health records
    if (shouldInclude("health")) {
      const healthRecords = await ctx.db
        .query("healthRecords")
        .withIndex("by_baby_time", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const record of healthRecords) {
        if (record.time <= beforeTime) {
          activities.push({
            id: record._id,
            type: "health",
            time: record.time,
            data: record,
          });
        }
      }
    }

    // Fetch diary entries
    if (shouldInclude("diary")) {
      const diaryEntries = await ctx.db
        .query("diaryEntries")
        .withIndex("by_baby_created", (q) => q.eq("babyId", args.babyId))
        .order("desc")
        .collect();

      for (const entry of diaryEntries) {
        if (entry.createdAt <= beforeTime) {
          activities.push({
            id: entry._id,
            type: "diary",
            time: entry.createdAt,
            data: entry,
          });
        }
      }
    }

    // Sort by time descending and limit
    activities.sort((a, b) => b.time - a.time);
    return activities.slice(0, limit);
  },
});

// Delete a timeline activity
export const deleteActivity = mutation({
  args: {
    activityType: v.string(),
    activityId: v.string(),
  },
  handler: async (ctx, args) => {
    const { activityType, activityId } = args;

    switch (activityType) {
      case "feeding": {
        const id = ctx.db.normalizeId("feedings", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "sleep": {
        const id = ctx.db.normalizeId("sleepSessions", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "diaper": {
        const id = ctx.db.normalizeId("diaperChanges", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "pumping": {
        const id = ctx.db.normalizeId("pumpings", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "growth": {
        const id = ctx.db.normalizeId("growthRecords", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "health": {
        const id = ctx.db.normalizeId("healthRecords", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      case "diary": {
        const id = ctx.db.normalizeId("diaryEntries", activityId);
        if (id) await ctx.db.delete(id);
        break;
      }
      default:
        throw new Error(`Unknown activity type: ${activityType}`);
    }
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all habit definitions (optionally filtered by age)
export const getDefinitions = query({
  args: {
    ageMonths: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("habitDefinitions").collect();

    // Filter by active status if requested
    if (args.activeOnly) {
      results = results.filter((h) => h.isActive);
    }

    // Filter by age if provided
    if (args.ageMonths !== undefined) {
      results = results.filter((h) => {
        const minOk =
          h.minAgeMonths === undefined || h.minAgeMonths <= args.ageMonths!;
        const maxOk =
          h.maxAgeMonths === undefined || h.maxAgeMonths >= args.ageMonths!;
        return minOk && maxOk;
      });
    }

    // Sort by sortOrder
    results.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return results;
  },
});

// Get a habit definition by its definition ID
export const getDefinitionById = query({
  args: { definitionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitDefinitions")
      .withIndex("by_definition_id", (q) =>
        q.eq("definitionId", args.definitionId)
      )
      .first();
  },
});

// Get baby habits for a baby profile
export const getBabyHabits = query({
  args: {
    babyId: v.id("babyProfiles"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("babyHabits")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    // Filter by active status if requested
    if (args.activeOnly) {
      results = results.filter((h) => h.isActive);
    }

    // Join with habit definitions
    const habitsWithDefinitions = await Promise.all(
      results.map(async (habit) => {
        const definition = await ctx.db.get(habit.habitDefinitionId);
        return {
          ...habit,
          definition,
        };
      })
    );

    return habitsWithDefinitions;
  },
});

// Get baby habits with reminders
export const getBabyHabitsWithReminders = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("babyHabits")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    // Filter to only those with reminders set
    const habitsWithReminders = habits.filter(
      (h) => h.isActive && h.reminderTime
    );

    // Join with habit definitions
    const habitsWithDefinitions = await Promise.all(
      habitsWithReminders.map(async (habit) => {
        const definition = await ctx.db.get(habit.habitDefinitionId);
        return {
          ...habit,
          definition,
        };
      })
    );

    return habitsWithDefinitions;
  },
});

// Add a habit to a baby
export const addBabyHabit = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    habitDefinitionId: v.id("habitDefinitions"),
    targetFrequency: v.optional(v.string()),
    reminderTime: v.optional(v.string()),
    reminderDays: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("babyHabits", {
      babyId: args.babyId,
      habitDefinitionId: args.habitDefinitionId,
      isActive: true,
      targetFrequency: args.targetFrequency,
      reminderTime: args.reminderTime,
      reminderDays: args.reminderDays,
      createdAt: now,
    });
  },
});

// Remove a habit from a baby (deactivate)
export const removeBabyHabit = mutation({
  args: { babyHabitId: v.id("babyHabits") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.babyHabitId, { isActive: false });
  },
});

// Update baby habit reminder
export const updateBabyHabitReminder = mutation({
  args: {
    babyHabitId: v.id("babyHabits"),
    reminderTime: v.optional(v.string()),
    reminderDays: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { babyHabitId, ...updateFields } = args;
    await ctx.db.patch(babyHabitId, updateFields);
  },
});

// Log a habit completion
export const logHabit = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    babyHabitId: v.id("babyHabits"),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    return await ctx.db.insert("habitLogs", {
      babyId: args.babyId,
      babyHabitId: args.babyHabitId,
      completedAt: args.completedAt ?? now,
      duration: args.duration,
      notes: args.notes,
      recordedAt: now,
    });
  },
});

// Get today's habit logs for a baby
export const getTodayHabitLogs = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_baby_completed", (q) => q.eq("babyId", args.babyId))
      .collect();

    return logs.filter((log) => log.completedAt >= startTimestamp);
  },
});

// Get habit logs for a baby habit
export const getHabitLogs = query({
  args: {
    babyHabitId: v.id("babyHabits"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("babyHabitId", args.babyHabitId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined) {
      logs = logs.filter((l) => l.completedAt >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      logs = logs.filter((l) => l.completedAt <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit !== undefined) {
      logs = logs.slice(0, args.limit);
    }

    return logs;
  },
});

// Calculate habit streak
export const getHabitStreak = query({
  args: { babyHabitId: v.id("babyHabits") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("babyHabitId", args.babyHabitId))
      .order("desc")
      .collect();

    if (logs.length === 0) return 0;

    // Calculate streak by counting consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logDates = new Set(
      logs.map((log) => {
        const date = new Date(log.completedAt * 1000);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let checkDate = today;
    while (logDates.has(checkDate.getTime())) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return streak;
  },
});

// Seed habit definitions (for initial setup)
export const seedDefinitions = mutation({
  args: {
    definitions: v.array(
      v.object({
        definitionId: v.string(),
        category: v.string(),
        iconName: v.string(),
        labelKey: v.string(),
        descriptionKey: v.string(),
        minAgeMonths: v.optional(v.number()),
        maxAgeMonths: v.optional(v.number()),
        defaultFrequency: v.string(),
        sortOrder: v.optional(v.number()),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const definition of args.definitions) {
      // Check if already exists
      const existing = await ctx.db
        .query("habitDefinitions")
        .withIndex("by_definition_id", (q) =>
          q.eq("definitionId", definition.definitionId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("habitDefinitions", definition);
      }
    }
  },
});

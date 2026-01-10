import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all formula rules (predefined + custom for baby)
export const list = query({
  args: { babyId: v.optional(v.id("babyProfiles")) },
  handler: async (ctx, args) => {
    // Get predefined rules (no babyId)
    const predefined = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_custom", (q) => q.eq("isCustom", false))
      .collect();

    let results = [...predefined];

    // Get custom rules for this baby if babyId provided
    if (args.babyId) {
      const custom = await ctx.db
        .query("easyFormulaRules")
        .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
        .collect();
      results = [...results, ...custom];
    }

    return results;
  },
});

// Get a formula rule by its rule ID
export const getById = query({
  args: {
    ruleId: v.string(),
    babyId: v.optional(v.id("babyProfiles")),
  },
  handler: async (ctx, args) => {
    // First try to find by ruleId
    const rule = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_rule_id", (q) => q.eq("ruleId", args.ruleId))
      .first();

    return rule;
  },
});

// Get formula rule by age in weeks
export const getByAge = query({
  args: {
    weeks: v.number(),
    babyId: v.optional(v.id("babyProfiles")),
  },
  handler: async (ctx, args) => {
    const allRules = await ctx.db.query("easyFormulaRules").collect();

    // First, try to find a custom rule for this baby that matches the age
    if (args.babyId) {
      const customRule = allRules.find(
        (r) =>
          r.babyId === args.babyId &&
          r.isCustom &&
          !r.validDate &&
          r.minWeeks <= args.weeks &&
          (r.maxWeeks === undefined || r.maxWeeks >= args.weeks)
      );
      if (customRule) return customRule;
    }

    // Fall back to predefined rules
    const predefinedRule = allRules.find(
      (r) =>
        !r.isCustom &&
        r.minWeeks <= args.weeks &&
        (r.maxWeeks === undefined || r.maxWeeks >= args.weeks)
    );

    return predefinedRule ?? null;
  },
});

// Get formula rule by date (for day-specific overrides)
export const getByDate = query({
  args: {
    babyId: v.id("babyProfiles"),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    return rules.find((r) => r.validDate === args.date) ?? null;
  },
});

// Get predefined formula rules only
export const getPredefined = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_custom", (q) => q.eq("isCustom", false))
      .collect();
  },
});

// Get user custom formula rules
export const getUserCustom = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    // Return only custom rules without validDate (not day-specific)
    return rules.filter((r) => r.isCustom && !r.validDate);
  },
});

// Get day-specific formula rules
export const getDaySpecific = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect();

    return rules.filter((r) => r.validDate);
  },
});

// Clone a formula rule for a specific date
export const cloneForDate = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    sourceRuleId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    phases: v.string(), // JSON string
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);

    // Generate a unique rule ID
    const ruleId = `${args.babyId}_${args.date}_${now}`;

    await ctx.db.insert("easyFormulaRules", {
      ruleId,
      babyId: args.babyId,
      isCustom: true,
      minWeeks: 0,
      phases: args.phases,
      validDate: args.date,
      sourceRuleId: args.sourceRuleId,
      createdAt: now,
      updatedAt: now,
    });

    return ruleId;
  },
});

// Create a custom formula rule
export const create = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    minWeeks: v.number(),
    maxWeeks: v.optional(v.number()),
    labelKey: v.optional(v.string()),
    labelText: v.optional(v.string()),
    ageRangeKey: v.optional(v.string()),
    ageRangeText: v.optional(v.string()),
    description: v.optional(v.string()),
    phases: v.string(),
    validDate: v.optional(v.string()),
    sourceRuleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);

    // Generate a unique rule ID
    const ruleId = `custom_${args.babyId}_${now}`;

    await ctx.db.insert("easyFormulaRules", {
      ...args,
      ruleId,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    });

    return ruleId;
  },
});

// Update a custom formula rule
export const update = mutation({
  args: {
    ruleId: v.string(),
    babyId: v.id("babyProfiles"),
    minWeeks: v.optional(v.number()),
    maxWeeks: v.optional(v.number()),
    labelKey: v.optional(v.string()),
    labelText: v.optional(v.string()),
    ageRangeKey: v.optional(v.string()),
    ageRangeText: v.optional(v.string()),
    description: v.optional(v.string()),
    phases: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ruleId, babyId, ...updateFields } = args;

    const rule = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_rule_id", (q) => q.eq("ruleId", ruleId))
      .first();

    if (!rule) throw new Error("Rule not found");
    if (!rule.isCustom) throw new Error("Cannot update predefined rules");
    if (rule.babyId !== babyId) throw new Error("Unauthorized");

    // Remove undefined fields
    const fieldsToUpdate: Record<string, unknown> = {
      updatedAt: Math.floor(Date.now() / 1000),
    };
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    await ctx.db.patch(rule._id, fieldsToUpdate);
  },
});

// Delete a custom formula rule
export const remove = mutation({
  args: {
    ruleId: v.string(),
    babyId: v.id("babyProfiles"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_rule_id", (q) => q.eq("ruleId", args.ruleId))
      .first();

    if (!rule) throw new Error("Rule not found");
    if (!rule.isCustom) throw new Error("Cannot delete predefined rules");
    if (rule.babyId !== args.babyId) throw new Error("Unauthorized");

    await ctx.db.delete(rule._id);
  },
});

// Adjust phase timing for today (creates day-specific rule)
export const adjustPhaseTiming = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    itemOrder: v.number(),
    newStartTime: v.string(),
    newEndTime: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if there's already a day-specific rule for today
    const existingDayRule = await ctx.db
      .query("easyFormulaRules")
      .withIndex("by_baby", (q) => q.eq("babyId", args.babyId))
      .collect()
      .then((rules) => rules.find((r) => r.validDate === today));

    if (existingDayRule) {
      // Update the existing day-specific rule's phases
      const phases = JSON.parse(existingDayRule.phases);
      const phaseIndex = phases.findIndex(
        (p: { order: number }) => p.order === args.itemOrder
      );
      if (phaseIndex >= 0) {
        phases[phaseIndex].startTime = args.newStartTime;
        phases[phaseIndex].endTime = args.newEndTime;
        await ctx.db.patch(existingDayRule._id, {
          phases: JSON.stringify(phases),
          updatedAt: now,
        });
      }
    } else {
      // Get the baby's current rule to use as a base
      const baby = await ctx.db.get(args.babyId);
      if (!baby) throw new Error("Baby not found");

      // Get the current schedule (either selected formula or by age)
      let sourceRule = null;
      if (baby.selectedEasyFormulaId) {
        sourceRule = await ctx.db
          .query("easyFormulaRules")
          .withIndex("by_rule_id", (q) =>
            q.eq("ruleId", baby.selectedEasyFormulaId!)
          )
          .first();
      }

      if (!sourceRule) {
        // Fall back to predefined rules based on age
        const birthDate = new Date(baby.birthDate);
        const weeks = Math.floor(
          (Date.now() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        const allRules = await ctx.db.query("easyFormulaRules").collect();
        sourceRule = allRules.find(
          (r) =>
            !r.isCustom &&
            r.minWeeks <= weeks &&
            (r.maxWeeks === undefined || r.maxWeeks >= weeks)
        );
      }

      if (!sourceRule) throw new Error("No source rule found");

      // Create a day-specific copy with the adjustment
      const phases = JSON.parse(sourceRule.phases);
      const phaseIndex = phases.findIndex(
        (p: { order: number }) => p.order === args.itemOrder
      );
      if (phaseIndex >= 0) {
        phases[phaseIndex].startTime = args.newStartTime;
        phases[phaseIndex].endTime = args.newEndTime;
      }

      const ruleId = `day_${args.babyId}_${today}`;
      await ctx.db.insert("easyFormulaRules", {
        ruleId,
        babyId: args.babyId,
        isCustom: true,
        minWeeks: sourceRule.minWeeks,
        phases: JSON.stringify(phases),
        validDate: today,
        sourceRuleId: sourceRule.ruleId,
        createdAt: now,
        updatedAt: now,
      });

      return ruleId;
    }
  },
});

// Seed predefined formula rules
export const seedPredefined = mutation({
  args: {
    rules: v.array(
      v.object({
        ruleId: v.string(),
        minWeeks: v.number(),
        maxWeeks: v.optional(v.number()),
        labelKey: v.optional(v.string()),
        labelText: v.optional(v.string()),
        ageRangeKey: v.optional(v.string()),
        ageRangeText: v.optional(v.string()),
        description: v.optional(v.string()),
        phases: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);

    for (const rule of args.rules) {
      // Check if already exists
      const existing = await ctx.db
        .query("easyFormulaRules")
        .withIndex("by_rule_id", (q) => q.eq("ruleId", rule.ruleId))
        .first();

      if (!existing) {
        await ctx.db.insert("easyFormulaRules", {
          ...rule,
          isCustom: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

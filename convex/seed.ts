import { mutation, query } from "./_generated/server";

// ============================================
// HABIT DEFINITIONS SEED DATA
// ============================================

const habitDefinitions = [
  // Health category
  { definitionId: "tummy_time", category: "health", iconName: "Baby", labelKey: "habit.tummyTime.label", descriptionKey: "habit.tummyTime.description", minAgeMonths: 0, maxAgeMonths: 6, defaultFrequency: "daily", sortOrder: 1 },
  { definitionId: "brushing_teeth", category: "health", iconName: "Sparkles", labelKey: "habit.brushingTeeth.label", descriptionKey: "habit.brushingTeeth.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "twice_daily", sortOrder: 2 },
  { definitionId: "bath_time", category: "health", iconName: "Bath", labelKey: "habit.bathTime.label", descriptionKey: "habit.bathTime.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 3 },
  { definitionId: "hand_washing", category: "health", iconName: "HandMetal", labelKey: "habit.handWashing.label", descriptionKey: "habit.handWashing.description", minAgeMonths: 12, maxAgeMonths: undefined, defaultFrequency: "multiple_daily", sortOrder: 4 },
  { definitionId: "diaper_free_time", category: "health", iconName: "Sun", labelKey: "habit.diaperFreeTime.label", descriptionKey: "habit.diaperFreeTime.description", minAgeMonths: 0, maxAgeMonths: 24, defaultFrequency: "daily", sortOrder: 5 },
  { definitionId: "sunscreen", category: "health", iconName: "SunMedium", labelKey: "habit.sunscreen.label", descriptionKey: "habit.sunscreen.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 6 },

  // Learning category
  { definitionId: "reading_time", category: "learning", iconName: "BookOpen", labelKey: "habit.readingTime.label", descriptionKey: "habit.readingTime.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 1 },
  { definitionId: "singing_music", category: "learning", iconName: "Music", labelKey: "habit.singingMusic.label", descriptionKey: "habit.singingMusic.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 2 },
  { definitionId: "talking_conversation", category: "learning", iconName: "MessageCircle", labelKey: "habit.talkingConversation.label", descriptionKey: "habit.talkingConversation.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "multiple_daily", sortOrder: 3 },
  { definitionId: "peek_a_boo", category: "learning", iconName: "Eye", labelKey: "habit.peekABoo.label", descriptionKey: "habit.peekABoo.description", minAgeMonths: 3, maxAgeMonths: 18, defaultFrequency: "daily", sortOrder: 4 },
  { definitionId: "counting_practice", category: "learning", iconName: "Hash", labelKey: "habit.countingPractice.label", descriptionKey: "habit.countingPractice.description", minAgeMonths: 18, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 5 },
  { definitionId: "color_shape_learning", category: "learning", iconName: "Shapes", labelKey: "habit.colorShapeLearning.label", descriptionKey: "habit.colorShapeLearning.description", minAgeMonths: 18, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 6 },
  { definitionId: "puzzle_time", category: "learning", iconName: "Puzzle", labelKey: "habit.puzzleTime.label", descriptionKey: "habit.puzzleTime.description", minAgeMonths: 12, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 7 },
  { definitionId: "sensory_play", category: "learning", iconName: "Fingerprint", labelKey: "habit.sensoryPlay.label", descriptionKey: "habit.sensoryPlay.description", minAgeMonths: 3, maxAgeMonths: 36, defaultFrequency: "daily", sortOrder: 8 },

  // Physical category
  { definitionId: "outdoor_play", category: "physical", iconName: "TreePine", labelKey: "habit.outdoorPlay.label", descriptionKey: "habit.outdoorPlay.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 1 },
  { definitionId: "dance_movement", category: "physical", iconName: "Music2", labelKey: "habit.danceMovement.label", descriptionKey: "habit.danceMovement.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 2 },
  { definitionId: "ball_play", category: "physical", iconName: "Circle", labelKey: "habit.ballPlay.label", descriptionKey: "habit.ballPlay.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 3 },
  { definitionId: "walking_practice", category: "physical", iconName: "Footprints", labelKey: "habit.walkingPractice.label", descriptionKey: "habit.walkingPractice.description", minAgeMonths: 9, maxAgeMonths: 18, defaultFrequency: "daily", sortOrder: 4 },
  { definitionId: "stretching", category: "physical", iconName: "Stretch", labelKey: "habit.stretching.label", descriptionKey: "habit.stretching.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 5 },

  // Sleep category
  { definitionId: "bedtime_routine", category: "sleep", iconName: "Moon", labelKey: "habit.bedtimeRoutine.label", descriptionKey: "habit.bedtimeRoutine.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 1 },
  { definitionId: "wake_up_routine", category: "sleep", iconName: "Sunrise", labelKey: "habit.wakeUpRoutine.label", descriptionKey: "habit.wakeUpRoutine.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 2 },
  { definitionId: "nap_time", category: "sleep", iconName: "CloudMoon", labelKey: "habit.napTime.label", descriptionKey: "habit.napTime.description", minAgeMonths: 0, maxAgeMonths: 36, defaultFrequency: "daily", sortOrder: 3 },
  { definitionId: "wind_down_time", category: "sleep", iconName: "Clock", labelKey: "habit.windDownTime.label", descriptionKey: "habit.windDownTime.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 4 },

  // Social category
  { definitionId: "eye_contact", category: "social", iconName: "Eye", labelKey: "habit.eyeContact.label", descriptionKey: "habit.eyeContact.description", minAgeMonths: 0, maxAgeMonths: 12, defaultFrequency: "multiple_daily", sortOrder: 1 },
  { definitionId: "cuddling_bonding", category: "social", iconName: "Heart", labelKey: "habit.cuddlingBonding.label", descriptionKey: "habit.cuddlingBonding.description", minAgeMonths: 0, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 2 },
  { definitionId: "greeting_practice", category: "social", iconName: "Hand", labelKey: "habit.greetingPractice.label", descriptionKey: "habit.greetingPractice.description", minAgeMonths: 12, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 3 },
  { definitionId: "sharing_practice", category: "social", iconName: "Users", labelKey: "habit.sharingPractice.label", descriptionKey: "habit.sharingPractice.description", minAgeMonths: 18, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 4 },
  { definitionId: "thank_you_manners", category: "social", iconName: "ThumbsUp", labelKey: "habit.thankYouManners.label", descriptionKey: "habit.thankYouManners.description", minAgeMonths: 18, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 5 },
  { definitionId: "playdates", category: "social", iconName: "UsersRound", labelKey: "habit.playdates.label", descriptionKey: "habit.playdates.description", minAgeMonths: 12, maxAgeMonths: undefined, defaultFrequency: "weekly", sortOrder: 6 },

  // Nutrition category
  { definitionId: "water_drinking", category: "nutrition", iconName: "Droplets", labelKey: "habit.waterDrinking.label", descriptionKey: "habit.waterDrinking.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "multiple_daily", sortOrder: 1 },
  { definitionId: "vegetable_tasting", category: "nutrition", iconName: "Carrot", labelKey: "habit.vegetableTasting.label", descriptionKey: "habit.vegetableTasting.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 2 },
  { definitionId: "family_meals", category: "nutrition", iconName: "UtensilsCrossed", labelKey: "habit.familyMeals.label", descriptionKey: "habit.familyMeals.description", minAgeMonths: 6, maxAgeMonths: undefined, defaultFrequency: "daily", sortOrder: 3 },
  { definitionId: "self_feeding", category: "nutrition", iconName: "HandPlatter", labelKey: "habit.selfFeeding.label", descriptionKey: "habit.selfFeeding.description", minAgeMonths: 9, maxAgeMonths: 36, defaultFrequency: "daily", sortOrder: 4 },
];

// ============================================
// EASY FORMULA RULES SEED DATA
// ============================================

const easyFormulaRules = [
  {
    ruleId: "easy3",
    minWeeks: 0,
    maxWeeks: 6,
    labelKey: "easySchedule.formulas.easy3.label",
    ageRangeKey: "easySchedule.formulas.easy3.ageRange",
    description: "easySchedule.formulas.easy3.description",
    phases: '[{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":45},{"eatActivity":75,"sleep":720}]',
  },
  {
    ruleId: "easy3_5",
    minWeeks: 6,
    maxWeeks: 8,
    labelKey: "easySchedule.formulas.easy3_5.label",
    ageRangeKey: "easySchedule.formulas.easy3_5.ageRange",
    description: "easySchedule.formulas.easy3_5.description",
    phases: '[{"eat":30,"activity":60,"sleep":120},{"eat":30,"activity":60,"sleep":120},{"eat":30,"activity":60,"sleep":90},{"eat":30,"activity":30,"sleep":30},{"eatActivity":75,"sleep":720}]',
  },
  {
    ruleId: "easy4",
    minWeeks: 8,
    maxWeeks: 19,
    labelKey: "easySchedule.formulas.easy4.label",
    ageRangeKey: "easySchedule.formulas.easy4.ageRange",
    description: "easySchedule.formulas.easy4.description",
    phases: '[{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":30},{"eatActivity":90,"sleep":720}]',
  },
  {
    ruleId: "easy234",
    minWeeks: 19,
    maxWeeks: 46,
    labelKey: "easySchedule.formulas.easy234.label",
    ageRangeKey: "easySchedule.formulas.easy234.ageRange",
    description: "easySchedule.formulas.easy234.description",
    phases: '[{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":150,"sleep":60},{"eat":30,"activity":150,"sleep":0},{"eatActivity":30,"sleep":750}]',
  },
  {
    ruleId: "easy56",
    minWeeks: 46,
    maxWeeks: undefined,
    labelKey: "easySchedule.formulas.easy56.label",
    ageRangeKey: "easySchedule.formulas.easy56.ageRange",
    description: "easySchedule.formulas.easy56.description",
    phases: '[{"eat":30,"activity":210,"sleep":0},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":210,"sleep":0},{"eat":30,"activity":30,"sleep":720}]',
  },
];

// ============================================
// SEED MUTATIONS
// ============================================

// Check if seeding is needed
export const checkSeedStatus = query({
  args: {},
  handler: async (ctx) => {
    const habitCount = await ctx.db.query("habitDefinitions").collect();
    const formulaCount = await ctx.db.query("easyFormulaRules").collect();

    return {
      habitsCount: habitCount.length,
      formulasCount: formulaCount.length,
      needsHabits: habitCount.length === 0,
      needsFormulas: formulaCount.length === 0,
    };
  },
});

// Seed habit definitions
export const seedHabitDefinitions = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("habitDefinitions").first();
    if (existing) {
      console.log("Habit definitions already seeded, skipping...");
      return { skipped: true, count: 0 };
    }

    let count = 0;
    for (const habit of habitDefinitions) {
      await ctx.db.insert("habitDefinitions", {
        definitionId: habit.definitionId,
        category: habit.category,
        iconName: habit.iconName,
        labelKey: habit.labelKey,
        descriptionKey: habit.descriptionKey,
        minAgeMonths: habit.minAgeMonths,
        maxAgeMonths: habit.maxAgeMonths,
        defaultFrequency: habit.defaultFrequency,
        sortOrder: habit.sortOrder,
        isActive: true,
      });
      count++;
    }

    console.log(`Seeded ${count} habit definitions`);
    return { skipped: false, count };
  },
});

// Seed EASY formula rules
export const seedEasyFormulaRules = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("easyFormulaRules").first();
    if (existing) {
      console.log("EASY formula rules already seeded, skipping...");
      return { skipped: true, count: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    let count = 0;

    for (const rule of easyFormulaRules) {
      await ctx.db.insert("easyFormulaRules", {
        ruleId: rule.ruleId,
        babyId: undefined,
        isCustom: false,
        minWeeks: rule.minWeeks,
        maxWeeks: rule.maxWeeks,
        labelKey: rule.labelKey,
        ageRangeKey: rule.ageRangeKey,
        description: rule.description,
        phases: rule.phases,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    console.log(`Seeded ${count} EASY formula rules`);
    return { skipped: false, count };
  },
});

// Seed all data at once
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Math.floor(Date.now() / 1000);
    const results = {
      habits: { skipped: false, count: 0 },
      formulas: { skipped: false, count: 0 },
    };

    // Seed habit definitions
    const existingHabit = await ctx.db.query("habitDefinitions").first();
    if (!existingHabit) {
      for (const habit of habitDefinitions) {
        await ctx.db.insert("habitDefinitions", {
          definitionId: habit.definitionId,
          category: habit.category,
          iconName: habit.iconName,
          labelKey: habit.labelKey,
          descriptionKey: habit.descriptionKey,
          minAgeMonths: habit.minAgeMonths,
          maxAgeMonths: habit.maxAgeMonths,
          defaultFrequency: habit.defaultFrequency,
          sortOrder: habit.sortOrder,
          isActive: true,
        });
        results.habits.count++;
      }
    } else {
      results.habits.skipped = true;
    }

    // Seed EASY formula rules
    const existingFormula = await ctx.db.query("easyFormulaRules").first();
    if (!existingFormula) {
      for (const rule of easyFormulaRules) {
        await ctx.db.insert("easyFormulaRules", {
          ruleId: rule.ruleId,
          babyId: undefined,
          isCustom: false,
          minWeeks: rule.minWeeks,
          maxWeeks: rule.maxWeeks,
          labelKey: rule.labelKey,
          ageRangeKey: rule.ageRangeKey,
          description: rule.description,
          phases: rule.phases,
          createdAt: now,
          updatedAt: now,
        });
        results.formulas.count++;
      }
    } else {
      results.formulas.skipped = true;
    }

    console.log(`Seed results:`, results);
    return results;
  },
});

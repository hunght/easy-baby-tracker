import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,

  // Baby Profiles - central entity
  babyProfiles: defineTable({
    userId: v.string(), // User token identifier
    nickname: v.string(),
    gender: v.string(), // "boy" | "girl" | "unknown"
    birthDate: v.string(), // ISO date string YYYY-MM-DD
    dueDate: v.string(), // ISO date string YYYY-MM-DD
    avatarUri: v.optional(v.string()),
    firstWakeTime: v.string(), // "HH:MM" format
    selectedEasyFormulaId: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_user', ['userId'])
    .index('by_created', ['createdAt']),

  // Concern choices for baby profiles
  concernChoices: defineTable({
    babyId: v.id('babyProfiles'),
    concernId: v.string(),
  }).index('by_baby', ['babyId']),

  // App state (key-value store per user)
  appState: defineTable({
    userId: v.string(),
    key: v.string(),
    value: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_key', ['userId', 'key']),

  // Feedings
  feedings: defineTable({
    babyId: v.id('babyProfiles'),
    type: v.string(), // "breast" | "bottle" | "solids"
    startTime: v.number(), // Unix timestamp in seconds
    duration: v.optional(v.number()), // seconds
    leftDuration: v.optional(v.number()), // seconds
    rightDuration: v.optional(v.number()), // seconds
    ingredientType: v.optional(v.string()), // "breast_milk" | "formula" | "others"
    amountMl: v.optional(v.number()),
    ingredient: v.optional(v.string()),
    amountGrams: v.optional(v.number()),
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'startTime']),

  // Sleep Sessions
  sleepSessions: defineTable({
    babyId: v.id('babyProfiles'),
    kind: v.string(), // "nap" | "night" | etc.
    startTime: v.number(), // Unix timestamp in seconds
    endTime: v.optional(v.number()), // Unix timestamp in seconds
    duration: v.optional(v.number()), // seconds
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'startTime']),

  // Diaper Changes
  diaperChanges: defineTable({
    babyId: v.id('babyProfiles'),
    kind: v.string(), // "wet" | "dirty" | "mixed" | "dry"
    time: v.number(), // Unix timestamp in seconds
    wetness: v.optional(v.number()), // 1-5 scale
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'time']),

  // Pumpings
  pumpings: defineTable({
    babyId: v.id('babyProfiles'),
    startTime: v.number(), // Unix timestamp in seconds
    amountMl: v.number(),
    leftAmountMl: v.optional(v.number()),
    rightAmountMl: v.optional(v.number()),
    leftDuration: v.optional(v.number()), // seconds
    rightDuration: v.optional(v.number()), // seconds
    duration: v.optional(v.number()), // seconds
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'startTime']),

  // Growth Records
  growthRecords: defineTable({
    babyId: v.id('babyProfiles'),
    time: v.number(), // Unix timestamp in seconds
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    headCircumferenceCm: v.optional(v.number()),
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'time']),

  // Health Records
  healthRecords: defineTable({
    babyId: v.id('babyProfiles'),
    type: v.string(), // "temperature" | "medication" | "symptom" | etc.
    time: v.number(), // Unix timestamp in seconds
    temperature: v.optional(v.number()), // Celsius
    medicineType: v.optional(v.string()),
    medication: v.optional(v.string()),
    symptoms: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_time', ['babyId', 'time']),

  // Diary Entries
  diaryEntries: defineTable({
    babyId: v.id('babyProfiles'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    photoUri: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_created', ['babyId', 'createdAt']),

  // Habit Definitions (predefined templates)
  habitDefinitions: defineTable({
    definitionId: v.string(), // External ID for seeding/reference
    category: v.string(), // "health" | "learning" | "physical" | "sleep" | "social" | "nutrition"
    iconName: v.string(),
    labelKey: v.string(),
    descriptionKey: v.string(),
    minAgeMonths: v.optional(v.number()),
    maxAgeMonths: v.optional(v.number()),
    defaultFrequency: v.string(), // "daily" | "weekly" | etc.
    sortOrder: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index('by_definition_id', ['definitionId'])
    .index('by_active', ['isActive'])
    .index('by_category', ['category']),

  // Baby Habits (habits assigned to babies)
  babyHabits: defineTable({
    babyId: v.id('babyProfiles'),
    habitDefinitionId: v.id('habitDefinitions'),
    isActive: v.boolean(),
    targetFrequency: v.optional(v.string()),
    reminderTime: v.optional(v.string()), // "HH:MM" format
    reminderDays: v.optional(v.string()), // Comma-separated days
    createdAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_baby_active', ['babyId', 'isActive']),

  // Habit Logs
  habitLogs: defineTable({
    babyId: v.id('babyProfiles'),
    babyHabitId: v.id('babyHabits'),
    completedAt: v.number(), // Unix timestamp in seconds
    duration: v.optional(v.number()), // seconds
    notes: v.optional(v.string()),
    recordedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_habit', ['babyHabitId'])
    .index('by_baby_completed', ['babyId', 'completedAt']),

  // Scheduled Notifications
  scheduledNotifications: defineTable({
    babyId: v.id('babyProfiles'),
    notificationType: v.string(), // "feeding" | "pumping" | "sleep" | "diaper"
    notificationId: v.string(), // Expo notification ID
    scheduledTime: v.number(), // Unix timestamp in seconds
    data: v.optional(v.string()), // JSON string for additional data
    createdAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_baby', ['babyId'])
    .index('by_notification_id', ['notificationId']),

  // EASY Formula Rules
  easyFormulaRules: defineTable({
    ruleId: v.string(), // External ID for predefined rules
    babyId: v.optional(v.id('babyProfiles')), // null for predefined, set for custom
    isCustom: v.boolean(),
    minWeeks: v.number(),
    maxWeeks: v.optional(v.number()),
    labelKey: v.optional(v.string()),
    labelText: v.optional(v.string()),
    ageRangeKey: v.optional(v.string()),
    ageRangeText: v.optional(v.string()),
    description: v.optional(v.string()),
    phases: v.string(), // JSON string of EasyCyclePhase[]
    // For day-specific rules: pre-calculated schedule items with times
    scheduleItems: v.optional(v.string()), // JSON string of EasyScheduleItem[]
    validDate: v.optional(v.string()), // For day-specific rules: YYYY-MM-DD
    sourceRuleId: v.optional(v.string()), // Reference to original rule if cloned
    createdAt: v.number(), // Unix timestamp in seconds
    updatedAt: v.number(), // Unix timestamp in seconds
  })
    .index('by_rule_id', ['ruleId'])
    .index('by_baby', ['babyId'])
    .index('by_custom', ['isCustom']),
});

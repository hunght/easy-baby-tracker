import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const feedings = sqliteTable(
  'feedings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<'breast' | 'bottle' | 'solids'>(),
    // Start time (timestamp in seconds)
    startTime: integer('startTime', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // Duration in seconds (optional)
    duration: integer('duration', { mode: 'number' }),
    // Breast feeding specific: left and right side durations
    leftDuration: integer('leftDuration', { mode: 'number' }),
    rightDuration: integer('rightDuration', { mode: 'number' }),
    // Bottle feeding specific: ingredient type and amount
    ingredientType: text('ingredientType').$type<'breast_milk' | 'formula' | 'others'>(),
    amountMl: real('amountMl'),
    // Solids specific: ingredient name and amount
    ingredient: text('ingredient'),
    amountGrams: real('amountGrams'),
    // Common fields
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_feedings_baby_id').on(table.babyId),
    index('idx_feedings_recorded_at').on(table.recordedAt),
    index('idx_feedings_start_time').on(table.startTime),
  ]
);

export const sleepSessions = sqliteTable(
  'sleep_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().$type<'nap' | 'night'>(),
    // Start time (timestamp in seconds)
    startTime: integer('startTime', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // End time (timestamp in seconds, optional)
    endTime: integer('endTime', { mode: 'number' }),
    // Total duration in seconds (optional)
    duration: integer('duration', { mode: 'number' }),
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_sleep_sessions_baby_id').on(table.babyId),
    index('idx_sleep_sessions_recorded_at').on(table.recordedAt),
    index('idx_sleep_sessions_start_time').on(table.startTime),
  ]
);

export const diaryEntries = sqliteTable(
  'diary_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    title: text('title'),
    content: text('content'),
    photoUri: text('photoUri'),
    createdAt: integer('createdAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_diary_entries_baby_id').on(table.babyId),
    index('idx_diary_entries_created_at').on(table.createdAt),
  ]
);

export const diaperChanges = sqliteTable(
  'diaper_changes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().$type<'wet' | 'soiled' | 'mixed' | 'dry'>(),
    // Time of diaper change (timestamp in seconds)
    time: integer('time', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // Wetness level (1-3, optional)
    wetness: integer('wetness', { mode: 'number' }),
    // Color of poop (optional)
    color: text('color'),
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_diaper_changes_baby_id').on(table.babyId),
    index('idx_diaper_changes_recorded_at').on(table.recordedAt),
    index('idx_diaper_changes_time').on(table.time),
  ]
);

export const babyProfiles = sqliteTable('baby_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nickname: text('nickname').notNull(),
  gender: text('gender').notNull().$type<'unknown' | 'boy' | 'girl'>(),
  birthDate: text('birth_date').notNull(),
  dueDate: text('due_date').notNull(),
  firstWakeTime: text('first_wake_time').default('07:00').notNull(),
  selectedEasyFormulaId: text('selected_easy_formula_id'),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const concernChoices = sqliteTable(
  'concern_choices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    concernId: text('concern_id').notNull(),
  },
  (table) => [index('idx_concern_choices_baby_id').on(table.babyId)]
);

export const pumpings = sqliteTable(
  'pumpings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    // Start time (timestamp in seconds)
    startTime: integer('startTime', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // Total amount pumped in ml
    amountMl: real('amountMl').notNull(),
    // Left and right side amounts
    leftAmountMl: real('leftAmountMl'),
    rightAmountMl: real('rightAmountMl'),
    // Left and right side durations in seconds
    leftDuration: integer('leftDuration', { mode: 'number' }),
    rightDuration: integer('rightDuration', { mode: 'number' }),
    // Total duration in seconds (optional)
    duration: integer('duration', { mode: 'number' }),
    // Common fields
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_pumpings_baby_id').on(table.babyId),
    index('idx_pumpings_recorded_at').on(table.recordedAt),
    index('idx_pumpings_start_time').on(table.startTime),
  ]
);

export const healthRecords = sqliteTable(
  'health_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<'temperature' | 'medicine' | 'symptoms'>(),
    // Time of the health record (timestamp in seconds)
    time: integer('time', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // Temperature specific: temperature in Celsius
    temperature: real('temperature'),
    // Medicine specific: medicine type and name
    medicineType: text('medicineType').$type<'medication' | 'vaccine'>(),
    medication: text('medication'),
    // Symptoms specific: symptoms description
    symptoms: text('symptoms'),
    // Common fields
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_health_records_baby_id').on(table.babyId),
    index('idx_health_records_recorded_at').on(table.recordedAt),
    index('idx_health_records_time').on(table.time),
    index('idx_health_records_type').on(table.type),
  ]
);

export const growthRecords = sqliteTable(
  'growth_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    // Time of the growth measurement (timestamp in seconds)
    time: integer('time', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    // Weight in kg
    weightKg: real('weightKg'),
    // Height in cm
    heightCm: real('heightCm'),
    // Head circumference in cm
    headCircumferenceCm: real('headCircumferenceCm'),
    // Common fields
    notes: text('notes'),
    recordedAt: integer('recordedAt', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_growth_records_baby_id').on(table.babyId),
    index('idx_growth_records_recorded_at').on(table.recordedAt),
    index('idx_growth_records_time').on(table.time),
  ]
);

export const appState = sqliteTable('app_state', {
  key: text('key').primaryKey().notNull(),
  value: text('value'),
});

export const scheduledNotifications = sqliteTable(
  'scheduled_notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    // Notification type (e.g., 'feeding', 'pumping', etc.)
    notificationType: text('notification_type')
      .notNull()
      .$type<'feeding' | 'pumping' | 'sleep' | 'diaper'>(),
    // OS notification identifier
    notificationId: text('notification_id').notNull(),
    // Scheduled time (timestamp in seconds)
    scheduledTime: integer('scheduled_time', { mode: 'number' }).notNull(),
    // Additional data stored as JSON (e.g., feedingType for feeding notifications)
    data: text('data'),
    // Created timestamp
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_scheduled_notifications_baby_id').on(table.babyId),
    index('idx_scheduled_notifications_type').on(table.notificationType),
    index('idx_scheduled_notifications_notification_id').on(table.notificationId),
    index('idx_scheduled_notifications_scheduled_time').on(table.scheduledTime),
  ]
);

export const easyFormulaRules = sqliteTable(
  'easy_formula_rules',
  {
    id: text('id').primaryKey().notNull(), // 'newborn', 'fourToSixMonths', etc. or 'custom_<babyId>_<timestamp>'
    babyId: integer('baby_id').references(() => babyProfiles.id, { onDelete: 'cascade' }), // NULL for predefined, set for user-created
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    minWeeks: integer('min_weeks').notNull(),
    maxWeeks: integer('max_weeks'), // NULL for open-ended (toddler+)

    // Translation keys for predefined, or direct text for custom
    labelKey: text('label_key'),
    labelText: text('label_text'),
    ageRangeKey: text('age_range_key'),
    ageRangeText: text('age_range_text'),
    cycleKey: text('cycle_key'),
    cycleText: text('cycle_text'),
    eatKey: text('eat_key'),
    eatText: text('eat_text'),
    activityKey: text('activity_key'),
    activityText: text('activity_text'),
    sleepKey: text('sleep_key'),
    sleepText: text('sleep_text'),
    yourTimeKey: text('your_time_key'),
    yourTimeText: text('your_time_text'),
    logicKeys: text('logic_keys'), // JSON array of translation keys
    logicTexts: text('logic_texts'), // JSON array of text strings

    // Schedule parameters
    cycleLengthMinutes: integer('cycle_length_minutes'),
    activityRangeMin: integer('activity_range_min').notNull(),
    activityRangeMax: integer('activity_range_max').notNull(),
    feedDurationMinutes: integer('feed_duration_minutes').notNull(),
    napDurationsMinutes: text('nap_durations_minutes').notNull(), // JSON array [120, 120, 90]
    thirdNapDropWakeThreshold: integer('third_nap_drop_wake_threshold'),
    morningNapCapMinutes: integer('morning_nap_cap_minutes'),
    afternoonActivityRangeMin: integer('afternoon_activity_range_min'),
    afternoonActivityRangeMax: integer('afternoon_activity_range_max'),
    nightSleepMinutes: integer('night_sleep_minutes'),
    bedtimeRoutineMinutes: integer('bedtime_routine_minutes'),

    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer('updated_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_formula_rules_baby_id').on(table.babyId),
    index('idx_formula_rules_custom').on(table.isCustom),
    index('idx_formula_rules_weeks').on(table.minWeeks, table.maxWeeks),
  ]
);

export const easyScheduleAdjustments = sqliteTable(
  'easy_schedule_adjustments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    babyId: integer('baby_id')
      .notNull()
      .references(() => babyProfiles.id, { onDelete: 'cascade' }),
    // Date for which this adjustment applies (YYYY-MM-DD format)
    adjustmentDate: text('adjustment_date').notNull(),
    // Schedule item order (position in the schedule)
    itemOrder: integer('item_order').notNull(),
    // Adjusted start time (HH:mm format)
    startTime: text('start_time').notNull(),
    // Adjusted end time (HH:mm format)
    endTime: text('end_time').notNull(),
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('idx_schedule_adjustments_baby_id').on(table.babyId),
    index('idx_schedule_adjustments_date').on(table.adjustmentDate),
    index('idx_schedule_adjustments_baby_date').on(table.babyId, table.adjustmentDate),
  ]
);

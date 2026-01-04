import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// General app state (key-value store)
export const appState = sqliteTable('app_state', {
  key: text('key').primaryKey().notNull(),
  value: text('value'),
});

// User profile (for future multi-user support)
export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('Player'),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  settings: text('settings'), // JSON: { dailyGoal, preferredDifficulty, soundEnabled }
});

// Word dictionary (imported from Wiktionary)
export const words = sqliteTable(
  'words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull().unique(),
    definition: text('definition').notNull(),
    partOfSpeech: text('part_of_speech'), // noun, verb, adjective, etc.
    pronunciation: text('pronunciation'), // IPA notation
    audioUrl: text('audio_url'), // URL or local path to audio file
    etymology: text('etymology'),
    exampleSentence: text('example_sentence'),
    difficulty: integer('difficulty').notNull().default(1000), // Elo-style rating (1000 = average)
    language: text('language').notNull().default('en'),
    syllableCount: integer('syllable_count'),
    importedAt: integer('imported_at')
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('words_word_idx').on(table.word),
    index('words_difficulty_idx').on(table.difficulty),
  ]
);

// Word categories/tags (many-to-many)
export const wordCategories = sqliteTable('word_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // e.g., "Science", "History", "SAT", "GRE"
  description: text('description'),
});

export const wordCategoryMapping = sqliteTable(
  'word_category_mapping',
  {
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => wordCategories.id, { onDelete: 'cascade' }),
  },
  (table) => [unique('word_category_unique').on(table.wordId, table.categoryId)]
);

// FSRS State enum values
export const FSRSState = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
} as const;

// FSRS card state - tracks learning progress per word
export const cardProgress = sqliteTable(
  'card_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => userProfile.id, { onDelete: 'cascade' }),
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),

    // FSRS-4.5 core parameters
    stability: real('stability').notNull().default(0), // Memory stability (days)
    difficulty: real('difficulty').notNull().default(0.3), // Item difficulty (0-1)
    elapsedDays: real('elapsed_days').notNull().default(0), // Days since last review
    scheduledDays: real('scheduled_days').notNull().default(0), // Days until next review
    reps: integer('reps').notNull().default(0), // Number of reviews
    lapses: integer('lapses').notNull().default(0), // Number of times forgotten
    state: integer('state').notNull().default(0), // 0=New, 1=Learning, 2=Review, 3=Relearning

    // Scheduling
    dueDate: integer('due_date').notNull(), // Unix seconds - when card is due
    lastReviewedAt: integer('last_reviewed_at'), // Unix seconds

    // Statistics
    totalAttempts: integer('total_attempts').notNull().default(0),
    correctAttempts: integer('correct_attempts').notNull().default(0),
    averageLevenshtein: real('average_levenshtein').default(0), // Average error rate

    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    unique('card_progress_user_word_unique').on(table.userId, table.wordId),
    index('card_progress_due_date_idx').on(table.dueDate),
    index('card_progress_state_idx').on(table.state),
    index('card_progress_user_id_idx').on(table.userId),
  ]
);

// Quiz sessions - tracks individual study sessions
export const quizSessions = sqliteTable(
  'quiz_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => userProfile.id, { onDelete: 'cascade' }),
    startedAt: integer('started_at')
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
    endedAt: integer('ended_at'), // Unix seconds
    wordsAttempted: integer('words_attempted').notNull().default(0),
    wordsCorrect: integer('words_correct').notNull().default(0),
    sessionType: text('session_type').notNull().default('practice'), // practice, daily, category
    categoryId: integer('category_id').references(() => wordCategories.id),
  },
  (table) => [index('quiz_sessions_user_id_idx').on(table.userId)]
);

// Individual quiz attempts - detailed logs
export const quizAttempts = sqliteTable(
  'quiz_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    cardProgressId: integer('card_progress_id')
      .notNull()
      .references(() => cardProgress.id),
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id),

    userInput: text('user_input').notNull(),
    isCorrect: integer('is_correct').notNull(), // 0 or 1
    levenshteinDistance: integer('levenshtein_distance').notNull(),
    normalizedError: real('normalized_error').notNull(), // levenshtein / word.length

    // FSRS rating derived from Levenshtein
    fsrsRating: integer('fsrs_rating').notNull(), // 1=Again, 2=Hard, 3=Good, 4=Easy

    // Timing
    responseTimeMs: integer('response_time_ms'),
    attemptedAt: integer('attempted_at')
      .notNull()
      .$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => [
    index('quiz_attempts_session_idx').on(table.sessionId),
    index('quiz_attempts_card_progress_idx').on(table.cardProgressId),
  ]
);

// User stats and gamification
export const userStats = sqliteTable('user_stats', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => userProfile.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastPracticeDate: integer('last_practice_date'), // Unix seconds (date only, midnight UTC)
  totalWordsLearned: integer('total_words_learned').notNull().default(0),
  totalQuizzes: integer('total_quizzes').notNull().default(0),
  totalCorrect: integer('total_correct').notNull().default(0),
  totalAttempts: integer('total_attempts').notNull().default(0),
  xpPoints: integer('xp_points').notNull().default(0),
  level: integer('level').notNull().default(1),
});

// Daily goals tracking
export const dailyProgress = sqliteTable(
  'daily_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => userProfile.id, { onDelete: 'cascade' }),
    date: integer('date').notNull(), // Unix seconds (midnight UTC)
    wordsReviewed: integer('words_reviewed').notNull().default(0),
    wordsLearned: integer('words_learned').notNull().default(0),
    minutesPracticed: integer('minutes_practiced').notNull().default(0),
    goalMet: integer('goal_met').notNull().default(0), // 0 or 1
  },
  (table) => [
    unique('daily_progress_user_date_unique').on(table.userId, table.date),
    index('daily_progress_date_idx').on(table.date),
  ]
);

// Type exports using Drizzle's $inferSelect and $inferInsert
export type AppState = typeof appState.$inferSelect;
export type InsertAppState = typeof appState.$inferInsert;

export type UserProfile = typeof userProfile.$inferSelect;
export type InsertUserProfile = typeof userProfile.$inferInsert;

export type Word = typeof words.$inferSelect;
export type InsertWord = typeof words.$inferInsert;

export type WordCategory = typeof wordCategories.$inferSelect;
export type InsertWordCategory = typeof wordCategories.$inferInsert;

export type CardProgress = typeof cardProgress.$inferSelect;
export type InsertCardProgress = typeof cardProgress.$inferInsert;

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = typeof dailyProgress.$inferInsert;

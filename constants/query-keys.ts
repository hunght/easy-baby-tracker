// Words
export const WORDS_QUERY_KEY = ['words'] as const;
export const WORD_COUNT_QUERY_KEY = ['wordCount'] as const;
export const wordByIdKey = (id: number) => ['words', id] as const;
export const wordByTextKey = (word: string) => ['words', 'text', word] as const;
export const wordSearchKey = (query: string) => ['words', 'search', query] as const;
export const wordsByCategoryKey = (categoryId: number) => ['words', 'category', categoryId] as const;
export const wordsByDifficultyKey = (min: number, max: number) =>
  ['words', 'difficulty', min, max] as const;

// Word Categories
export const CATEGORIES_QUERY_KEY = ['categories'] as const;
export const categoryByIdKey = (id: number) => ['categories', id] as const;

// Card Progress (FSRS state)
export const DUE_CARDS_QUERY_KEY = ['dueCards'] as const;
export const NEW_CARDS_QUERY_KEY = ['newCards'] as const;
export const cardProgressKey = (userId: number, wordId: number) =>
  ['cardProgress', userId, wordId] as const;
export const cardsByStateKey = (userId: number, state: number) =>
  ['cardProgress', 'state', userId, state] as const;

// Quiz Sessions
export const ACTIVE_SESSION_QUERY_KEY = ['activeSession'] as const;
export const RECENT_SESSIONS_QUERY_KEY = ['recentSessions'] as const;
export const sessionByIdKey = (sessionId: number) => ['session', sessionId] as const;
export const sessionAttemptsKey = (sessionId: number) => ['sessionAttempts', sessionId] as const;

// Word Attempt History
export const wordAttemptHistoryKey = (userId: number, wordId: number) =>
  ['wordAttemptHistory', userId, wordId] as const;

// User Stats
export const USER_STATS_QUERY_KEY = ['userStats'] as const;
export const STREAK_QUERY_KEY = ['streak'] as const;

// Daily Progress
export const DAILY_PROGRESS_QUERY_KEY = ['dailyProgress'] as const;
export const dailyProgressByDateKey = (userId: number, date: number) =>
  ['dailyProgress', userId, date] as const;

// User Profile
export const USER_PROFILE_QUERY_KEY = ['userProfile'] as const;
export const ACTIVE_USER_PROFILE_QUERY_KEY = ['activeUserProfile'] as const;

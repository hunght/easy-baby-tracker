import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from './db';
import * as schema from '@/db/schema';
import type { DailyProgress, InsertDailyProgress, UserStats } from '@/db/schema';

// XP constants
const XP_PER_CORRECT = 10;
const XP_PER_WORD_LEARNED = 50;
const XP_PER_STREAK_DAY = 20;
const XP_PER_GOAL_MET = 100;

// Level calculation (exponential scaling)
function calculateLevel(xp: number): number {
  // Level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0-99 XP
  // Level 2: 100-399 XP
  // Level 3: 400-899 XP
  // etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function xpForLevel(level: number): number {
  // XP needed to reach a level
  return 100 * Math.pow(level - 1, 2);
}

/**
 * Get the start of today in Unix seconds (midnight UTC)
 */
function getTodayStart(): number {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return Math.floor(now.getTime() / 1000);
}

/**
 * Get user stats
 */
export async function getUserStats(userId: number): Promise<UserStats | null> {
  const results = await db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, userId))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get or create user stats
 */
export async function getOrCreateUserStats(userId: number): Promise<UserStats> {
  const existing = await getUserStats(userId);
  if (existing) return existing;

  const result = await db
    .insert(schema.userStats)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      totalWordsLearned: 0,
      totalQuizzes: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      xpPoints: 0,
      level: 1,
    })
    .returning();

  return result[0];
}

/**
 * Add XP and update level
 */
export async function addXP(userId: number, points: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);
  const newXP = stats.xpPoints + points;
  const newLevel = calculateLevel(newXP);

  const result = await db
    .update(schema.userStats)
    .set({
      xpPoints: newXP,
      level: newLevel,
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Update streak based on practice
 */
export async function updateStreak(userId: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);
  const today = getTodayStart();
  const yesterday = today - 86400; // 24 hours ago

  let newStreak = stats.currentStreak;
  let newLongest = stats.longestStreak;

  if (stats.lastPracticeDate === null) {
    // First practice ever
    newStreak = 1;
  } else if (stats.lastPracticeDate === today) {
    // Already practiced today, no change
    return stats;
  } else if (stats.lastPracticeDate === yesterday) {
    // Consecutive day
    newStreak = stats.currentStreak + 1;
  } else if (stats.lastPracticeDate < yesterday) {
    // Streak broken
    newStreak = 1;
  }

  // Update longest streak if current exceeds it
  if (newStreak > newLongest) {
    newLongest = newStreak;
  }

  // Add streak XP
  const xpGained = XP_PER_STREAK_DAY * (newStreak > stats.currentStreak ? 1 : 0);

  const result = await db
    .update(schema.userStats)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastPracticeDate: today,
      xpPoints: stats.xpPoints + xpGained,
      level: calculateLevel(stats.xpPoints + xpGained),
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Record a correct answer
 */
export async function recordCorrectAnswer(userId: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);

  const result = await db
    .update(schema.userStats)
    .set({
      totalCorrect: stats.totalCorrect + 1,
      totalAttempts: stats.totalAttempts + 1,
      xpPoints: stats.xpPoints + XP_PER_CORRECT,
      level: calculateLevel(stats.xpPoints + XP_PER_CORRECT),
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Record an incorrect answer
 */
export async function recordIncorrectAnswer(userId: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);

  const result = await db
    .update(schema.userStats)
    .set({
      totalAttempts: stats.totalAttempts + 1,
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Record a newly learned word
 */
export async function recordWordLearned(userId: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);

  const result = await db
    .update(schema.userStats)
    .set({
      totalWordsLearned: stats.totalWordsLearned + 1,
      xpPoints: stats.xpPoints + XP_PER_WORD_LEARNED,
      level: calculateLevel(stats.xpPoints + XP_PER_WORD_LEARNED),
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Increment quiz count
 */
export async function incrementQuizCount(userId: number): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);

  const result = await db
    .update(schema.userStats)
    .set({
      totalQuizzes: stats.totalQuizzes + 1,
    })
    .where(eq(schema.userStats.userId, userId))
    .returning();

  return result[0];
}

/**
 * Get accuracy percentage
 */
export function calculateAccuracy(stats: UserStats): number {
  if (stats.totalAttempts === 0) return 0;
  return Math.round((stats.totalCorrect / stats.totalAttempts) * 100);
}

/**
 * Get XP progress to next level
 */
export function getXPProgress(stats: UserStats): { current: number; needed: number; percentage: number } {
  const currentLevelXP = xpForLevel(stats.level);
  const nextLevelXP = xpForLevel(stats.level + 1);
  const xpInCurrentLevel = stats.xpPoints - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return {
    current: xpInCurrentLevel,
    needed: xpNeededForNext,
    percentage: Math.round((xpInCurrentLevel / xpNeededForNext) * 100),
  };
}

// ============ Daily Progress ============

/**
 * Get daily progress for a specific date
 */
export async function getDailyProgress(
  userId: number,
  date?: number
): Promise<DailyProgress | null> {
  const targetDate = date ?? getTodayStart();

  const results = await db
    .select()
    .from(schema.dailyProgress)
    .where(
      and(
        eq(schema.dailyProgress.userId, userId),
        eq(schema.dailyProgress.date, targetDate)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get or create daily progress for today
 */
export async function getOrCreateTodayProgress(userId: number): Promise<DailyProgress> {
  const today = getTodayStart();
  const existing = await getDailyProgress(userId, today);
  if (existing) return existing;

  const result = await db
    .insert(schema.dailyProgress)
    .values({
      userId,
      date: today,
      wordsReviewed: 0,
      wordsLearned: 0,
      minutesPracticed: 0,
      goalMet: 0,
    })
    .returning();

  return result[0];
}

/**
 * Update daily progress
 */
export async function updateDailyProgress(
  userId: number,
  update: Partial<Pick<DailyProgress, 'wordsReviewed' | 'wordsLearned' | 'minutesPracticed'>>
): Promise<DailyProgress> {
  const progress = await getOrCreateTodayProgress(userId);

  const newReviewed = progress.wordsReviewed + (update.wordsReviewed ?? 0);
  const newLearned = progress.wordsLearned + (update.wordsLearned ?? 0);
  const newMinutes = progress.minutesPracticed + (update.minutesPracticed ?? 0);

  const result = await db
    .update(schema.dailyProgress)
    .set({
      wordsReviewed: newReviewed,
      wordsLearned: newLearned,
      minutesPracticed: newMinutes,
    })
    .where(eq(schema.dailyProgress.id, progress.id))
    .returning();

  return result[0];
}

/**
 * Check and mark daily goal as met
 */
export async function checkAndMarkGoalMet(
  userId: number,
  dailyGoal: number
): Promise<boolean> {
  const progress = await getOrCreateTodayProgress(userId);

  // Goal is met if words reviewed >= daily goal
  const goalMet = progress.wordsReviewed >= dailyGoal;

  if (goalMet && progress.goalMet === 0) {
    // First time meeting goal today
    await db
      .update(schema.dailyProgress)
      .set({ goalMet: 1 })
      .where(eq(schema.dailyProgress.id, progress.id));

    // Award XP for meeting goal
    await addXP(userId, XP_PER_GOAL_MET);

    return true;
  }

  return goalMet;
}

/**
 * Get weekly progress (last 7 days)
 */
export async function getWeeklyProgress(userId: number): Promise<DailyProgress[]> {
  const today = getTodayStart();
  const weekAgo = today - 6 * 86400; // 6 days ago (7 days total including today)

  return db
    .select()
    .from(schema.dailyProgress)
    .where(
      and(
        eq(schema.dailyProgress.userId, userId),
        gte(schema.dailyProgress.date, weekAgo)
      )
    )
    .orderBy(schema.dailyProgress.date);
}

/**
 * Get streak information
 */
export async function getStreakInfo(userId: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: number | null;
  isStreakActive: boolean;
}> {
  const stats = await getOrCreateUserStats(userId);
  const today = getTodayStart();
  const yesterday = today - 86400;

  // Streak is active if practiced today or yesterday
  const isStreakActive =
    stats.lastPracticeDate === today || stats.lastPracticeDate === yesterday;

  return {
    currentStreak: isStreakActive ? stats.currentStreak : 0,
    longestStreak: stats.longestStreak,
    lastPracticeDate: stats.lastPracticeDate,
    isStreakActive,
  };
}

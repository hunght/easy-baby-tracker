import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from './db';
import * as schema from '@/db/schema';
import type { InsertQuizAttempt, QuizAttempt, QuizSession, Word } from '@/db/schema';

// Quiz attempt with associated word
export interface QuizAttemptWithWord extends QuizAttempt {
  word: Word;
}

// Session statistics
export interface SessionStats {
  wordsAttempted: number;
  wordsCorrect: number;
  accuracy: number;
  totalResponseTimeMs: number;
  averageResponseTimeMs: number;
}

/**
 * Create a new quiz session
 */
export async function createQuizSession(
  userId: number,
  sessionType: 'practice' | 'daily' | 'category' = 'practice',
  categoryId?: number
): Promise<QuizSession> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .insert(schema.quizSessions)
    .values({
      userId,
      startedAt: now,
      sessionType,
      categoryId,
      wordsAttempted: 0,
      wordsCorrect: 0,
    })
    .returning();

  return result[0];
}

/**
 * Get a quiz session by ID
 */
export async function getQuizSession(sessionId: number): Promise<QuizSession | null> {
  const results = await db
    .select()
    .from(schema.quizSessions)
    .where(eq(schema.quizSessions.id, sessionId))
    .limit(1);

  return results[0] ?? null;
}

/**
 * End a quiz session and update statistics
 */
export async function endQuizSession(
  sessionId: number,
  stats: SessionStats
): Promise<QuizSession> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .update(schema.quizSessions)
    .set({
      endedAt: now,
      wordsAttempted: stats.wordsAttempted,
      wordsCorrect: stats.wordsCorrect,
    })
    .where(eq(schema.quizSessions.id, sessionId))
    .returning();

  return result[0];
}

/**
 * Record a quiz attempt
 */
export async function recordQuizAttempt(
  attempt: Omit<InsertQuizAttempt, 'attemptedAt'>
): Promise<QuizAttempt> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .insert(schema.quizAttempts)
    .values({
      ...attempt,
      attemptedAt: now,
    })
    .returning();

  // Update session counts
  await db
    .update(schema.quizSessions)
    .set({
      wordsAttempted: sql`${schema.quizSessions.wordsAttempted} + 1`,
      wordsCorrect: attempt.isCorrect
        ? sql`${schema.quizSessions.wordsCorrect} + 1`
        : schema.quizSessions.wordsCorrect,
    })
    .where(eq(schema.quizSessions.id, attempt.sessionId));

  return result[0];
}

/**
 * Get all attempts for a session
 */
export async function getSessionAttempts(
  sessionId: number
): Promise<QuizAttemptWithWord[]> {
  return db
    .select({
      id: schema.quizAttempts.id,
      sessionId: schema.quizAttempts.sessionId,
      cardProgressId: schema.quizAttempts.cardProgressId,
      wordId: schema.quizAttempts.wordId,
      userInput: schema.quizAttempts.userInput,
      isCorrect: schema.quizAttempts.isCorrect,
      levenshteinDistance: schema.quizAttempts.levenshteinDistance,
      normalizedError: schema.quizAttempts.normalizedError,
      fsrsRating: schema.quizAttempts.fsrsRating,
      responseTimeMs: schema.quizAttempts.responseTimeMs,
      attemptedAt: schema.quizAttempts.attemptedAt,
      word: {
        id: schema.words.id,
        word: schema.words.word,
        definition: schema.words.definition,
        partOfSpeech: schema.words.partOfSpeech,
        pronunciation: schema.words.pronunciation,
        audioUrl: schema.words.audioUrl,
        etymology: schema.words.etymology,
        exampleSentence: schema.words.exampleSentence,
        difficulty: schema.words.difficulty,
        language: schema.words.language,
        syllableCount: schema.words.syllableCount,
        importedAt: schema.words.importedAt,
      },
    })
    .from(schema.quizAttempts)
    .innerJoin(schema.words, eq(schema.quizAttempts.wordId, schema.words.id))
    .where(eq(schema.quizAttempts.sessionId, sessionId))
    .orderBy(schema.quizAttempts.attemptedAt);
}

/**
 * Get recent sessions for a user
 */
export async function getRecentSessions(
  userId: number,
  limit: number = 10
): Promise<QuizSession[]> {
  return db
    .select()
    .from(schema.quizSessions)
    .where(eq(schema.quizSessions.userId, userId))
    .orderBy(desc(schema.quizSessions.startedAt))
    .limit(limit);
}

/**
 * Get word attempt history for a specific word
 */
export async function getWordAttemptHistory(
  userId: number,
  wordId: number,
  limit: number = 20
): Promise<QuizAttempt[]> {
  return db
    .select({
      id: schema.quizAttempts.id,
      sessionId: schema.quizAttempts.sessionId,
      cardProgressId: schema.quizAttempts.cardProgressId,
      wordId: schema.quizAttempts.wordId,
      userInput: schema.quizAttempts.userInput,
      isCorrect: schema.quizAttempts.isCorrect,
      levenshteinDistance: schema.quizAttempts.levenshteinDistance,
      normalizedError: schema.quizAttempts.normalizedError,
      fsrsRating: schema.quizAttempts.fsrsRating,
      responseTimeMs: schema.quizAttempts.responseTimeMs,
      attemptedAt: schema.quizAttempts.attemptedAt,
    })
    .from(schema.quizAttempts)
    .innerJoin(
      schema.quizSessions,
      eq(schema.quizAttempts.sessionId, schema.quizSessions.id)
    )
    .where(
      and(
        eq(schema.quizSessions.userId, userId),
        eq(schema.quizAttempts.wordId, wordId)
      )
    )
    .orderBy(desc(schema.quizAttempts.attemptedAt))
    .limit(limit);
}

/**
 * Calculate session statistics from attempts
 */
export async function calculateSessionStats(sessionId: number): Promise<SessionStats> {
  const attempts = await getSessionAttempts(sessionId);

  const wordsAttempted = attempts.length;
  const wordsCorrect = attempts.filter((a) => a.isCorrect === 1).length;
  const accuracy = wordsAttempted > 0 ? Math.round((wordsCorrect / wordsAttempted) * 100) : 0;

  const totalResponseTimeMs = attempts.reduce(
    (sum, a) => sum + (a.responseTimeMs ?? 0),
    0
  );
  const averageResponseTimeMs =
    wordsAttempted > 0 ? Math.round(totalResponseTimeMs / wordsAttempted) : 0;

  return {
    wordsAttempted,
    wordsCorrect,
    accuracy,
    totalResponseTimeMs,
    averageResponseTimeMs,
  };
}

/**
 * Get total sessions count for a user
 */
export async function getSessionCount(userId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.quizSessions)
    .where(eq(schema.quizSessions.userId, userId));

  return result[0]?.count ?? 0;
}

/**
 * Delete a quiz session and its attempts
 */
export async function deleteQuizSession(sessionId: number): Promise<void> {
  // Quiz attempts will be cascade deleted due to foreign key
  await db.delete(schema.quizSessions).where(eq(schema.quizSessions.id, sessionId));
}

/**
 * Get incomplete/active sessions (started but not ended)
 */
export async function getActiveSessions(userId: number): Promise<QuizSession[]> {
  return db
    .select()
    .from(schema.quizSessions)
    .where(
      and(
        eq(schema.quizSessions.userId, userId),
        sql`${schema.quizSessions.endedAt} IS NULL`
      )
    )
    .orderBy(desc(schema.quizSessions.startedAt));
}

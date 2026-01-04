import { and, eq, gte, lte, sql, isNull, not, desc } from 'drizzle-orm';

import { db } from './db';
import * as schema from '@/db/schema';
import { FSRSState } from '@/db/schema';
import type { CardProgress, InsertCardProgress, Word } from '@/db/schema';
import { createNewCard, scheduleCard, type RatingType } from '@/lib/fsrs';

// Card with associated word information
export interface CardProgressWithWord extends CardProgress {
  word: Word;
}

/**
 * Get card progress for a specific user and word
 */
export async function getCardProgress(
  userId: number,
  wordId: number
): Promise<CardProgress | null> {
  const results = await db
    .select()
    .from(schema.cardProgress)
    .where(
      and(
        eq(schema.cardProgress.userId, userId),
        eq(schema.cardProgress.wordId, wordId)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get cards that are due for review
 */
export async function getDueCards(
  userId: number,
  limit: number = 20
): Promise<CardProgressWithWord[]> {
  const now = Math.floor(Date.now() / 1000);

  return db
    .select({
      id: schema.cardProgress.id,
      userId: schema.cardProgress.userId,
      wordId: schema.cardProgress.wordId,
      stability: schema.cardProgress.stability,
      difficulty: schema.cardProgress.difficulty,
      elapsedDays: schema.cardProgress.elapsedDays,
      scheduledDays: schema.cardProgress.scheduledDays,
      reps: schema.cardProgress.reps,
      lapses: schema.cardProgress.lapses,
      state: schema.cardProgress.state,
      dueDate: schema.cardProgress.dueDate,
      lastReviewedAt: schema.cardProgress.lastReviewedAt,
      totalAttempts: schema.cardProgress.totalAttempts,
      correctAttempts: schema.cardProgress.correctAttempts,
      averageLevenshtein: schema.cardProgress.averageLevenshtein,
      createdAt: schema.cardProgress.createdAt,
      updatedAt: schema.cardProgress.updatedAt,
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
    .from(schema.cardProgress)
    .innerJoin(schema.words, eq(schema.cardProgress.wordId, schema.words.id))
    .where(
      and(
        eq(schema.cardProgress.userId, userId),
        lte(schema.cardProgress.dueDate, now),
        not(eq(schema.cardProgress.state, FSRSState.New))
      )
    )
    .orderBy(schema.cardProgress.dueDate)
    .limit(limit);
}

/**
 * Get new words that haven't been learned yet
 * Returns words that either have no card progress or are in New state
 */
export async function getNewCards(
  userId: number,
  limit: number = 10,
  minDifficulty?: number,
  maxDifficulty?: number
): Promise<Word[]> {
  // Get word IDs that already have progress for this user
  const existingWordIds = await db
    .select({ wordId: schema.cardProgress.wordId })
    .from(schema.cardProgress)
    .where(eq(schema.cardProgress.userId, userId));

  const existingIds = existingWordIds.map((r) => r.wordId);

  // Build query for words without progress
  let query = db
    .select()
    .from(schema.words)
    .$dynamic();

  if (existingIds.length > 0) {
    // Use NOT IN for excluding existing words
    query = query.where(
      sql`${schema.words.id} NOT IN (${sql.join(existingIds.map(id => sql`${id}`), sql`, `)})`
    );
  }

  // Add difficulty filters if provided
  if (minDifficulty !== undefined && maxDifficulty !== undefined) {
    query = query.where(
      and(
        gte(schema.words.difficulty, minDifficulty),
        lte(schema.words.difficulty, maxDifficulty)
      )
    );
  }

  return query.orderBy(sql`RANDOM()`).limit(limit);
}

/**
 * Create or get card progress for a word
 */
export async function getOrCreateCardProgress(
  userId: number,
  wordId: number
): Promise<CardProgress> {
  const existing = await getCardProgress(userId, wordId);
  if (existing) return existing;

  const now = Math.floor(Date.now() / 1000);
  const newCard = createNewCard(now);

  const result = await db
    .insert(schema.cardProgress)
    .values({
      userId,
      wordId,
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      elapsedDays: newCard.elapsedDays,
      scheduledDays: newCard.scheduledDays,
      reps: newCard.reps,
      lapses: newCard.lapses,
      state: newCard.state,
      dueDate: newCard.dueDate,
      lastReviewedAt: newCard.lastReviewedAt,
      totalAttempts: 0,
      correctAttempts: 0,
      averageLevenshtein: 0,
    })
    .returning();

  return result[0];
}

/**
 * Update card after a review using FSRS algorithm
 */
export async function updateCardAfterReview(
  cardId: number,
  rating: RatingType,
  levenshteinDistance: number,
  isCorrect: boolean
): Promise<CardProgress> {
  const now = Math.floor(Date.now() / 1000);

  // Get current card state
  const cards = await db
    .select()
    .from(schema.cardProgress)
    .where(eq(schema.cardProgress.id, cardId))
    .limit(1);

  const currentCard = cards[0];
  if (!currentCard) {
    throw new Error(`Card not found: ${cardId}`);
  }

  // Calculate new FSRS state
  const fsrsCard = {
    stability: currentCard.stability,
    difficulty: currentCard.difficulty,
    elapsedDays: currentCard.elapsedDays,
    scheduledDays: currentCard.scheduledDays,
    reps: currentCard.reps,
    lapses: currentCard.lapses,
    state: currentCard.state as 0 | 1 | 2 | 3,
    dueDate: currentCard.dueDate,
    lastReviewedAt: currentCard.lastReviewedAt,
  };

  const updatedFsrs = scheduleCard(fsrsCard, rating, now);

  // Calculate new average Levenshtein
  const newTotalAttempts = currentCard.totalAttempts + 1;
  const newCorrectAttempts = currentCard.correctAttempts + (isCorrect ? 1 : 0);
  const currentAvg = currentCard.averageLevenshtein ?? 0;
  const newAvgLevenshtein =
    (currentAvg * currentCard.totalAttempts + levenshteinDistance) / newTotalAttempts;

  // Update the card
  const result = await db
    .update(schema.cardProgress)
    .set({
      stability: updatedFsrs.stability,
      difficulty: updatedFsrs.difficulty,
      elapsedDays: updatedFsrs.elapsedDays,
      scheduledDays: updatedFsrs.scheduledDays,
      reps: updatedFsrs.reps,
      lapses: updatedFsrs.lapses,
      state: updatedFsrs.state,
      dueDate: updatedFsrs.dueDate,
      lastReviewedAt: updatedFsrs.lastReviewedAt,
      totalAttempts: newTotalAttempts,
      correctAttempts: newCorrectAttempts,
      averageLevenshtein: newAvgLevenshtein,
      updatedAt: now,
    })
    .where(eq(schema.cardProgress.id, cardId))
    .returning();

  return result[0];
}

/**
 * Get cards by learning state
 */
export async function getCardsByState(
  userId: number,
  state: number
): Promise<CardProgressWithWord[]> {
  return db
    .select({
      id: schema.cardProgress.id,
      userId: schema.cardProgress.userId,
      wordId: schema.cardProgress.wordId,
      stability: schema.cardProgress.stability,
      difficulty: schema.cardProgress.difficulty,
      elapsedDays: schema.cardProgress.elapsedDays,
      scheduledDays: schema.cardProgress.scheduledDays,
      reps: schema.cardProgress.reps,
      lapses: schema.cardProgress.lapses,
      state: schema.cardProgress.state,
      dueDate: schema.cardProgress.dueDate,
      lastReviewedAt: schema.cardProgress.lastReviewedAt,
      totalAttempts: schema.cardProgress.totalAttempts,
      correctAttempts: schema.cardProgress.correctAttempts,
      averageLevenshtein: schema.cardProgress.averageLevenshtein,
      createdAt: schema.cardProgress.createdAt,
      updatedAt: schema.cardProgress.updatedAt,
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
    .from(schema.cardProgress)
    .innerJoin(schema.words, eq(schema.cardProgress.wordId, schema.words.id))
    .where(
      and(eq(schema.cardProgress.userId, userId), eq(schema.cardProgress.state, state))
    );
}

/**
 * Get count of cards by state for a user
 */
export async function getCardCountsByState(
  userId: number
): Promise<Record<string, number>> {
  const results = await db
    .select({
      state: schema.cardProgress.state,
      count: sql<number>`count(*)`,
    })
    .from(schema.cardProgress)
    .where(eq(schema.cardProgress.userId, userId))
    .groupBy(schema.cardProgress.state);

  const counts: Record<string, number> = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
  };

  for (const r of results) {
    switch (r.state) {
      case FSRSState.New:
        counts.new = r.count;
        break;
      case FSRSState.Learning:
        counts.learning = r.count;
        break;
      case FSRSState.Review:
        counts.review = r.count;
        break;
      case FSRSState.Relearning:
        counts.relearning = r.count;
        break;
    }
  }

  return counts;
}

/**
 * Get count of due cards
 */
export async function getDueCardCount(userId: number): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.cardProgress)
    .where(
      and(
        eq(schema.cardProgress.userId, userId),
        lte(schema.cardProgress.dueDate, now),
        not(eq(schema.cardProgress.state, FSRSState.New))
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Get mastered words (high stability, many reps, few lapses)
 */
export async function getMasteredCards(
  userId: number,
  limit: number = 50
): Promise<CardProgressWithWord[]> {
  return db
    .select({
      id: schema.cardProgress.id,
      userId: schema.cardProgress.userId,
      wordId: schema.cardProgress.wordId,
      stability: schema.cardProgress.stability,
      difficulty: schema.cardProgress.difficulty,
      elapsedDays: schema.cardProgress.elapsedDays,
      scheduledDays: schema.cardProgress.scheduledDays,
      reps: schema.cardProgress.reps,
      lapses: schema.cardProgress.lapses,
      state: schema.cardProgress.state,
      dueDate: schema.cardProgress.dueDate,
      lastReviewedAt: schema.cardProgress.lastReviewedAt,
      totalAttempts: schema.cardProgress.totalAttempts,
      correctAttempts: schema.cardProgress.correctAttempts,
      averageLevenshtein: schema.cardProgress.averageLevenshtein,
      createdAt: schema.cardProgress.createdAt,
      updatedAt: schema.cardProgress.updatedAt,
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
    .from(schema.cardProgress)
    .innerJoin(schema.words, eq(schema.cardProgress.wordId, schema.words.id))
    .where(
      and(
        eq(schema.cardProgress.userId, userId),
        eq(schema.cardProgress.state, FSRSState.Review),
        gte(schema.cardProgress.reps, 5),
        gte(schema.cardProgress.stability, 30) // At least 30 days stability
      )
    )
    .orderBy(desc(schema.cardProgress.stability))
    .limit(limit);
}

/**
 * Reset a card back to new state
 */
export async function resetCard(cardId: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const newCard = createNewCard(now);

  await db
    .update(schema.cardProgress)
    .set({
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: FSRSState.New,
      dueDate: now,
      lastReviewedAt: null,
      totalAttempts: 0,
      correctAttempts: 0,
      averageLevenshtein: 0,
      updatedAt: now,
    })
    .where(eq(schema.cardProgress.id, cardId));
}

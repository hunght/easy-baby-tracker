import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm';

import { db } from './db';
import * as schema from '@/db/schema';
import type { InsertWord, Word } from '@/db/schema';

/**
 * Get a word by its ID
 */
export async function getWordById(id: number): Promise<Word | null> {
  const results = await db
    .select()
    .from(schema.words)
    .where(eq(schema.words.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get a word by its text
 */
export async function getWordByText(word: string): Promise<Word | null> {
  const results = await db
    .select()
    .from(schema.words)
    .where(eq(schema.words.word, word.toLowerCase()))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Search words by partial match
 */
export async function searchWords(query: string, limit: number = 50): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .where(like(schema.words.word, `${query.toLowerCase()}%`))
    .orderBy(schema.words.word)
    .limit(limit);
}

/**
 * Get words by difficulty range
 */
export async function getWordsByDifficulty(
  minDifficulty: number,
  maxDifficulty: number,
  limit: number = 100
): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .where(
      and(
        gte(schema.words.difficulty, minDifficulty),
        lte(schema.words.difficulty, maxDifficulty)
      )
    )
    .orderBy(schema.words.difficulty)
    .limit(limit);
}

/**
 * Get words by category
 */
export async function getWordsByCategory(categoryId: number): Promise<Word[]> {
  return db
    .select({
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
    })
    .from(schema.words)
    .innerJoin(
      schema.wordCategoryMapping,
      eq(schema.words.id, schema.wordCategoryMapping.wordId)
    )
    .where(eq(schema.wordCategoryMapping.categoryId, categoryId));
}

/**
 * Get random words for practice
 */
export async function getRandomWords(count: number = 10): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .orderBy(sql`RANDOM()`)
    .limit(count);
}

/**
 * Get random words within a difficulty range
 */
export async function getRandomWordsByDifficulty(
  minDifficulty: number,
  maxDifficulty: number,
  count: number = 10
): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .where(
      and(
        gte(schema.words.difficulty, minDifficulty),
        lte(schema.words.difficulty, maxDifficulty)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(count);
}

/**
 * Get total word count
 */
export async function getWordCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.words);

  return result[0]?.count ?? 0;
}

/**
 * Get word count by difficulty range
 */
export async function getWordCountByDifficulty(
  minDifficulty: number,
  maxDifficulty: number
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.words)
    .where(
      and(
        gte(schema.words.difficulty, minDifficulty),
        lte(schema.words.difficulty, maxDifficulty)
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Import words in batch (for Wiktionary import)
 */
export async function importWords(words: InsertWord[]): Promise<void> {
  if (words.length === 0) return;

  // Insert in batches of 100 to avoid SQLite limits
  const batchSize = 100;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    await db.insert(schema.words).values(batch).onConflictDoNothing();
  }
}

/**
 * Update a word's difficulty (for Elo-style updates)
 */
export async function updateWordDifficulty(
  wordId: number,
  newDifficulty: number
): Promise<void> {
  await db
    .update(schema.words)
    .set({ difficulty: newDifficulty })
    .where(eq(schema.words.id, wordId));
}

/**
 * Delete a word by ID
 */
export async function deleteWord(id: number): Promise<void> {
  await db.delete(schema.words).where(eq(schema.words.id, id));
}

/**
 * Get all word categories
 */
export async function getCategories(): Promise<schema.WordCategory[]> {
  return db.select().from(schema.wordCategories).orderBy(schema.wordCategories.name);
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string
): Promise<schema.WordCategory> {
  const result = await db
    .insert(schema.wordCategories)
    .values({ name, description })
    .returning();

  return result[0];
}

/**
 * Add a word to a category
 */
export async function addWordToCategory(
  wordId: number,
  categoryId: number
): Promise<void> {
  await db
    .insert(schema.wordCategoryMapping)
    .values({ wordId, categoryId })
    .onConflictDoNothing();
}

/**
 * Get recently added words
 */
export async function getRecentWords(limit: number = 20): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .orderBy(desc(schema.words.importedAt))
    .limit(limit);
}

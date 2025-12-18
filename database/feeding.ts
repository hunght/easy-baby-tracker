import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type FeedingSelect = typeof schema.feedings.$inferSelect;
type FeedingInsert = typeof schema.feedings.$inferInsert;

// Re-export specific types from schema
export type FeedingType = FeedingSelect['type'];
export type IngredientType = NonNullable<FeedingSelect['ingredientType']>;

// Payload for creating/updating feedings
export type FeedingPayload = Omit<FeedingInsert, 'id' | 'recordedAt' | 'babyId'> & {
  babyId?: number;
};

// Return type for feeding records
export type FeedingRecord = FeedingSelect;

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) {
    return provided;
  }
  return requireActiveBabyProfileId();
}

export async function saveFeeding(payload: FeedingPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);
  const result = await db
    .insert(schema.feedings)
    .values({ ...payload, babyId })
    .returning({ id: schema.feedings.id });

  return result[0]?.id ?? 0;
}

export async function getFeedings(options?: {
  limit?: number;
  offset?: number;
  startDate?: number; // Unix timestamp in seconds
  endDate?: number; // Unix timestamp in seconds
  babyId?: number;
}): Promise<FeedingRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  const conditions: SQLWrapper[] = [];
  conditions.push(eq(schema.feedings.babyId, babyId));
  if (startDate) {
    conditions.push(gte(schema.feedings.startTime, startDate));
  }
  if (endDate) {
    conditions.push(lte(schema.feedings.startTime, endDate));
  }

  let query = db.select().from(schema.feedings).$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(schema.feedings.startTime));

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return await query;
}

export async function getFeedingById(
  feedingId: number,
  babyId?: number
): Promise<FeedingRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);
  const result = await db
    .select()
    .from(schema.feedings)
    .where(and(eq(schema.feedings.id, feedingId), eq(schema.feedings.babyId, resolvedBabyId)))
    .limit(1);

  return result[0] ?? null;
}

export async function updateFeeding(id: number, payload: FeedingPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);
  await db
    .update(schema.feedings)
    .set({ ...payload, babyId })
    .where(and(eq(schema.feedings.id, id), eq(schema.feedings.babyId, babyId)));
}

export async function deleteFeeding(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);
  await db
    .delete(schema.feedings)
    .where(and(eq(schema.feedings.id, id), eq(schema.feedings.babyId, resolvedBabyId)));
}

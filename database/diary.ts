import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

type DiaryEntrySelect = typeof schema.diaryEntries.$inferSelect;
type DiaryEntryInsert = typeof schema.diaryEntries.$inferInsert;

export type DiaryEntryRecord = DiaryEntrySelect;
export type DiaryEntryPayload = Omit<DiaryEntryInsert, 'id' | 'createdAt' | 'babyId'> & {
  babyId?: number;
};

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) {
    return provided;
  }
  return requireActiveBabyProfileId();
}

export async function saveDiaryEntry(payload: DiaryEntryPayload): Promise<number> {
  const { babyId: providedBabyId, ...rest } = payload;
  const babyId = await resolveBabyId(providedBabyId);
  const result = await db
    .insert(schema.diaryEntries)
    .values({ ...rest, babyId })
    .returning({ id: schema.diaryEntries.id });

  return result[0]?.id ?? 0;
}

export async function getDiaryEntries(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<DiaryEntryRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  const conditions: SQLWrapper[] = [eq(schema.diaryEntries.babyId, babyId)];
  if (startDate) {
    conditions.push(gte(schema.diaryEntries.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(schema.diaryEntries.createdAt, endDate));
  }

  let query = db.select().from(schema.diaryEntries).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(schema.diaryEntries.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return await query;
}

export async function getDiaryEntryById(
  entryId: number,
  babyId?: number
): Promise<DiaryEntryRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);
  const result = await db
    .select()
    .from(schema.diaryEntries)
    .where(and(eq(schema.diaryEntries.id, entryId), eq(schema.diaryEntries.babyId, resolvedBabyId)))
    .limit(1);

  return result[0] ?? null;
}

export async function updateDiaryEntry(id: number, payload: DiaryEntryPayload): Promise<void> {
  const { babyId: providedBabyId, ...rest } = payload;
  const babyId = await resolveBabyId(providedBabyId);
  await db
    .update(schema.diaryEntries)
    .set({ ...rest, babyId })
    .where(and(eq(schema.diaryEntries.id, id), eq(schema.diaryEntries.babyId, babyId)));
}

export async function deleteDiaryEntry(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);
  await db
    .delete(schema.diaryEntries)
    .where(and(eq(schema.diaryEntries.id, id), eq(schema.diaryEntries.babyId, resolvedBabyId)));
}

import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

type SleepSessionSelect = typeof schema.sleepSessions.$inferSelect;
type SleepSessionInsert = typeof schema.sleepSessions.$inferInsert;

export type SleepSessionKind = SleepSessionSelect['kind'];

export type SleepSessionPayload = Omit<SleepSessionInsert, 'id' | 'recordedAt' | 'babyId'> & {
  babyId?: number;
};

export type SleepSessionRecord = SleepSessionSelect;

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) {
    return provided;
  }
  return requireActiveBabyProfileId();
}

function computeDurationSeconds(
  startTime?: number | null,
  endTime?: number | null,
  duration?: number | null
) {
  if (duration != null) {
    return duration;
  }
  if (startTime != null && endTime != null) {
    const diff = Math.floor(endTime - startTime);
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }
  return undefined;
}

export async function saveSleepSession(payload: SleepSessionPayload): Promise<number> {
  const { babyId: providedBabyId, ...rest } = payload;
  const babyId = await resolveBabyId(providedBabyId);
  const normalizedDuration = computeDurationSeconds(rest.startTime, rest.endTime, rest.duration);

  const result = await db
    .insert(schema.sleepSessions)
    .values({
      ...rest,
      duration: normalizedDuration,
      babyId,
    })
    .returning({ id: schema.sleepSessions.id });

  return result[0]?.id ?? 0;
}

export async function getSleepSessions(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  kind?: SleepSessionKind;
  babyId?: number;
}): Promise<SleepSessionRecord[]> {
  const { limit, offset, startDate, endDate, kind, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  const conditions: SQLWrapper[] = [eq(schema.sleepSessions.babyId, babyId)];
  if (startDate) {
    conditions.push(gte(schema.sleepSessions.startTime, startDate));
  }
  if (endDate) {
    conditions.push(lte(schema.sleepSessions.startTime, endDate));
  }
  if (kind) {
    conditions.push(eq(schema.sleepSessions.kind, kind));
  }

  let query = db.select().from(schema.sleepSessions).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(schema.sleepSessions.startTime));

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return await query;
}

export async function getSleepSessionById(
  sessionId: number,
  babyId?: number
): Promise<SleepSessionRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const result = await db
    .select()
    .from(schema.sleepSessions)
    .where(
      and(eq(schema.sleepSessions.id, sessionId), eq(schema.sleepSessions.babyId, resolvedBabyId))
    )
    .limit(1);

  return result[0] ?? null;
}

export async function updateSleepSession(id: number, payload: SleepSessionPayload): Promise<void> {
  const { babyId: providedBabyId, ...rest } = payload;
  const babyId = await resolveBabyId(providedBabyId);
  const normalizedDuration = computeDurationSeconds(rest.startTime, rest.endTime, rest.duration);

  await db
    .update(schema.sleepSessions)
    .set({
      ...rest,
      duration: normalizedDuration,
      babyId,
    })
    .where(and(eq(schema.sleepSessions.id, id), eq(schema.sleepSessions.babyId, babyId)));
}

export async function deleteSleepSession(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);
  await db
    .delete(schema.sleepSessions)
    .where(and(eq(schema.sleepSessions.id, id), eq(schema.sleepSessions.babyId, resolvedBabyId)));
}

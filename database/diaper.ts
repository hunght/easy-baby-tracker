import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type DiaperChangeSelect = typeof schema.diaperChanges.$inferSelect;
type DiaperChangeInsert = typeof schema.diaperChanges.$inferInsert;

// Re-export specific types from schema
export type DiaperKind = DiaperChangeSelect['kind'];

// Custom type for poop color (not defined in schema)
export type PoopColor =
    | 'yellow'
    | 'brown'
    | 'olive_green'
    | 'dark_green'
    | 'red'
    | 'black'
    | 'white';

// Payload for creating/updating diaper changes
export type DiaperChangePayload = Omit<DiaperChangeInsert, 'id' | 'recordedAt' | 'babyId'> & {
    babyId?: number;
};

// Return type for diaper change records
export type DiaperChangeRecord = DiaperChangeSelect;

async function resolveBabyId(provided?: number): Promise<number> {
    if (provided != null) {
        return provided;
    }
    return requireActiveBabyProfileId();
}

export async function saveDiaperChange(payload: DiaperChangePayload): Promise<number> {
    const babyId = await resolveBabyId(payload.babyId);
    const result = await db
        .insert(schema.diaperChanges)
        .values({ ...payload, babyId })
        .returning({ id: schema.diaperChanges.id });

    return result[0]?.id ?? 0;
}

export async function getDiaperChanges(options?: {
    limit?: number;
    offset?: number;
    startDate?: number; // Unix timestamp in seconds
    endDate?: number; // Unix timestamp in seconds
    babyId?: number;
}): Promise<DiaperChangeRecord[]> {
    const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
    const babyId = await resolveBabyId(providedBabyId);

    const conditions: SQLWrapper[] = [];
    conditions.push(eq(schema.diaperChanges.babyId, babyId));
    if (startDate) {
        conditions.push(gte(schema.diaperChanges.time, startDate));
    }
    if (endDate) {
        conditions.push(lte(schema.diaperChanges.time, endDate));
    }

    let query = db.select().from(schema.diaperChanges).$dynamic();

    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(schema.diaperChanges.time));

    if (limit !== undefined) {
        query = query.limit(limit);
    }
    if (offset !== undefined) {
        query = query.offset(offset);
    }

    return await query;
}

export async function getDiaperChangeById(changeId: number, babyId?: number): Promise<DiaperChangeRecord | null> {
    const resolvedBabyId = await resolveBabyId(babyId);
    const result = await db
        .select()
        .from(schema.diaperChanges)
        .where(and(eq(schema.diaperChanges.id, changeId), eq(schema.diaperChanges.babyId, resolvedBabyId)))
        .limit(1);

    return result[0] ?? null;
}

export async function updateDiaperChange(id: number, payload: DiaperChangePayload): Promise<void> {
    const babyId = await resolveBabyId(payload.babyId);
    await db
        .update(schema.diaperChanges)
        .set({ ...payload, babyId })
        .where(and(eq(schema.diaperChanges.id, id), eq(schema.diaperChanges.babyId, babyId)));
}

export async function deleteDiaperChange(id: number, babyId?: number): Promise<void> {
    const resolvedBabyId = await resolveBabyId(babyId);
    await db
        .delete(schema.diaperChanges)
        .where(and(eq(schema.diaperChanges.id, id), eq(schema.diaperChanges.babyId, resolvedBabyId)));
}

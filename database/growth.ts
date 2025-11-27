import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type GrowthRecordSelect = typeof schema.growthRecords.$inferSelect;
type GrowthRecordInsert = typeof schema.growthRecords.$inferInsert;

// Payload for creating/updating growth records
export type GrowthRecordPayload = Omit<GrowthRecordInsert, 'id' | 'recordedAt' | 'babyId'> & { babyId?: number };

// Return type for growth records
export type GrowthRecord = GrowthRecordSelect;

async function resolveBabyId(provided?: number): Promise<number> {
    if (provided != null) {
        return provided;
    }
    return requireActiveBabyProfileId();
}

export async function saveGrowthRecord(payload: GrowthRecordPayload): Promise<number> {
    const babyId = await resolveBabyId(payload.babyId);
    const result = await db
        .insert(schema.growthRecords)
        .values({ ...payload, babyId })
        .returning({ id: schema.growthRecords.id });

    return result[0]?.id ?? 0;
}

export async function getGrowthRecords(options?: {
    limit?: number;
    offset?: number;
    startDate?: number; // Unix timestamp in seconds
    endDate?: number; // Unix timestamp in seconds
    babyId?: number;
}): Promise<GrowthRecord[]> {
    const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
    const babyId = await resolveBabyId(providedBabyId);

    const conditions: SQLWrapper[] = [eq(schema.growthRecords.babyId, babyId)];
    if (startDate) {
        conditions.push(gte(schema.growthRecords.time, startDate));
    }
    if (endDate) {
        conditions.push(lte(schema.growthRecords.time, endDate));
    }

    let query = db.select().from(schema.growthRecords).$dynamic().where(and(...conditions));
    query = query.orderBy(desc(schema.growthRecords.time));

    if (limit !== undefined) {
        query = query.limit(limit);
    }
    if (offset !== undefined) {
        query = query.offset(offset);
    }

    return await query;
}

export async function getGrowthRecordById(recordId: number, babyId?: number): Promise<GrowthRecord | null> {
    const resolvedBabyId = await resolveBabyId(babyId);
    const result = await db
        .select()
        .from(schema.growthRecords)
        .where(and(eq(schema.growthRecords.id, recordId), eq(schema.growthRecords.babyId, resolvedBabyId)))
        .limit(1);

    return result[0] ?? null;
}

export async function updateGrowthRecord(id: number, payload: GrowthRecordPayload): Promise<void> {
    const babyId = await resolveBabyId(payload.babyId);
    await db
        .update(schema.growthRecords)
        .set({ ...payload, babyId })
        .where(and(eq(schema.growthRecords.id, id), eq(schema.growthRecords.babyId, babyId)));
}

export async function deleteGrowthRecord(id: number, babyId?: number): Promise<void> {
    const resolvedBabyId = await resolveBabyId(babyId);
    await db
        .delete(schema.growthRecords)
        .where(and(eq(schema.growthRecords.id, id), eq(schema.growthRecords.babyId, resolvedBabyId)));
}

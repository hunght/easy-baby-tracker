import { and, desc, eq, gte, lte, sql, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type PumpingSelect = typeof schema.pumpings.$inferSelect;
type PumpingInsert = typeof schema.pumpings.$inferInsert;

// Payload for creating/updating pumpings
export type PumpingPayload = Omit<PumpingInsert, 'id' | 'recordedAt' | 'babyId'> & { babyId?: number };

// Return type for pumping records
export type PumpingRecord = PumpingSelect;

async function resolveBabyId(provided?: number): Promise<number> {
    if (provided != null) {
        return provided;
    }
    return requireActiveBabyProfileId();
}

export async function savePumping(payload: PumpingPayload): Promise<number> {
    const babyId = await resolveBabyId(payload.babyId);
    const result = await db
        .insert(schema.pumpings)
        .values({ ...payload, babyId })
        .returning({ id: schema.pumpings.id });

    return result[0]?.id ?? 0;
}

export async function getPumpings(options?: {
    limit?: number;
    offset?: number;
    startDate?: number; // Unix timestamp in seconds
    endDate?: number; // Unix timestamp in seconds
    babyId?: number;
}): Promise<PumpingRecord[]> {
    const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
    const babyId = await resolveBabyId(providedBabyId);

    const conditions: SQLWrapper[] = [];
    conditions.push(eq(schema.pumpings.babyId, babyId));
    if (startDate) {
        conditions.push(gte(schema.pumpings.startTime, startDate));
    }
    if (endDate) {
        conditions.push(lte(schema.pumpings.startTime, endDate));
    }

    let query = db.select().from(schema.pumpings).$dynamic();

    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(schema.pumpings.startTime));

    if (limit !== undefined) {
        query = query.limit(limit);
    }
    if (offset !== undefined) {
        query = query.offset(offset);
    }

    return await query;
}

export async function getPumpingById(pumpingId: number, babyId?: number): Promise<PumpingRecord | null> {
    const resolvedBabyId = await resolveBabyId(babyId);
    const result = await db
        .select()
        .from(schema.pumpings)
        .where(and(eq(schema.pumpings.id, pumpingId), eq(schema.pumpings.babyId, resolvedBabyId)))
        .limit(1);

    return result[0] ?? null;
}

// Calculate total inventory from all pumpings (excluding those used in feedings)
export async function getPumpingInventory(babyId?: number): Promise<number> {
    const resolvedBabyId = await resolveBabyId(babyId);
    const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${schema.pumpings.amountMl}), 0)`.as('total'),
        })
        .from(schema.pumpings)
        .where(eq(schema.pumpings.babyId, resolvedBabyId));

    return result[0]?.total ?? 0;
}

export async function updatePumping(id: number, payload: PumpingPayload): Promise<void> {
    const babyId = await resolveBabyId(payload.babyId);
    await db
        .update(schema.pumpings)
        .set({ ...payload, babyId })
        .where(and(eq(schema.pumpings.id, id), eq(schema.pumpings.babyId, babyId)));
}

export async function deletePumping(id: number, babyId?: number): Promise<void> {
    const resolvedBabyId = await resolveBabyId(babyId);
    await db
        .delete(schema.pumpings)
        .where(and(eq(schema.pumpings.id, id), eq(schema.pumpings.babyId, resolvedBabyId)));
}

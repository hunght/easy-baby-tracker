import { and, desc, eq, gte, lte, type SQLWrapper } from 'drizzle-orm';

import { requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type HealthRecordSelect = typeof schema.healthRecords.$inferSelect;
type HealthRecordInsert = typeof schema.healthRecords.$inferInsert;

// Re-export specific types from schema
export type HealthRecordType = HealthRecordSelect['type'];
export type MedicineType = NonNullable<HealthRecordSelect['medicineType']>;

// Payload for creating/updating health records
export type HealthRecordPayload = Omit<HealthRecordInsert, 'id' | 'recordedAt' | 'babyId'> & {
    babyId?: number;
};

// Return type for health records
export type HealthRecord = HealthRecordSelect;

async function resolveBabyId(provided?: number): Promise<number> {
    if (provided != null) {
        return provided;
    }
    return requireActiveBabyProfileId();
}

export async function saveHealthRecord(payload: HealthRecordPayload): Promise<number> {
    const babyId = await resolveBabyId(payload.babyId);
    const result = await db
        .insert(schema.healthRecords)
        .values({ ...payload, babyId })
        .returning({ id: schema.healthRecords.id });

    return result[0]?.id ?? 0;
}

export async function getHealthRecords(options?: {
    limit?: number;
    offset?: number;
    startDate?: number; // Unix timestamp in seconds
    endDate?: number; // Unix timestamp in seconds
    type?: HealthRecordType;
    babyId?: number;
}): Promise<HealthRecord[]> {
    const { limit, offset, startDate, endDate, type, babyId: providedBabyId } = options ?? {};
    const babyId = await resolveBabyId(providedBabyId);

    const conditions: SQLWrapper[] = [];
    conditions.push(eq(schema.healthRecords.babyId, babyId));
    if (startDate) {
        conditions.push(gte(schema.healthRecords.time, startDate));
    }
    if (endDate) {
        conditions.push(lte(schema.healthRecords.time, endDate));
    }
    if (type) {
        conditions.push(eq(schema.healthRecords.type, type));
    }

    let query = db.select().from(schema.healthRecords).$dynamic();

    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(schema.healthRecords.time));

    if (limit !== undefined) {
        query = query.limit(limit);
    }
    if (offset !== undefined) {
        query = query.offset(offset);
    }

    return await query;
}

export async function getHealthRecordById(recordId: number, babyId?: number): Promise<HealthRecord | null> {
    const resolvedBabyId = await resolveBabyId(babyId);
    const result = await db
        .select()
        .from(schema.healthRecords)
        .where(and(eq(schema.healthRecords.id, recordId), eq(schema.healthRecords.babyId, resolvedBabyId)))
        .limit(1);

    return result[0] ?? null;
}

export async function updateHealthRecord(id: number, payload: HealthRecordPayload): Promise<void> {
    const babyId = await resolveBabyId(payload.babyId);
    await db
        .update(schema.healthRecords)
        .set({ ...payload, babyId })
        .where(and(eq(schema.healthRecords.id, id), eq(schema.healthRecords.babyId, babyId)));
}

export async function deleteHealthRecord(id: number, babyId?: number): Promise<void> {
    const resolvedBabyId = await resolveBabyId(babyId);
    await db
        .delete(schema.healthRecords)
        .where(and(eq(schema.healthRecords.id, id), eq(schema.healthRecords.babyId, resolvedBabyId)));
}

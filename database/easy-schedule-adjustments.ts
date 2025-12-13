import { eq, and } from 'drizzle-orm';

import { db } from './db';
import * as schema from '@/db/schema';

export type EasyScheduleAdjustmentRecord = typeof schema.easyScheduleAdjustments.$inferSelect;
export type EasyScheduleAdjustmentPayload = typeof schema.easyScheduleAdjustments.$inferInsert;

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get schedule adjustments for a specific baby and date
 */
export async function getScheduleAdjustments(
  babyId: number,
  date: string
): Promise<EasyScheduleAdjustmentRecord[]> {
  return await db
    .select()
    .from(schema.easyScheduleAdjustments)
    .where(
      and(
        eq(schema.easyScheduleAdjustments.babyId, babyId),
        eq(schema.easyScheduleAdjustments.adjustmentDate, date)
      )
    );
}

/**
 * Get schedule adjustments for today
 */
export async function getTodayScheduleAdjustments(
  babyId: number
): Promise<EasyScheduleAdjustmentRecord[]> {
  return await getScheduleAdjustments(babyId, getTodayDateString());
}

/**
 * Save a schedule adjustment (replaces existing adjustment for the same baby/date/itemOrder)
 */
export async function saveScheduleAdjustment(
  adjustment: Omit<EasyScheduleAdjustmentPayload, 'id' | 'createdAt'>
): Promise<void> {
  // Delete existing adjustment for this baby/date/itemOrder if it exists
  await db
    .delete(schema.easyScheduleAdjustments)
    .where(
      and(
        eq(schema.easyScheduleAdjustments.babyId, adjustment.babyId),
        eq(schema.easyScheduleAdjustments.adjustmentDate, adjustment.adjustmentDate),
        eq(schema.easyScheduleAdjustments.itemOrder, adjustment.itemOrder)
      )
    );

  // Insert new adjustment
  await db.insert(schema.easyScheduleAdjustments).values(adjustment);
}

/**
 * Delete all adjustments for a specific baby and date
 */
export async function deleteScheduleAdjustments(babyId: number, date: string): Promise<void> {
  await db
    .delete(schema.easyScheduleAdjustments)
    .where(
      and(
        eq(schema.easyScheduleAdjustments.babyId, babyId),
        eq(schema.easyScheduleAdjustments.adjustmentDate, date)
      )
    );
}

/**
 * Delete old schedule adjustments (older than 7 days)
 * Call this periodically to clean up old data
 */
export async function cleanupOldScheduleAdjustments(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

  await db
    .delete(schema.easyScheduleAdjustments)
    .where(eq(schema.easyScheduleAdjustments.adjustmentDate, cutoffDate));
}

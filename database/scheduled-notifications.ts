import { and, eq, gte, lte } from 'drizzle-orm';

import { getActiveBabyProfileId, requireActiveBabyProfileId } from '@/database/baby-profile';
import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type ScheduledNotificationSelect = typeof schema.scheduledNotifications.$inferSelect;
type ScheduledNotificationInsert = typeof schema.scheduledNotifications.$inferInsert;

// Re-export specific types
export type ScheduledNotificationType = ScheduledNotificationSelect['notificationType'];
export type ScheduledNotificationRecord = ScheduledNotificationSelect;

// Payload for creating scheduled notifications
export type ScheduledNotificationPayload = Omit<
  ScheduledNotificationInsert,
  'id' | 'createdAt' | 'babyId'
> & { babyId?: number };

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) {
    return provided;
  }
  return requireActiveBabyProfileId();
}

async function resolveBabyIdOrNull(provided?: number): Promise<number | null> {
  if (provided != null) {
    return provided;
  }
  return getActiveBabyProfileId();
}

// Save a scheduled notification
export async function saveScheduledNotification(
  payload: ScheduledNotificationPayload
): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);
  const result = await db
    .insert(schema.scheduledNotifications)
    .values({ ...payload, babyId })
    .returning({ id: schema.scheduledNotifications.id });

  return result[0]?.id ?? 0;
}

// Get scheduled notification by notification ID
export async function getScheduledNotificationByNotificationId(
  notificationId: string,
  babyId?: number
): Promise<ScheduledNotificationRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);
  const result = await db
    .select()
    .from(schema.scheduledNotifications)
    .where(
      and(
        eq(schema.scheduledNotifications.notificationId, notificationId),
        eq(schema.scheduledNotifications.babyId, resolvedBabyId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

// Get all scheduled notifications for a baby
export async function getScheduledNotifications(
  options?: {
    babyId?: number;
    notificationType?: ScheduledNotificationType;
    includeExpired?: boolean;
  }
): Promise<ScheduledNotificationRecord[]> {
  const { babyId: providedBabyId, notificationType, includeExpired = true } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  const conditions = [eq(schema.scheduledNotifications.babyId, babyId)];

  if (notificationType) {
    conditions.push(eq(schema.scheduledNotifications.notificationType, notificationType));
  }

  if (!includeExpired) {
    const now = Math.floor(Date.now() / 1000);
    conditions.push(gte(schema.scheduledNotifications.scheduledTime, now)); // scheduledTime >= now (future)
  }

  return await db
    .select()
    .from(schema.scheduledNotifications)
    .where(and(...conditions));
}

// Get active (non-expired) scheduled notifications
export async function getActiveScheduledNotifications(
  babyId?: number
): Promise<ScheduledNotificationRecord[]> {
  const resolvedBabyId = await resolveBabyIdOrNull(babyId);
  if (resolvedBabyId == null) {
    // No active profile, return empty array
    return [];
  }
  const now = Math.floor(Date.now() / 1000);

  return await db
    .select()
    .from(schema.scheduledNotifications)
    .where(
      and(
        eq(schema.scheduledNotifications.babyId, resolvedBabyId),
        gte(schema.scheduledNotifications.scheduledTime, now) // scheduledTime >= now (future)
      )
    );
}

// Delete a scheduled notification by notification ID
export async function deleteScheduledNotificationByNotificationId(
  notificationId: string,
  babyId?: number
): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);
  await db
    .delete(schema.scheduledNotifications)
    .where(
      and(
        eq(schema.scheduledNotifications.notificationId, notificationId),
        eq(schema.scheduledNotifications.babyId, resolvedBabyId)
      )
    );
}

// Delete a scheduled notification by database ID
export async function deleteScheduledNotification(
  id: number,
  babyId?: number
): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);
  await db
    .delete(schema.scheduledNotifications)
    .where(
      and(
        eq(schema.scheduledNotifications.id, id),
        eq(schema.scheduledNotifications.babyId, resolvedBabyId)
      )
    );
}

// Clean up expired scheduled notifications
export async function cleanupExpiredScheduledNotifications(babyId?: number): Promise<number> {
  const resolvedBabyId = await resolveBabyId(babyId);
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .delete(schema.scheduledNotifications)
    .where(
      and(
        eq(schema.scheduledNotifications.babyId, resolvedBabyId),
        lte(schema.scheduledNotifications.scheduledTime, now) // scheduledTime <= now (past)
      )
    )
    .returning({ id: schema.scheduledNotifications.id });

  return result.length;
}


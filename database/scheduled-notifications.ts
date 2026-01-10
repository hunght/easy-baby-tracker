import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ScheduledNotificationType = "feeding" | "pumping" | "sleep" | "diaper";

// Convex document type
export type ScheduledNotificationDoc = Doc<"scheduledNotifications">;

// Convex ID type
export type ScheduledNotificationId = Id<"scheduledNotifications">;

// Record type (alias for consistency)
export type ScheduledNotificationRecord = ScheduledNotificationDoc;

// Payload for creating scheduled notifications (without babyId for compatibility)
export type ScheduledNotificationPayload = {
  babyId?: Id<"babyProfiles">;
  notificationType: string;
  notificationId: string;
  scheduledTime: number;
  data?: string;
};

// ============================================
// CONVEX API EXPORTS
// ============================================

// Queries
export const scheduledNotificationsApi = {
  list: api.scheduledNotifications.list,
  getActive: api.scheduledNotifications.getActive,
};

// Mutations
export const scheduledNotificationsMutations = {
  create: api.scheduledNotifications.create,
  removeByNotificationId: api.scheduledNotifications.removeByNotificationId,
};

// ============================================
// ASYNC WRAPPER FUNCTIONS (for non-React usage)
// ============================================

// Get all scheduled notifications
export async function getScheduledNotifications(options?: {
  notificationType?: string;
}): Promise<ScheduledNotificationDoc[]> {
  // Get active baby profile first
  const babyProfile = await convex.query(api.babyProfiles.getActive, {});
  if (!babyProfile) return [];

  const results = await convex.query(api.scheduledNotifications.list, {
    babyId: babyProfile._id,
    notificationType: options?.notificationType,
  });
  return results;
}

// Get active scheduled notifications
export async function getActiveScheduledNotifications(): Promise<ScheduledNotificationDoc[]> {
  // Get active baby profile first
  const babyProfile = await convex.query(api.babyProfiles.getActive, {});
  if (!babyProfile) return [];

  return await convex.query(api.scheduledNotifications.getActive, {
    babyId: babyProfile._id,
  });
}

// Save a new scheduled notification
export async function saveScheduledNotification(
  payload: ScheduledNotificationPayload
): Promise<void> {
  // If no babyId provided, skip saving (can't save without baby)
  if (!payload.babyId) {
    console.warn("[saveScheduledNotification] No babyId provided, skipping save");
    return;
  }
  await convex.mutation(api.scheduledNotifications.create, {
    babyId: payload.babyId,
    notificationType: payload.notificationType,
    notificationId: payload.notificationId,
    scheduledTime: payload.scheduledTime,
    data: payload.data,
  });
}

// Delete a scheduled notification by notification ID
export async function deleteScheduledNotificationByNotificationId(
  notificationId: string
): Promise<void> {
  await convex.mutation(api.scheduledNotifications.removeByNotificationId, {
    notificationId,
  });
}

// Re-export the full API for convenience
export { api };

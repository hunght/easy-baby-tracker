import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { getActiveBabyProfileId, requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPES
// ============================================

type ScheduledNotificationRow = Database['public']['Tables']['scheduled_notifications']['Row'];
type ScheduledNotificationInsert = Database['public']['Tables']['scheduled_notifications']['Insert'];

export type ScheduledNotificationRecord = {
  id: number;
  babyId: number;
  notificationType: string;
  notificationId: string;
  scheduledTime: number;
  data: string | null;
  createdAt: number;
}; // Matching inferred type structure roughly, but explicitly defined

// Re-export specific types
// Note: Types from Supabase are strings, we might want to cast them to union if used as such elsewhere
export type ScheduledNotificationType = 'feeding' | 'pumping' | 'sleep' | 'diaper';

// Payload for creating scheduled notifications
export type ScheduledNotificationPayload = {
  babyId?: number;
  notificationType: ScheduledNotificationType;
  notificationId: string;
  scheduledTime: number;
  data?: string | null;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: ScheduledNotificationRow): ScheduledNotificationRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    notificationType: row.notification_type,
    notificationId: row.notification_id,
    scheduledTime: row.scheduled_time,
    data: row.data,
    createdAt: row.created_at,
  };
}

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

// ============================================
// CRUD OPERATIONS
// ============================================

// Save a scheduled notification
export async function saveScheduledNotification(
  payload: ScheduledNotificationPayload
): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .insert({
      baby_id: babyId,
      notification_type: payload.notificationType,
      notification_id: payload.notificationId,
      scheduled_time: payload.scheduledTime,
      data: payload.data,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Get all scheduled notifications for a baby
export async function getScheduledNotifications(options?: {
  babyId?: number;
  notificationType?: ScheduledNotificationType;
  includeExpired?: boolean;
}): Promise<ScheduledNotificationRecord[]> {
  const { babyId: providedBabyId, notificationType, includeExpired = true } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('baby_id', babyId);

  if (notificationType) {
    query = query.eq('notification_type', notificationType);
  }

  if (!includeExpired) {
    const now = Math.floor(Date.now() / 1000);
    query = query.gte('scheduled_time', now); // scheduledTime >= now (future)
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(rowToRecord);
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

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('baby_id', resolvedBabyId)
    .gte('scheduled_time', now);

  if (error) throw error;

  return (data ?? []).map(rowToRecord);
}

// Delete a scheduled notification by notification ID
export async function deleteScheduledNotificationByNotificationId(
  notificationId: string,
  babyId?: number
): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('scheduled_notifications')
    .delete()
    .eq('notification_id', notificationId)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

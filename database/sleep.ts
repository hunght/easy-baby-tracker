import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type SleepSessionRow = Database['public']['Tables']['sleep_sessions']['Row'];

export type SleepSessionKind = SleepSessionRow['kind'];

export type SleepSessionPayload = {
  babyId?: number;
  kind: SleepSessionKind;
  startTime?: number;
  endTime?: number | null;
  duration?: number | null;
  notes?: string | null;
};

export type SleepSessionRecord = {
  id: number;
  babyId: number;
  kind: SleepSessionKind;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: SleepSessionRow): SleepSessionRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    kind: row.kind,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    notes: row.notes,
    recordedAt: row.recorded_at,
  };
}

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) return provided;
  return requireActiveBabyProfileId();
}

function computeDurationSeconds(
  startTime?: number | null,
  endTime?: number | null,
  duration?: number | null
) {
  if (duration != null) return duration;
  if (startTime != null && endTime != null) {
    const diff = Math.floor(endTime - startTime);
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }
  return undefined;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function saveSleepSession(payload: SleepSessionPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);
  const normalizedDuration = computeDurationSeconds(payload.startTime, payload.endTime, payload.duration);

  const { data, error } = await supabase
    .from('sleep_sessions')
    .insert({
      baby_id: babyId,
      kind: payload.kind,
      start_time: payload.startTime ?? Math.floor(Date.now() / 1000),
      end_time: payload.endTime,
      duration: normalizedDuration,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
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

  let query = supabase
    .from('sleep_sessions')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false });

  if (startDate) query = query.gte('start_time', startDate);
  if (endDate) query = query.lte('start_time', endDate);
  if (kind) query = query.eq('kind', kind);
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getSleepSessionById(
  sessionId: number,
  babyId?: number
): Promise<SleepSessionRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('sleep_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateSleepSession(id: number, payload: SleepSessionPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);
  const normalizedDuration = computeDurationSeconds(payload.startTime, payload.endTime, payload.duration);

  const { error } = await supabase
    .from('sleep_sessions')
    .update({
      kind: payload.kind,
      start_time: payload.startTime,
      end_time: payload.endTime,
      duration: normalizedDuration,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteSleepSession(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('sleep_sessions')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

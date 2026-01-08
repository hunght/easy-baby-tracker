import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type PumpingRow = Database['public']['Tables']['pumpings']['Row'];

export type PumpingPayload = {
  babyId?: number;
  startTime?: number;
  amountMl: number;
  leftAmountMl?: number | null;
  rightAmountMl?: number | null;
  leftDuration?: number | null;
  rightDuration?: number | null;
  duration?: number | null;
  notes?: string | null;
};

export type PumpingRecord = {
  id: number;
  babyId: number;
  startTime: number;
  amountMl: number;
  leftAmountMl: number | null;
  rightAmountMl: number | null;
  leftDuration: number | null;
  rightDuration: number | null;
  duration: number | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: PumpingRow): PumpingRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    startTime: row.start_time,
    amountMl: row.amount_ml,
    leftAmountMl: row.left_amount_ml,
    rightAmountMl: row.right_amount_ml,
    leftDuration: row.left_duration,
    rightDuration: row.right_duration,
    duration: row.duration,
    notes: row.notes,
    recordedAt: row.recorded_at,
  };
}

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) return provided;
  return requireActiveBabyProfileId();
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function savePumping(payload: PumpingPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('pumpings')
    .insert({
      baby_id: babyId,
      start_time: payload.startTime ?? Math.floor(Date.now() / 1000),
      amount_ml: payload.amountMl,
      left_amount_ml: payload.leftAmountMl,
      right_amount_ml: payload.rightAmountMl,
      left_duration: payload.leftDuration,
      right_duration: payload.rightDuration,
      duration: payload.duration,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getPumpings(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<PumpingRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('pumpings')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false });

  if (startDate) query = query.gte('start_time', startDate);
  if (endDate) query = query.lte('start_time', endDate);
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getPumpingById(
  pumpingId: number,
  babyId?: number
): Promise<PumpingRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('pumpings')
    .select('*')
    .eq('id', pumpingId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function getPumpingInventory(babyId?: number): Promise<number> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('pumpings')
    .select('amount_ml')
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => sum + (row.amount_ml ?? 0), 0);
}

export async function updatePumping(id: number, payload: PumpingPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('pumpings')
    .update({
      start_time: payload.startTime,
      amount_ml: payload.amountMl,
      left_amount_ml: payload.leftAmountMl,
      right_amount_ml: payload.rightAmountMl,
      left_duration: payload.leftDuration,
      right_duration: payload.rightDuration,
      duration: payload.duration,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deletePumping(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('pumpings')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

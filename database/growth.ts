import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type GrowthRecordRow = Database['public']['Tables']['growth_records']['Row'];

export type GrowthRecordPayload = {
  babyId?: number;
  time?: number;
  weightKg?: number | null;
  heightCm?: number | null;
  headCircumferenceCm?: number | null;
  notes?: string | null;
};

export type GrowthRecord = {
  id: number;
  babyId: number;
  time: number;
  weightKg: number | null;
  heightCm: number | null;
  headCircumferenceCm: number | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: GrowthRecordRow): GrowthRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    time: row.time,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    headCircumferenceCm: row.head_circumference_cm,
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

export async function saveGrowthRecord(payload: GrowthRecordPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('growth_records')
    .insert({
      baby_id: babyId,
      time: payload.time ?? Math.floor(Date.now() / 1000),
      weight_kg: payload.weightKg,
      height_cm: payload.heightCm,
      head_circumference_cm: payload.headCircumferenceCm,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getGrowthRecords(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<GrowthRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('growth_records')
    .select('*')
    .eq('baby_id', babyId)
    .order('time', { ascending: false });

  if (startDate) query = query.gte('time', startDate);
  if (endDate) query = query.lte('time', endDate);
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getGrowthRecordById(
  recordId: number,
  babyId?: number
): Promise<GrowthRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('growth_records')
    .select('*')
    .eq('id', recordId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateGrowthRecord(id: number, payload: GrowthRecordPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('growth_records')
    .update({
      time: payload.time,
      weight_kg: payload.weightKg,
      height_cm: payload.heightCm,
      head_circumference_cm: payload.headCircumferenceCm,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteGrowthRecord(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('growth_records')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type DiaperChangeRow = Database['public']['Tables']['diaper_changes']['Row'];

export type DiaperKind = DiaperChangeRow['kind'];

export type PoopColor =
  | 'yellow'
  | 'brown'
  | 'olive_green'
  | 'dark_green'
  | 'red'
  | 'black'
  | 'white';

export type DiaperChangePayload = {
  babyId?: number;
  kind: DiaperKind;
  time?: number;
  wetness?: number | null;
  color?: string | null;
  notes?: string | null;
};

export type DiaperChangeRecord = {
  id: number;
  babyId: number;
  kind: DiaperKind;
  time: number;
  wetness: number | null;
  color: string | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: DiaperChangeRow): DiaperChangeRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    kind: row.kind,
    time: row.time,
    wetness: row.wetness,
    color: row.color,
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

export async function saveDiaperChange(payload: DiaperChangePayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('diaper_changes')
    .insert({
      baby_id: babyId,
      kind: payload.kind,
      time: payload.time ?? Math.floor(Date.now() / 1000),
      wetness: payload.wetness,
      color: payload.color,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getDiaperChanges(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<DiaperChangeRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('diaper_changes')
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

export async function getDiaperChangeById(
  changeId: number,
  babyId?: number
): Promise<DiaperChangeRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('diaper_changes')
    .select('*')
    .eq('id', changeId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateDiaperChange(id: number, payload: DiaperChangePayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('diaper_changes')
    .update({
      kind: payload.kind,
      time: payload.time,
      wetness: payload.wetness,
      color: payload.color,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteDiaperChange(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('diaper_changes')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

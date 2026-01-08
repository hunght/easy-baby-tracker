import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type FeedingRow = Database['public']['Tables']['feedings']['Row'];
type FeedingInsert = Database['public']['Tables']['feedings']['Insert'];

export type FeedingType = 'breast' | 'bottle' | 'solids';
export type IngredientType = 'breast_milk' | 'formula' | 'others';

// Payload for creating/updating feedings (camelCase for API compatibility)
export type FeedingPayload = {
  babyId?: number;
  type: FeedingType;
  startTime?: number;
  duration?: number | null;
  leftDuration?: number | null;
  rightDuration?: number | null;
  ingredientType?: IngredientType | null;
  amountMl?: number | null;
  ingredient?: string | null;
  amountGrams?: number | null;
  notes?: string | null;
};

// Return type for feeding records (camelCase for API compatibility)
export type FeedingRecord = {
  id: number;
  babyId: number;
  type: FeedingType;
  startTime: number;
  duration: number | null;
  leftDuration: number | null;
  rightDuration: number | null;
  ingredientType: IngredientType | null;
  amountMl: number | null;
  ingredient: string | null;
  amountGrams: number | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: FeedingRow): FeedingRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    type: row.type as FeedingType,
    startTime: row.start_time,
    duration: row.duration,
    leftDuration: row.left_duration,
    rightDuration: row.right_duration,
    ingredientType: row.ingredient_type as IngredientType | null,
    amountMl: row.amount_ml,
    ingredient: row.ingredient,
    amountGrams: row.amount_grams,
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

export async function saveFeeding(payload: FeedingPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('feedings')
    .insert({
      baby_id: babyId,
      type: payload.type,
      start_time: payload.startTime ?? Math.floor(Date.now() / 1000),
      duration: payload.duration,
      left_duration: payload.leftDuration,
      right_duration: payload.rightDuration,
      ingredient_type: payload.ingredientType,
      amount_ml: payload.amountMl,
      ingredient: payload.ingredient,
      amount_grams: payload.amountGrams,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getFeedings(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<FeedingRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('feedings')
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

export async function getFeedingById(
  feedingId: number,
  babyId?: number
): Promise<FeedingRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('feedings')
    .select('*')
    .eq('id', feedingId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateFeeding(id: number, payload: FeedingPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('feedings')
    .update({
      type: payload.type,
      start_time: payload.startTime,
      duration: payload.duration,
      left_duration: payload.leftDuration,
      right_duration: payload.rightDuration,
      ingredient_type: payload.ingredientType,
      amount_ml: payload.amountMl,
      ingredient: payload.ingredient,
      amount_grams: payload.amountGrams,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteFeeding(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('feedings')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

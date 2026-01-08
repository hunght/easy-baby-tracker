import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type DiaryEntryRow = Database['public']['Tables']['diary_entries']['Row'];

export type DiaryEntryPayload = {
  babyId?: number;
  title?: string | null;
  content?: string | null;
  photoUri?: string | null;
};

export type DiaryEntryRecord = {
  id: number;
  babyId: number;
  title: string | null;
  content: string | null;
  photoUri: string | null;
  createdAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: DiaryEntryRow): DiaryEntryRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    title: row.title,
    content: row.content,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
  };
}

async function resolveBabyId(provided?: number): Promise<number> {
  if (provided != null) return provided;
  return requireActiveBabyProfileId();
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function saveDiaryEntry(payload: DiaryEntryPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('diary_entries')
    .insert({
      baby_id: babyId,
      title: payload.title,
      content: payload.content,
      photo_uri: payload.photoUri,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getDiaryEntries(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  babyId?: number;
}): Promise<DiaryEntryRecord[]> {
  const { limit, offset, startDate, endDate, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('diary_entries')
    .select('*')
    .eq('baby_id', babyId)
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getDiaryEntryById(
  entryId: number,
  babyId?: number
): Promise<DiaryEntryRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', entryId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateDiaryEntry(id: number, payload: DiaryEntryPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('diary_entries')
    .update({
      title: payload.title,
      content: payload.content,
      photo_uri: payload.photoUri,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteDiaryEntry(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

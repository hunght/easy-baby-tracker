import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';
import { requireActiveBabyProfileId } from '@/database/baby-profile';

// ============================================
// TYPE DEFINITIONS
// ============================================

type HealthRecordRow = Database['public']['Tables']['health_records']['Row'];

export type HealthRecordType = HealthRecordRow['type'];
export type MedicineType = NonNullable<HealthRecordRow['medicine_type']>;

export type HealthRecordPayload = {
  babyId?: number;
  type: HealthRecordType;
  time?: number;
  temperature?: number | null;
  medicineType?: MedicineType | null;
  medication?: string | null;
  symptoms?: string | null;
  notes?: string | null;
};

export type HealthRecord = {
  id: number;
  babyId: number;
  type: HealthRecordType;
  time: number;
  temperature: number | null;
  medicineType: MedicineType | null;
  medication: string | null;
  symptoms: string | null;
  notes: string | null;
  recordedAt: number;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function rowToRecord(row: HealthRecordRow): HealthRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    type: row.type,
    time: row.time,
    temperature: row.temperature,
    medicineType: row.medicine_type,
    medication: row.medication,
    symptoms: row.symptoms,
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

export async function saveHealthRecord(payload: HealthRecordPayload): Promise<number> {
  const babyId = await resolveBabyId(payload.babyId);

  const { data, error } = await supabase
    .from('health_records')
    .insert({
      baby_id: babyId,
      type: payload.type,
      time: payload.time ?? Math.floor(Date.now() / 1000),
      temperature: payload.temperature,
      medicine_type: payload.medicineType,
      medication: payload.medication,
      symptoms: payload.symptoms,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getHealthRecords(options?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
  type?: HealthRecordType;
  babyId?: number;
}): Promise<HealthRecord[]> {
  const { limit, offset, startDate, endDate, type, babyId: providedBabyId } = options ?? {};
  const babyId = await resolveBabyId(providedBabyId);

  let query = supabase
    .from('health_records')
    .select('*')
    .eq('baby_id', babyId)
    .order('time', { ascending: false });

  if (startDate) query = query.gte('time', startDate);
  if (endDate) query = query.lte('time', endDate);
  if (type) query = query.eq('type', type);
  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit ?? 50) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getHealthRecordById(
  recordId: number,
  babyId?: number
): Promise<HealthRecord | null> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('id', recordId)
    .eq('baby_id', resolvedBabyId)
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function updateHealthRecord(id: number, payload: HealthRecordPayload): Promise<void> {
  const babyId = await resolveBabyId(payload.babyId);

  const { error } = await supabase
    .from('health_records')
    .update({
      type: payload.type,
      time: payload.time,
      temperature: payload.temperature,
      medicine_type: payload.medicineType,
      medication: payload.medication,
      symptoms: payload.symptoms,
      notes: payload.notes,
    })
    .eq('id', id)
    .eq('baby_id', babyId);

  if (error) throw error;
}

export async function deleteHealthRecord(id: number, babyId?: number): Promise<void> {
  const resolvedBabyId = await resolveBabyId(babyId);

  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', id)
    .eq('baby_id', resolvedBabyId);

  if (error) throw error;
}

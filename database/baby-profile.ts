import { supabase, requireCurrentUserId } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';

// ============================================
// TYPE DEFINITIONS
// ============================================

type BabyProfileRow = Database['public']['Tables']['baby_profiles']['Row'];

export type Gender = 'boy' | 'girl' | 'unknown';

// Payload for creating/updating baby profiles (includes concerns)
// explicitly define camelCase properties that the app uses
export type BabyProfilePayload = {
  nickname: string;
  gender: Gender;
  birthDate: string;
  dueDate: string;
  avatarUri?: string | null;
  firstWakeTime?: string;
  selectedEasyFormulaId?: string | null;
  concerns: string[];
};

// Return type for baby profile records (includes concerns)
export type BabyProfileRecord = Omit<BabyProfileRow, 'user_id' | 'gender'> & {
  gender: Gender;
  concerns: string[];
  // Compatibility with old schema field names
  birthDate: string;
  dueDate: string;
  avatarUri: string | null;
  firstWakeTime: string;
  selectedEasyFormulaId: string | null;
  createdAt: number;
};

const ACTIVE_PROFILE_KEY = 'activeProfileId';

// ============================================
// HELPER FUNCTIONS
// ============================================

function isGender(value: string): value is Gender {
  return value === 'boy' || value === 'girl' || value === 'unknown';
}

function rowToRecord(row: BabyProfileRow, concerns: string[]): BabyProfileRecord {
  const gender: Gender = isGender(row.gender) ? row.gender : 'unknown';
  return {
    id: row.id,
    nickname: row.nickname,
    gender,
    birth_date: row.birth_date,
    due_date: row.due_date,
    avatar_uri: row.avatar_uri,
    first_wake_time: row.first_wake_time,
    selected_easy_formula_id: row.selected_easy_formula_id,
    created_at: row.created_at,
    concerns,
    // Camel case aliases for compatibility
    birthDate: row.birth_date,
    dueDate: row.due_date,
    avatarUri: row.avatar_uri,
    firstWakeTime: row.first_wake_time,
    selectedEasyFormulaId: row.selected_easy_formula_id,
    createdAt: row.created_at,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

type SaveBabyProfileOptions = {
  babyId?: number;
};

export async function saveBabyProfile(
  payload: BabyProfilePayload,
  options: SaveBabyProfileOptions = {}
): Promise<number> {
  const { babyId } = options;
  const userId = await requireCurrentUserId();

  if (babyId) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('baby_profiles')
      .update({
        nickname: payload.nickname,
        gender: payload.gender,
        birth_date: payload.birthDate,
        due_date: payload.dueDate,
        avatar_uri: payload.avatarUri,
        first_wake_time: payload.firstWakeTime,
        selected_easy_formula_id: payload.selectedEasyFormulaId,
      })
      .eq('id', babyId);

    if (updateError) throw updateError;

    // Delete existing concerns
    await supabase.from('concern_choices').delete().eq('baby_id', babyId);

    // Insert new concerns
    if (payload.concerns.length > 0) {
      const { error: concernError } = await supabase.from('concern_choices').insert(
        payload.concerns.map((concernId) => ({
          baby_id: babyId,
          concern_id: concernId,
        }))
      );
      if (concernError) throw concernError;
    }

    return babyId;
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from('baby_profiles')
      .insert({
        user_id: userId,
        nickname: payload.nickname,
        gender: payload.gender,
        birth_date: payload.birthDate,
        due_date: payload.dueDate,
        avatar_uri: payload.avatarUri,
        first_wake_time: payload.firstWakeTime ?? '07:00',
        selected_easy_formula_id: payload.selectedEasyFormulaId,
      })
      .select('id')
      .single();

    if (error) throw error;

    const newId = data.id;

    // Insert concerns
    if (payload.concerns.length > 0) {
      const { error: concernError } = await supabase.from('concern_choices').insert(
        payload.concerns.map((concernId) => ({
          baby_id: newId,
          concern_id: concernId,
        }))
      );
      if (concernError) throw concernError;
    }

    return newId;
  }
}

export async function getBabyProfiles(): Promise<BabyProfileRecord[]> {
  const { data: profiles, error } = await supabase
    .from('baby_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!profiles) return [];

  // Fetch all concerns for these profiles
  const babyIds = profiles.map((p) => p.id);
  const { data: concerns } = await supabase
    .from('concern_choices')
    .select('*')
    .in('baby_id', babyIds);

  const concernsByBabyId = new Map<number, string[]>();
  concerns?.forEach((c) => {
    const list = concernsByBabyId.get(c.baby_id) ?? [];
    list.push(c.concern_id);
    concernsByBabyId.set(c.baby_id, list);
  });

  return profiles.map((profile) => rowToRecord(profile, concernsByBabyId.get(profile.id) ?? []));
}

export async function getBabyProfileById(babyId: number): Promise<BabyProfileRecord | null> {
  const { data: profile, error } = await supabase
    .from('baby_profiles')
    .select('*')
    .eq('id', babyId)
    .single();

  if (error || !profile) return null;

  const { data: concerns } = await supabase
    .from('concern_choices')
    .select('concern_id')
    .eq('baby_id', babyId);

  return rowToRecord(profile, concerns?.map((c) => c.concern_id) ?? []);
}

export async function getActiveBabyProfileId(): Promise<number | null> {
  try {
    const userId = await requireCurrentUserId();

    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', ACTIVE_PROFILE_KEY)
      .single();

    if (error || !data?.value) return null;

    const parsed = Number(data.value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function requireActiveBabyProfileId(): Promise<number> {
  const activeId = await getActiveBabyProfileId();
  if (activeId == null) {
    throw new Error('No active baby profile selected');
  }
  return activeId;
}

export async function getActiveBabyProfile(): Promise<BabyProfileRecord | null> {
  const activeId = await getActiveBabyProfileId();
  if (activeId == null) return null;
  return getBabyProfileById(activeId);
}

export async function setActiveBabyProfileId(babyId: number | null) {
  const userId = await requireCurrentUserId();

  if (babyId == null) {
    await supabase.from('app_state').delete().eq('user_id', userId).eq('key', ACTIVE_PROFILE_KEY);
    return;
  }

  // Upsert the active profile ID
  const { error } = await supabase.from('app_state').upsert(
    {
      user_id: userId,
      key: ACTIVE_PROFILE_KEY,
      value: String(babyId),
    },
    { onConflict: 'user_id,key' }
  );

  if (error) throw error;
}

export async function saveOnboardingProfile(payload: BabyProfilePayload) {
  const babyId = await saveBabyProfile(payload);
  await setActiveBabyProfileId(babyId);
  return babyId;
}

export async function updateBabyFirstWakeTime(
  babyId: number,
  firstWakeTime: string
): Promise<void> {
  const { error } = await supabase
    .from('baby_profiles')
    .update({ first_wake_time: firstWakeTime })
    .eq('id', babyId);

  if (error) throw error;
}

export async function updateSelectedEasyFormula(
  babyId: number,
  formulaId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('baby_profiles')
    .update({ selected_easy_formula_id: formulaId })
    .eq('id', babyId);

  if (error) throw error;
}

import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';

// Use Drizzle's inferred types from schema
type BabyProfileSelect = typeof schema.babyProfiles.$inferSelect;
type BabyProfileInsert = typeof schema.babyProfiles.$inferInsert;

// Re-export specific types from schema
export type Gender = BabyProfileSelect['gender'];

// Payload for creating/updating baby profiles (includes concerns)
export type BabyProfilePayload = Omit<BabyProfileInsert, 'id' | 'createdAt'> & {
  concerns: string[];
};

// Return type for baby profile records (includes concerns)
export type BabyProfileRecord = BabyProfileSelect & {
  concerns: string[];
};

const ACTIVE_PROFILE_KEY = 'activeProfileId';

type SaveBabyProfileOptions = {
  babyId?: number;
};

export async function saveBabyProfile(
  payload: BabyProfilePayload,
  options: SaveBabyProfileOptions = {}
): Promise<number> {
  const { babyId } = options;

  return await db.transaction(async (tx) => {
    let targetId = babyId;

    if (babyId) {
      await tx
        .update(schema.babyProfiles)
        .set({
          nickname: payload.nickname,
          gender: payload.gender,
          birthDate: payload.birthDate,
          dueDate: payload.dueDate,
        })
        .where(eq(schema.babyProfiles.id, babyId));

      await tx.delete(schema.concernChoices).where(eq(schema.concernChoices.babyId, babyId));
    } else {
      await tx.insert(schema.babyProfiles).values({
        nickname: payload.nickname,
        gender: payload.gender,
        birthDate: payload.birthDate,
        dueDate: payload.dueDate,
      });
      // Query for the row we just inserted to get the ID
      const inserted = await tx
        .select({ id: schema.babyProfiles.id })
        .from(schema.babyProfiles)
        .where(eq(schema.babyProfiles.nickname, payload.nickname))
        .orderBy(desc(schema.babyProfiles.id))
        .limit(1);
      targetId = inserted[0]?.id;
    }

    if (payload.concerns.length > 0 && targetId != null) {
      await tx.insert(schema.concernChoices).values(
        payload.concerns.map((concernId) => ({
          babyId: targetId!,
          concernId,
        }))
      );
    }

    return targetId!;
  });
}

export async function getBabyProfiles(): Promise<BabyProfileRecord[]> {
  const profiles = await db
    .select({
      id: schema.babyProfiles.id,
      nickname: schema.babyProfiles.nickname,
      gender: schema.babyProfiles.gender,
      birthDate: schema.babyProfiles.birthDate,
      dueDate: schema.babyProfiles.dueDate,
      firstWakeTime: schema.babyProfiles.firstWakeTime,
      selectedEasyFormulaId: schema.babyProfiles.selectedEasyFormulaId,
      createdAt: schema.babyProfiles.createdAt,
      concerns: sql<string | null>`GROUP_CONCAT(${schema.concernChoices.concernId})`.as(
        'concerns_csv'
      ),
    })
    .from(schema.babyProfiles)
    .leftJoin(schema.concernChoices, eq(schema.babyProfiles.id, schema.concernChoices.babyId))
    .groupBy(schema.babyProfiles.id)
    .orderBy(schema.babyProfiles.createdAt);

  return profiles.map((profile) => ({
    id: profile.id,
    nickname: profile.nickname,
    gender: profile.gender,
    birthDate: profile.birthDate,
    dueDate: profile.dueDate,
    firstWakeTime: profile.firstWakeTime ?? '07:00',
    selectedEasyFormulaId: profile.selectedEasyFormulaId ?? null,
    createdAt: profile.createdAt,
    concerns: profile.concerns ? profile.concerns.split(',') : [],
  }));
}

export async function getBabyProfileById(babyId: number): Promise<BabyProfileRecord | null> {
  const result = await db
    .select({
      id: schema.babyProfiles.id,
      nickname: schema.babyProfiles.nickname,
      gender: schema.babyProfiles.gender,
      birthDate: schema.babyProfiles.birthDate,
      dueDate: schema.babyProfiles.dueDate,
      firstWakeTime: schema.babyProfiles.firstWakeTime,
      selectedEasyFormulaId: schema.babyProfiles.selectedEasyFormulaId,
      createdAt: schema.babyProfiles.createdAt,
      concerns: sql<string | null>`GROUP_CONCAT(${schema.concernChoices.concernId})`.as(
        'concerns_csv'
      ),
    })
    .from(schema.babyProfiles)
    .leftJoin(schema.concernChoices, eq(schema.babyProfiles.id, schema.concernChoices.babyId))
    .where(eq(schema.babyProfiles.id, babyId))
    .groupBy(schema.babyProfiles.id)
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const profile = result[0];
  return {
    id: profile.id,
    nickname: profile.nickname,
    gender: profile.gender,
    birthDate: profile.birthDate,
    dueDate: profile.dueDate,
    firstWakeTime: profile.firstWakeTime ?? '07:00',
    selectedEasyFormulaId: profile.selectedEasyFormulaId ?? null,
    createdAt: profile.createdAt,
    concerns: profile.concerns ? profile.concerns.split(',') : [],
  };
}

export async function getActiveBabyProfileId(): Promise<number | null> {
  try {
    const result = await db
      .select({ value: schema.appState.value })
      .from(schema.appState)
      .where(eq(schema.appState.key, ACTIVE_PROFILE_KEY))
      .limit(1);

    if (result.length === 0 || result[0].value == null) {
      return null;
    }

    const parsed = Number(result[0].value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch (error) {
    // Handle case where table doesn't exist yet (e.g., during migrations)
    console.warn('Error getting active baby profile ID:', error);
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
  if (activeId == null) {
    return null;
  }

  return getBabyProfileById(activeId);
}

export async function getBabyProfile(): Promise<BabyProfileRecord | null> {
  const profile = await db
    .select()
    .from(schema.babyProfiles)
    .orderBy(desc(schema.babyProfiles.id))
    .limit(1);

  if (profile.length === 0) {
    return null;
  }

  const concerns = await db
    .select({ concernId: schema.concernChoices.concernId })
    .from(schema.concernChoices)
    .where(eq(schema.concernChoices.babyId, profile[0].id));

  return {
    id: profile[0].id,
    nickname: profile[0].nickname,
    gender: profile[0].gender,
    birthDate: profile[0].birthDate,
    dueDate: profile[0].dueDate,
    firstWakeTime: profile[0].firstWakeTime ?? '07:00',
    selectedEasyFormulaId: profile[0].selectedEasyFormulaId,
    createdAt: profile[0].createdAt,
    concerns: concerns.map((c) => c.concernId),
  };
}

export async function setActiveBabyProfileId(babyId: number | null) {
  if (babyId == null) {
    await db.delete(schema.appState).where(eq(schema.appState.key, ACTIVE_PROFILE_KEY));
    return;
  }

  await db
    .insert(schema.appState)
    .values({
      key: ACTIVE_PROFILE_KEY,
      value: String(babyId),
    })
    .onConflictDoUpdate({
      target: schema.appState.key,
      set: {
        value: String(babyId),
      },
    });
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
  await db
    .update(schema.babyProfiles)
    .set({ firstWakeTime })
    .where(eq(schema.babyProfiles.id, babyId));
}

export async function updateSelectedEasyFormula(
  babyId: number,
  formulaId: string | null
): Promise<void> {
  await db
    .update(schema.babyProfiles)
    .set({ selectedEasyFormulaId: formulaId })
    .where(eq(schema.babyProfiles.id, babyId));
}

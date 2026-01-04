import { eq } from 'drizzle-orm';

import { db } from './db';
import { getAppState, setAppState } from './app-state';
import * as schema from '@/db/schema';
import type { InsertUserProfile, UserProfile, UserStats } from '@/db/schema';

const ACTIVE_USER_KEY = 'activeUserId';

// User settings interface
export interface UserSettings {
  dailyGoal: number; // Words per day
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

const defaultSettings: UserSettings = {
  dailyGoal: 10,
  preferredDifficulty: 'beginner',
  soundEnabled: true,
  hapticEnabled: true,
  theme: 'system',
};

/**
 * Get all user profiles
 */
export async function getUserProfiles(): Promise<UserProfile[]> {
  return db.select().from(schema.userProfile).orderBy(schema.userProfile.name);
}

/**
 * Get active user profile
 */
export async function getActiveUserProfile(): Promise<UserProfile | null> {
  const activeUserId = await getAppState(ACTIVE_USER_KEY);
  if (!activeUserId) return null;

  const profiles = await db
    .select()
    .from(schema.userProfile)
    .where(eq(schema.userProfile.id, parseInt(activeUserId)))
    .limit(1);

  return profiles[0] ?? null;
}

/**
 * Get active user ID or throw if not set
 */
export async function requireActiveUserId(): Promise<number> {
  const profile = await getActiveUserProfile();
  if (!profile) {
    throw new Error('No active user profile. Please create a profile first.');
  }
  return profile.id;
}

/**
 * Set the active user profile
 */
export async function setActiveUserProfile(userId: number): Promise<void> {
  await setAppState(ACTIVE_USER_KEY, userId.toString());
}

/**
 * Get user profile by ID
 */
export async function getUserProfileById(id: number): Promise<UserProfile | null> {
  const profiles = await db
    .select()
    .from(schema.userProfile)
    .where(eq(schema.userProfile.id, id))
    .limit(1);

  return profiles[0] ?? null;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(
  name: string,
  settings?: Partial<UserSettings>
): Promise<UserProfile> {
  const now = Math.floor(Date.now() / 1000);
  const mergedSettings = { ...defaultSettings, ...settings };

  const result = await db
    .insert(schema.userProfile)
    .values({
      name,
      createdAt: now,
      settings: JSON.stringify(mergedSettings),
    })
    .returning();

  const profile = result[0];

  // Create initial user stats for this profile
  await db.insert(schema.userStats).values({
    userId: profile.id,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    totalWordsLearned: 0,
    totalQuizzes: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    xpPoints: 0,
    level: 1,
  });

  return profile;
}

/**
 * Update user profile name
 */
export async function updateUserProfileName(
  userId: number,
  name: string
): Promise<void> {
  await db
    .update(schema.userProfile)
    .set({ name })
    .where(eq(schema.userProfile.id, userId));
}

/**
 * Get user settings
 */
export async function getUserSettings(userId: number): Promise<UserSettings> {
  const profile = await getUserProfileById(userId);
  if (!profile) {
    return defaultSettings;
  }

  try {
    const settings = JSON.parse(profile.settings ?? '{}');
    return { ...defaultSettings, ...settings };
  } catch {
    return defaultSettings;
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: number,
  settings: Partial<UserSettings>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  const mergedSettings = { ...currentSettings, ...settings };

  await db
    .update(schema.userProfile)
    .set({ settings: JSON.stringify(mergedSettings) })
    .where(eq(schema.userProfile.id, userId));
}

/**
 * Delete a user profile and all associated data
 */
export async function deleteUserProfile(userId: number): Promise<void> {
  // Due to cascade deletes, this will also delete:
  // - card_progress
  // - quiz_sessions (and quiz_attempts)
  // - user_stats
  // - daily_progress
  await db.delete(schema.userProfile).where(eq(schema.userProfile.id, userId));

  // Clear active user if it was this profile
  const activeUserId = await getAppState(ACTIVE_USER_KEY);
  if (activeUserId === userId.toString()) {
    await setAppState(ACTIVE_USER_KEY, '');
  }
}

/**
 * Get or create the default user profile
 * This is called during onboarding to ensure a profile exists
 */
export async function getOrCreateDefaultProfile(): Promise<UserProfile> {
  const active = await getActiveUserProfile();
  if (active) return active;

  // Check if any profiles exist
  const profiles = await getUserProfiles();
  if (profiles.length > 0) {
    // Set the first one as active
    await setActiveUserProfile(profiles[0].id);
    return profiles[0];
  }

  // Create a new default profile
  const profile = await createUserProfile('Player');
  await setActiveUserProfile(profile.id);
  return profile;
}

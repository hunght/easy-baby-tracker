import { eq } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';

/**
 * Get an app state value by key
 */
export async function getAppState(key: string): Promise<string | null> {
  const result = await db
    .select({ value: schema.appState.value })
    .from(schema.appState)
    .where(eq(schema.appState.key, key))
    .limit(1);

  return result[0]?.value ?? null;
}

/**
 * Set an app state value
 */
export async function setAppState(key: string, value: string): Promise<void> {
  await db.insert(schema.appState).values({ key, value }).onConflictDoUpdate({
    target: schema.appState.key,
    set: { value },
  });
}

/**
 * Delete an app state value
 */
export async function deleteAppState(key: string): Promise<void> {
  await db.delete(schema.appState).where(eq(schema.appState.key, key));
}

/**
 * Get all app state values
 */
export async function getAllAppState(): Promise<Record<string, string>> {
  const results = await db.select().from(schema.appState);
  return results.reduce(
    (acc, row) => {
      acc[row.key] = row.value ?? '';
      return acc;
    },
    {} as Record<string, string>
  );
}

import { eq } from 'drizzle-orm';

import { db } from '@/database/db';
import * as schema from '@/db/schema';

export async function getAppState(key: string): Promise<string | null> {
  const result = await db
    .select({ value: schema.appState.value })
    .from(schema.appState)
    .where(eq(schema.appState.key, key))
    .limit(1);

  return result[0]?.value ?? null;
}

export async function setAppState(key: string, value: string): Promise<void> {
  await db.insert(schema.appState).values({ key, value }).onConflictDoUpdate({
    target: schema.appState.key,
    set: { value },
  });
}

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'babyease.db';

// Initialize database synchronously on native platforms
const expoDb = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: false,
});

const db = drizzle(expoDb);

// Export instances directly - no Proxy needed on native
export { expoDb, db };

// Getters for compatibility
export function getExpoDb(): SQLiteDatabase {
  return expoDb;
}

export function getDb(): ReturnType<typeof drizzle> {
  return db;
}

// No-op initialization function for API compatibility with web
export async function initDatabase(): Promise<void> {
  // Database already initialized synchronously above
}

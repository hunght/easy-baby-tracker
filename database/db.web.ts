import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'babyease.db';

// Database instances
let _expoDb: SQLiteDatabase | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Wait for SQLite to be ready on web
 * This helps avoid race conditions with WASM loading
 */
async function waitForSQLiteReady(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Initialize database asynchronously (required for web)
 */
export async function initDatabase(): Promise<void> {
  if (_expoDb && _db) {
    return; // Already initialized
  }

  if (initPromise) {
    return initPromise; // Initialization in progress
  }

  initPromise = (async () => {
    try {
      // Wait for SQLite to be ready
      await waitForSQLiteReady();

      // Use async initialization on web to avoid timeout
      _expoDb = await openDatabaseAsync(DATABASE_NAME, {
        enableChangeListener: false,
      });

      _db = drizzle(_expoDb, {
        logger: {
          logQuery(query, params) {
            console.log('🔵 [query]', query, '📦 [params]', params);
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

// Getters that ensure initialization
export function getExpoDb(): SQLiteDatabase {
  if (!_expoDb) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _expoDb;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _db;
}

// Proxy exports for backward compatibility with synchronous access patterns
// These will throw if accessed before initDatabase() is called
export const expoDb: SQLiteDatabase = new Proxy(
  {},
  {
    get(_target, prop) {
      if (_expoDb) {
        return Reflect.get(_expoDb, prop);
      }
      throw new Error('Database not initialized on web. Ensure initDatabase() is called first.');
    },
  }
) as unknown as SQLiteDatabase;

export const db: ReturnType<typeof drizzle> = new Proxy(
  {},
  {
    get(_target, prop) {
      if (_db) {
        return Reflect.get(_db, prop);
      }
      throw new Error('Database not initialized on web. Ensure initDatabase() is called first.');
    },
  }
) as unknown as ReturnType<typeof drizzle>;

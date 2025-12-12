import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

export const DATABASE_NAME = 'babyease.db';

/**
 * Open database with web-specific options
 * On web, disable change listener as it's not needed and can cause issues
 */
const openDatabaseOptions = Platform.select({
  web: {
    enableChangeListener: false,
  },
  default: {
    enableChangeListener: false, // https://expo.dev/blog/modern-sqlite-for-react-native-apps we don't need change listener
  },
});

// Database instances
let _expoDb: SQLiteDatabase | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Wait for SQLite to be ready (especially important on web)
 */
async function waitForSQLiteReady(): Promise<void> {
  if (Platform.OS === 'web') {
    // On web, wait for the worker to initialize
    // This helps avoid race conditions with WASM loading
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Initialize database asynchronously (required for web compatibility)
 */
async function initDatabase(): Promise<void> {
  if (_expoDb && _db) {
    return; // Already initialized
  }

  if (initPromise) {
    return initPromise; // Initialization in progress
  }

  initPromise = (async () => {
    try {
      // Wait for SQLite to be ready on web
      await waitForSQLiteReady();

      if (Platform.OS === 'web') {
        // Use async initialization on web to avoid timeout
        _expoDb = await openDatabaseAsync(DATABASE_NAME, openDatabaseOptions);
      } else {
        // Use sync initialization on native for compatibility with existing code
        _expoDb = openDatabaseSync(DATABASE_NAME, openDatabaseOptions);
      }

      _db = drizzle(_expoDb);
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

// Export initialization function
export { initDatabase };

// For backward compatibility with existing code that expects synchronous access
// On web, these will proxy to the initialized instances
let _nativeExpoDb: SQLiteDatabase | null = null;
let _nativeDb: ReturnType<typeof drizzle> | null = null;

if (Platform.OS !== 'web') {
  _nativeExpoDb = openDatabaseSync(DATABASE_NAME, openDatabaseOptions);
  _nativeDb = drizzle(_nativeExpoDb);
}

// For backward compatibility with existing code that expects synchronous access
// On web, these will be initialized after initDatabase() is called
export const expoDb: SQLiteDatabase = Platform.OS === 'web'
  ? (new Proxy(
      {},
      {
        get(_target, prop) {
          if (_expoDb) {
            return Reflect.get(_expoDb, prop);
          }
          throw new Error('Database not initialized on web. Ensure initDatabase() is called first.');
        },
      }
    ) as unknown as SQLiteDatabase)
  : _nativeExpoDb!;

export const db: ReturnType<typeof drizzle> = Platform.OS === 'web'
  ? (new Proxy(
      {},
      {
        get(_target, prop) {
          if (_db) {
            return Reflect.get(_db, prop);
          }
          throw new Error('Database not initialized on web. Ensure initDatabase() is called first.');
        },
      }
    ) as unknown as ReturnType<typeof drizzle>)
  : _nativeDb!;

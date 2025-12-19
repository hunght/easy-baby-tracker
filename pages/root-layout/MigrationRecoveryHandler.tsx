import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { DATABASE_NAME, expoDb, getExpoDb } from '@/database/db';

// Database backup and recovery utilities
export async function backupDatabase(): Promise<string | null> {
  if (Platform.OS === 'web') {
    // Web uses IndexedDB, backup not supported via file system
    console.warn('Database backup not supported on web platform');
    return null;
  }

  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.error('Document directory not available');
      return null;
    }

    const dbDir = `${documentDir}SQLite/`;
    const dbPath = `${dbDir}${DATABASE_NAME}`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    if (!dbInfo.exists) {
      console.warn('Database file does not exist, nothing to backup');
      return null;
    }

    // Create backups directory if it doesn't exist
    const backupsDir = `${documentDir}database-backups/`;
    const backupsDirInfo = await FileSystem.getInfoAsync(backupsDir);
    if (!backupsDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupsDir, { intermediates: true });
    }

    // Create backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${backupsDir}${DATABASE_NAME}.backup.${timestamp}`;
    await FileSystem.copyAsync({ from: dbPath, to: backupPath });

    console.log(`Database backed up to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Failed to backup database:', error);
    return null;
  }
}

export async function resetDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    // On web, we need to delete the IndexedDB database and reinitialize
    try {
      console.log('Resetting database on web...');

      // First, try to drop all tables to clear data
      try {
        const dbInstance = getExpoDb();

        // Get all table names and drop them
        const tables = await dbInstance.getAllAsync<{ name: string }>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
        );

        for (const table of tables) {
          try {
            await dbInstance.execAsync(`DROP TABLE IF EXISTS "${table.name}"`);
            console.log(`Dropped table: ${table.name}`);
          } catch (dropError) {
            console.warn(`Failed to drop table ${table.name}:`, dropError);
          }
        }

        // Also reset migrations table
        try {
          await dbInstance.execAsync(`DROP TABLE IF EXISTS __drizzle_migrations`);
          console.log('Dropped migrations table');
        } catch (migrationError) {
          console.warn('Failed to drop migrations table:', migrationError);
        }

        // Close the connection
        await dbInstance.closeAsync();
        console.log('Database connection closed');
      } catch (closeError) {
        console.warn('Error closing database:', closeError);
      }

      // Wait a bit for connections to close
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Delete IndexedDB database
      return new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
          console.error('IndexedDB not available');
          // Fallback: just reload
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
          resolve();
          return;
        }

        console.log(`Attempting to delete IndexedDB database: ${DATABASE_NAME}`);
        const deleteRequest = indexedDB.deleteDatabase(DATABASE_NAME);

        deleteRequest.onsuccess = () => {
          console.log('IndexedDB database deleted successfully');
          // Reload the page to reinitialize everything
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              console.log('Reloading page...');
              window.location.reload();
            }, 500);
          }
          resolve();
        };

        deleteRequest.onerror = (event) => {
          console.error('Failed to delete IndexedDB database:', event);
          // Still try to reload - the database might be partially cleared
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              console.log('Reloading page despite deletion error...');
              window.location.reload();
            }, 500);
          }
          resolve(); // Resolve instead of reject to allow reload
        };

        deleteRequest.onblocked = () => {
          console.warn(
            'IndexedDB deletion blocked - database may be in use, will retry after reload'
          );
          // Still try to reload - next time it should work
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              console.log('Reloading page (deletion was blocked)...');
              window.location.reload();
            }, 1000);
          }
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to reset database on web:', error);
      // Fallback: try to reload anyway
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      throw error;
    }
  } else {
    // Native platforms: drop all tables
    const dbInstance = expoDb;

    try {
      console.log('Resetting database...');

      // Get all table names and drop them
      const tables = await dbInstance.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );

      for (const table of tables) {
        if (table.name !== '__drizzle_migrations') {
          await dbInstance.execAsync(`DROP TABLE IF EXISTS "${table.name}"`);
          console.log(`Dropped table: ${table.name}`);
        }
      }

      // Also reset migrations table to rerun all migrations
      await dbInstance.execAsync(`DROP TABLE IF EXISTS __drizzle_migrations`);
      console.log('Database reset complete');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }
}

// Component that handles migration recovery (backup and reset)
export function MigrationRecoveryHandler({
  error,
  children,
}: {
  error: Error | null;
  children: React.ReactNode;
}) {
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Handle migration errors by backing up and resetting database
  useEffect(() => {
    if (error && !recoveryAttempted && !isRecovering) {
      const handleRecovery = async () => {
        setIsRecovering(true);
        try {
          console.error('Migration error detected:', error.message);
          console.log('Attempting database recovery...');

          // Backup database first
          const backupPath = await backupDatabase();
          if (backupPath) {
            console.log(`Backup created at: ${backupPath}`);
          } else {
            console.warn('Backup failed or not supported, proceeding with reset anyway');
          }

          // Reset database
          await resetDatabase();

          console.log('Database recovery complete. Reload app to retry migrations.');
          setRecoveryAttempted(true);
          setRecoveryError(null);
        } catch (recoveryError) {
          console.error('Database recovery failed:', recoveryError);
          setRecoveryError(
            recoveryError instanceof Error ? recoveryError : new Error('Unknown recovery error')
          );
        } finally {
          setIsRecovering(false);
        }
      };

      handleRecovery();
    }
  }, [error, recoveryAttempted, isRecovering]);

  if (isRecovering) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database recovery in progress...</Text>
        <Text>Creating backup and resetting database...</Text>
      </View>
    );
  }

  if (recoveryError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration error: {error?.message}</Text>
        <Text>Recovery failed: {recoveryError.message}</Text>
        <Text>Please restart the app.</Text>
      </View>
    );
  }

  if (error) {
    if (recoveryAttempted) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Database has been reset.</Text>
          <Text>Please restart the app to retry migrations.</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration error: {error.message}</Text>
        <Text>Attempting recovery...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

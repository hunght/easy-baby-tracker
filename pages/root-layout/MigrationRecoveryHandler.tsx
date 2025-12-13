import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { DATABASE_NAME, expoDb, getExpoDb } from '@/database/db';

// Database backup and recovery utilities
async function backupDatabase(): Promise<string | null> {
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

async function resetDatabase(): Promise<void> {
  const dbInstance = Platform.OS === 'web' ? getExpoDb() : expoDb;

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

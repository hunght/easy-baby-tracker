// This file is used via React Native's platform-specific file resolution
// When importing MigrationHandler, React Native automatically picks up .web.tsx on web

import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { getDb, getExpoDb, DATABASE_NAME } from '@/database/db';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MigrationCompleteHandler } from './MigrationCompleteHandler';
import migrations from '../../drizzle/migrations';

// Migration timeout in milliseconds (10 seconds for web)
const MIGRATION_TIMEOUT = 10000;

// Set to true to simulate migration failure for testing recovery flow
const SIMULATE_MIGRATION_FAILURE = process.env.EXPO_PUBLIC_SIMULATE_MIGRATION_FAILURE === 'true';

// Query key for migrations
const MIGRATIONS_QUERY_KEY = ['migrations'] as const;

// Database backup and recovery utilities for web
async function backupDatabase(): Promise<string | null> {
  // Web uses IndexedDB, backup not supported via file system
  console.warn('Database backup not supported on web platform');
  return null;
}

async function resetDatabase(): Promise<void> {
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
}

async function performDatabaseRecovery(
  onStateChange?: (state: {
    isRecovering: boolean;
    recoveryAttempted: boolean;
    recoveryError: Error | null;
  }) => void
): Promise<{ success: boolean; error: Error | null }> {
  onStateChange?.({ isRecovering: true, recoveryAttempted: false, recoveryError: null });

  try {
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
    onStateChange?.({ isRecovering: false, recoveryAttempted: true, recoveryError: null });
    return { success: true, error: null };
  } catch (recoveryError) {
    console.error('Database recovery failed:', recoveryError);
    const error =
      recoveryError instanceof Error ? recoveryError : new Error('Unknown recovery error');
    onStateChange?.({ isRecovering: false, recoveryAttempted: false, recoveryError: error });
    return { success: false, error };
  }
}

// Component that handles migrations and Drizzle Studio (Web version)
// This component is only rendered after database is initialized
export function MigrationHandler({ children }: { children: React.ReactNode }) {
  // Set up Drizzle Studio (use getters for web)
  const dbInstance = getExpoDb();
  const drizzleDb = getDb();

  // Always call hooks unconditionally
  useDrizzleStudio(dbInstance);

  const [retryAfterRecovery, setRetryAfterRecovery] = useState(false);
  const [migrationStartTime, setMigrationStartTime] = useState(() => Date.now());
  const [isStuck, setIsStuck] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Run migrations using React Query for better error handling and retry
  // Include retryAfterRecovery in query key so query re-runs when it changes
  const {
    data: migrationSuccess,
    error: migrationError,
    isLoading: isMigrationLoading,
    isError: isMigrationError,
  } = useQuery({
    queryKey: [...MIGRATIONS_QUERY_KEY, retryAfterRecovery],
    queryFn: async () => {
      // Only simulate failure on first attempt (not after recovery)
      if (SIMULATE_MIGRATION_FAILURE && !retryAfterRecovery) {
        throw new Error('Simulated migration failure for testing');
      }

      // Run migrations
      await migrate(drizzleDb, migrations);
      return true;
    },
    retry: false, // We handle retry manually via recovery
    staleTime: Infinity, // Migrations should only run once
    gcTime: Infinity,
  });

  const success = migrationSuccess === true;
  const error = migrationError ?? null;

  // Log migration state changes for debugging
  useEffect(() => {
    console.log('[MigrationHandler] State:', {
      success,
      error: error?.message,
      isMigrationLoading,
      isMigrationError,
      elapsedSeconds,
      retryAfterRecovery,
    });
  }, [success, error, isMigrationLoading, isMigrationError, elapsedSeconds, retryAfterRecovery]);

  // Don't reset retryAfterRecovery - it's fine to keep it true
  // This prevents the query from re-running and simulating failure again

  // Detect stuck migrations with timeout and update elapsed time
  useEffect(() => {
    if (
      success ||
      (isMigrationError && !retryAfterRecovery) ||
      (isStuck && !retryAfterRecovery) ||
      (recoveryAttempted && !retryAfterRecovery)
    ) {
      return;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - migrationStartTime;
      const seconds = Math.floor(elapsed / 1000);
      setElapsedSeconds(seconds);

      if (elapsed > MIGRATION_TIMEOUT) {
        console.warn('Migration timeout detected - migrations appear to be stuck');
        setIsStuck(true);
      }
    };

    const interval = setInterval(updateProgress, 1000);
    updateProgress(); // Update immediately

    return () => clearInterval(interval);
  }, [
    success,
    isMigrationError,
    isStuck,
    recoveryAttempted,
    migrationStartTime,
    retryAfterRecovery,
  ]);

  // Handle stuck migrations by backing up and resetting database
  const handleRecovery = async () => {
    // Prevent multiple recovery attempts
    if (recoveryAttempted || isRecovering) {
      return;
    }

    console.error('Migration stuck detected - attempting database recovery...');
    await performDatabaseRecovery((state) => {
      setIsRecovering(state.isRecovering);
      setRecoveryAttempted(state.recoveryAttempted);
      setRecoveryError(state.recoveryError);

      // After successful recovery, set retryAfterRecovery to trigger query re-run
      // Don't reset it - it will stay true to prevent simulating failure again
      if (state.recoveryAttempted && !state.recoveryError) {
        setRetryAfterRecovery(true);
        setIsStuck(false);
        setElapsedSeconds(0);
        setMigrationStartTime(Date.now());
        // Query will automatically re-run when retryAfterRecovery changes (it's in the query key)
      }
    });
  };

  useEffect(() => {
    if (isStuck && !recoveryAttempted && !isRecovering) {
      handleRecovery();
    }
  }, [isStuck, recoveryAttempted, isRecovering]);

  // Handle migration errors by backing up and resetting database
  useEffect(() => {
    if (isMigrationError && error && !recoveryAttempted && !isRecovering && !isStuck) {
      console.error('Migration error detected - attempting database recovery...');
      handleRecovery();
    }
  }, [isMigrationError, error, recoveryAttempted, isRecovering, isStuck]);

  // Show recovery UI when stuck or recovering
  if (isRecovering) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-xl font-bold text-foreground">Recovering Database</Text>
        <Text className="text-center text-base text-muted-foreground">
          Creating backup and resetting database...
        </Text>
      </View>
    );
  }

  if (recoveryError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Text className="text-xl font-bold text-destructive">Recovery Failed</Text>
        <Text className="text-center text-base text-muted-foreground">
          Error: {recoveryError.message}
        </Text>
        <Text className="text-center text-sm text-muted-foreground">Please restart the app.</Text>
        <Button onPress={handleRecovery} variant="outline" className="mt-4">
          <Text>Retry Recovery</Text>
        </Button>
      </View>
    );
  }

  // After recovery, show retry message while migrations run again
  // Note: On web, resetDatabase() reloads the page, but this handles the case where it doesn't
  if (recoveryAttempted && retryAfterRecovery && !success) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-xl font-bold text-foreground">Retrying Migrations</Text>
        <Text className="text-center text-base text-muted-foreground">
          Database has been reset and backed up.
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Running migrations again...
        </Text>
      </View>
    );
  }

  // If recovery was attempted but page didn't reload (shouldn't happen on web, but handle it)
  if (recoveryAttempted && !retryAfterRecovery) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-xl font-bold text-foreground">Resetting Database</Text>
        <Text className="text-center text-base text-muted-foreground">
          Database is being reset...
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Page will reload automatically.
        </Text>
        <Button
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          variant="outline"
          className="mt-4">
          <Text>Reload Now</Text>
        </Button>
      </View>
    );
  }

  if (isMigrationLoading || (!success && !isStuck && !isMigrationError)) {
    const remainingSeconds = Math.max(
      0,
      Math.floor((MIGRATION_TIMEOUT - elapsedSeconds * 1000) / 1000)
    );
    const progressPercentage = Math.min((elapsedSeconds / (MIGRATION_TIMEOUT / 1000)) * 100, 100);
    const shouldShowWarning = elapsedSeconds >= Math.floor(MIGRATION_TIMEOUT / 1000) * 0.8; // Show warning in last 20%

    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-xl font-bold text-foreground">Migration in Progress</Text>
        <Text className="text-center text-base text-muted-foreground">
          Running database migrations...
        </Text>
        <View className="mt-4 w-full max-w-sm gap-2">
          <Progress value={progressPercentage} max={100} className="h-2" />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">Elapsed: {elapsedSeconds}s</Text>
            {shouldShowWarning && (
              <Text className="text-sm font-semibold text-orange-600">
                Auto-recovery in {remainingSeconds}s
              </Text>
            )}
          </View>
          {!shouldShowWarning && (
            <Text className="text-center text-xs text-muted-foreground">
              If this takes longer than {Math.floor(MIGRATION_TIMEOUT / 1000)} seconds, recovery
              will start automatically.
            </Text>
          )}
        </View>
      </View>
    );
  }

  // If there's an error but recovery hasn't been attempted yet, show error message
  if (isMigrationError && error && !recoveryAttempted && !isRecovering) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Text className="text-xl font-bold text-destructive">Migration Error</Text>
        <Text className="text-center text-base text-muted-foreground">Error: {error.message}</Text>
        <Text className="text-center text-sm text-muted-foreground">Attempting recovery...</Text>
      </View>
    );
  }

  // If migrations succeeded (including after recovery), proceed to complete handler
  // Only render when success is true AND not loading (to prevent race conditions)
  if (success && !isMigrationLoading) {
    return <MigrationCompleteHandler>{children}</MigrationCompleteHandler>;
  }

  // Should not reach here, but return loading state as fallback
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text className="text-xl font-bold text-foreground">Initializing...</Text>
    </View>
  );
}

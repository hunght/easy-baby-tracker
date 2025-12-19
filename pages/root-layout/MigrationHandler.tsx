import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { db, expoDb, getDb, getExpoDb } from '@/database/db';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MigrationRecoveryHandler,
  backupDatabase,
  resetDatabase,
} from './MigrationRecoveryHandler';
import { MigrationCompleteHandler } from './MigrationCompleteHandler';
import migrations from '../../drizzle/migrations';

// Migration timeout in milliseconds (30 seconds for native, 10 seconds for web)
const MIGRATION_TIMEOUT = Platform.OS === 'web' ? 10000 : 30000;

// Component that handles migrations and Drizzle Studio
// This component is only rendered after database is initialized
export function MigrationHandler({ children }: { children: React.ReactNode }) {
  // Set up Drizzle Studio (use getters for web compatibility)
  const dbInstance = Platform.OS === 'web' ? getExpoDb() : expoDb;
  const drizzleDb = Platform.OS === 'web' ? getDb() : db;

  // Always call hooks unconditionally
  useDrizzleStudio(dbInstance);

  // Run migrations - must be called unconditionally
  const { success, error } = useMigrations(drizzleDb, migrations);

  const [migrationStartTime] = useState(() => Date.now());
  const [isStuck, setIsStuck] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Log migration state changes for debugging
  useEffect(() => {
    console.log('[MigrationHandler] State:', { success, error: error?.message, elapsedSeconds });
  }, [success, error, elapsedSeconds]);

  // Detect stuck migrations with timeout and update elapsed time
  useEffect(() => {
    if (success || error || isStuck || recoveryAttempted) {
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
  }, [success, error, isStuck, recoveryAttempted, migrationStartTime]);

  // Handle stuck migrations by backing up and resetting database
  const handleRecovery = async () => {
    setIsRecovering(true);
    try {
      console.error('Migration stuck detected - attempting database recovery...');
      console.log('Backing up database before reset...');

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

  useEffect(() => {
    if (isStuck && !recoveryAttempted && !isRecovering) {
      handleRecovery();
    }
  }, [isStuck, recoveryAttempted, isRecovering]);

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

  if (recoveryAttempted) {
    if (Platform.OS === 'web') {
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
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Text className="text-xl font-bold text-foreground">Database Reset Complete</Text>
        <Text className="text-center text-base text-muted-foreground">
          Database has been reset and backed up.
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Please restart the app to retry migrations.
        </Text>
      </View>
    );
  }

  if (!success && !isStuck) {
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

  return (
    <MigrationRecoveryHandler error={error ?? null}>
      <MigrationCompleteHandler>{children}</MigrationCompleteHandler>
    </MigrationRecoveryHandler>
  );
}

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Platform, Text, View } from 'react-native';

import { db, expoDb, getDb, getExpoDb } from '@/database/db';
import { MigrationRecoveryHandler } from './MigrationRecoveryHandler';
import { MigrationCompleteHandler } from './MigrationCompleteHandler';
import migrations from '../../drizzle/migrations';

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

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration is in progress...</Text>
      </View>
    );
  }

  return (
    <MigrationRecoveryHandler error={error ?? null}>
      <MigrationCompleteHandler>{children}</MigrationCompleteHandler>
    </MigrationRecoveryHandler>
  );
}

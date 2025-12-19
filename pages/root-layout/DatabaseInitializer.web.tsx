// This file is used via React Native's platform-specific file resolution
// When importing DatabaseInitializer, React Native automatically picks up .web.tsx on web

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { initDatabase } from '@/database/db';
import { MigrationHandler } from './MigrationHandler';

// Component that initializes database on web before migrations
export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialize database on web before migrations
  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('Database initialization failed:', error);
        setInitError(error);
      });
  }, []);

  // Wait for database initialization on web
  if (!dbInitialized) {
    if (initError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Database initialization error: {initError.message}</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing database...</Text>
      </View>
    );
  }

  return <MigrationHandler>{children}</MigrationHandler>;
}

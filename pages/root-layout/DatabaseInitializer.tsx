import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { initDatabase } from '@/database/db';
import { MigrationHandler } from './MigrationHandler';

// Component that initializes database on web
export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const [dbInitialized, setDbInitialized] = useState(Platform.OS !== 'web');
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialize database on web before migrations
  useEffect(() => {
    if (Platform.OS === 'web') {
      initDatabase()
        .then(() => {
          setDbInitialized(true);
        })
        .catch((error) => {
          console.error('Database initialization failed:', error);
          setInitError(error);
        });
    }
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

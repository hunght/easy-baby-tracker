import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { seedWords, hasWords } from '@/database/seed-words';

// Component that runs after migrations are complete
export function MigrationCompleteHandler({ children }: { children: React.ReactNode }) {
  const [isSeeding, setIsSeeding] = useState(true);

  useEffect(() => {
    const seedIfNeeded = async () => {
      try {
        // Check if database already has words
        const wordsExist = await hasWords();

        if (!wordsExist) {
          console.log('No words found, seeding database...');
          const insertedCount = await seedWords();
          console.log(`Seeded ${insertedCount} words`);
        } else {
          console.log('Words already exist, skipping seed');
        }
      } catch (error) {
        console.error('Failed to seed words:', error);
      } finally {
        setIsSeeding(false);
      }
    };

    seedIfNeeded();
  }, []);

  if (isSeeding) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#5B7FFF" />
        <Text className="mt-4 text-muted-foreground">Setting up word database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

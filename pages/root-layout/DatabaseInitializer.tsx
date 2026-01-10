import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';

import { api } from '@/convex/_generated/api';

import { ConvexAuthProvider } from './ConvexAuthProvider';
import { NotificationSyncProvider } from './NotificationSyncProvider';

// Inner component that runs seeding after auth is ready
function DataSeeder({ children }: { children: React.ReactNode }) {
  const seedStatus = useQuery(api.seed.checkSeedStatus);
  const seedAll = useMutation(api.seed.seedAll);
  const hasSeeded = useRef(false);

  useEffect(() => {
    // Only seed once, and only if needed
    if (hasSeeded.current) return;
    if (!seedStatus) return; // Still loading

    const needsSeeding = seedStatus.needsHabits || seedStatus.needsFormulas;

    if (needsSeeding) {
      hasSeeded.current = true;
      console.log('🌱 Seeding database...', {
        needsHabits: seedStatus.needsHabits,
        needsFormulas: seedStatus.needsFormulas,
      });

      seedAll()
        .then((result) => {
          console.log('✅ Database seeded:', result);
        })
        .catch((error) => {
          console.error('❌ Failed to seed database:', error);
        });
    } else {
      console.log('✅ Database already seeded:', {
        habits: seedStatus.habitsCount,
        formulas: seedStatus.formulasCount,
      });
    }
  }, [seedStatus, seedAll]);

  return <NotificationSyncProvider>{children}</NotificationSyncProvider>;
}

// Component that initializes database and auth
// Now using Convex instead of Supabase
export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <DataSeeder>{children}</DataSeeder>
    </ConvexAuthProvider>
  );
}

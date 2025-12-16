import { eq } from 'drizzle-orm';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { db } from '@/database/db';
import { appState } from '@/db/schema';

export type FeatureKey =
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'habit'
  | 'health'
  | 'growth'
  | 'diary'
  | 'pumping';

type FeatureFlags = Record<FeatureKey, boolean>;

const DEFAULT_FLAGS: FeatureFlags = {
  feeding: true,
  diaper: true,
  sleep: true,
  habit: true,
  health: true,
  growth: true,
  diary: true,
  pumping: true,
};

type FeatureFlagContextType = {
  features: FeatureFlags;
  toggleFeature: (key: FeatureKey) => Promise<void>;
  isLoading: boolean;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

const APP_STATE_KEY = 'enabled_features';

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load flags on mount
  useEffect(() => {
    async function loadFlags() {
      try {
        const [result] = await db.select().from(appState).where(eq(appState.key, APP_STATE_KEY));

        if (result && result.value) {
          const savedFlags = JSON.parse(result.value);
          setFeatures({ ...DEFAULT_FLAGS, ...savedFlags });
        }
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFlags();
  }, []);

  const toggleFeature = async (key: FeatureKey) => {
    const newFeatures = { ...features, [key]: !features[key] };
    setFeatures(newFeatures);

    try {
      await db
        .insert(appState)
        .values({
          key: APP_STATE_KEY,
          value: JSON.stringify(newFeatures),
        })
        .onConflictDoUpdate({
          target: appState.key,
          set: { value: JSON.stringify(newFeatures) },
        });
    } catch (error) {
      console.error('Failed to save feature flags:', error);
      // Revert on error? For now, we trust local state is optimistically updated
    }
  };

  return (
    <FeatureFlagContext.Provider value={{ features, toggleFeature, isLoading }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

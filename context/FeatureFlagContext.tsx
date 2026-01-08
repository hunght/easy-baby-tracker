import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { getAppState, setAppState } from '@/database/app-state';

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

// Zod schema for FeatureFlags validation
const featureFlagsSchema = z.object({
  feeding: z.boolean(),
  diaper: z.boolean(),
  sleep: z.boolean(),
  habit: z.boolean(),
  health: z.boolean(),
  growth: z.boolean(),
  diary: z.boolean(),
  pumping: z.boolean(),
});

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FLAGS);

  // Load flags with useQuery
  const { data: savedFeatures, isLoading } = useQuery({
    queryKey: [APP_STATE_KEY],
    queryFn: async () => {
      const value = await getAppState(APP_STATE_KEY);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          const result = featureFlagsSchema.safeParse(parsed);
          if (result.success) {
            return result.data;
          }
        } catch {
          // JSON parsing failed - return null
        }
      }
      return null;
    },
  });

  // Sync state with query data
  useEffect(() => {
    if (savedFeatures) {
      setFeatures((prev) => ({ ...prev, ...savedFeatures }));
    }
  }, [savedFeatures]);

  const toggleFeature = async (key: FeatureKey) => {
    const newFeatures = { ...features, [key]: !features[key] };
    setFeatures(newFeatures);

    try {
      await setAppState(APP_STATE_KEY, JSON.stringify(newFeatures));
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

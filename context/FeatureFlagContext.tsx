import React, { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { z } from "zod";

import { api } from "@/convex/_generated/api";

export type FeatureKey =
  | "feeding"
  | "diaper"
  | "sleep"
  | "habit"
  | "health"
  | "growth"
  | "diary"
  | "pumping";

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

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(
  undefined
);

const APP_STATE_KEY = "enabled_features";

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

export function FeatureFlagProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FLAGS);

  // Load flags with Convex useQuery
  const savedState = useQuery(api.appState.get, { key: APP_STATE_KEY });
  const setAppState = useMutation(api.appState.set);

  const isLoading = savedState === undefined;

  // Parse saved features (savedState is the value string directly from Convex)
  useEffect(() => {
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const result = featureFlagsSchema.safeParse(parsed);
        if (result.success) {
          setFeatures((prev) => ({ ...prev, ...result.data }));
        }
      } catch {
        // JSON parsing failed - use defaults
      }
    }
  }, [savedState]);

  const toggleFeature = async (key: FeatureKey) => {
    const newFeatures = { ...features, [key]: !features[key] };
    setFeatures(newFeatures);

    try {
      await setAppState({
        key: APP_STATE_KEY,
        value: JSON.stringify(newFeatures),
      });
    } catch (error) {
      console.error("Failed to save feature flags:", error);
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
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }
  return context;
}

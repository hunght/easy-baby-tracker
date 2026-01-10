import { ConvexReactClient } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
      "Run 'npx convex dev' to get your Convex URL."
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  // Required for React Native - disable browser-specific features
  unsavedChangesWarning: false,
});

/**
 * Type-safe ID casting for Convex IDs from route params.
 * Route params are strings, but Convex expects typed IDs.
 * This provides a single place for this unavoidable type assertion.
 */
type TableNames =
  | "babyProfiles"
  | "feedings"
  | "sleepSessions"
  | "diaperChanges"
  | "pumpings"
  | "growthRecords"
  | "healthRecords"
  | "diaryEntries";

export function toId<T extends TableNames>(
  value: string | undefined | null
): Id<T> | undefined {
  if (!value) return undefined;
  return value as unknown as Id<T>;
}

export function toIdRequired<T extends TableNames>(value: string): Id<T> {
  return value as unknown as Id<T>;
}

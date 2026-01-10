import { ConvexReactClient } from "convex/react";

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

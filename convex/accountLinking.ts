import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/**
 * Link an anonymous account's data to an authenticated account.
 * This migrates all baby profiles and associated data from the anonymous user
 * to the authenticated user, allowing users to keep their data after signing in.
 */
export const linkAnonymousData = mutation({
  args: {
    anonymousUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const { anonymousUserId } = args;

    // Don't link if it's the same user
    if (userId === anonymousUserId) {
      return { linked: false, reason: 'Same user' };
    }

    // Get all baby profiles owned by the anonymous user
    const anonymousProfiles = await ctx.db
      .query('babyProfiles')
      .withIndex('by_user', (q) => q.eq('userId', anonymousUserId))
      .collect();

    if (anonymousProfiles.length === 0) {
      return { linked: false, reason: 'No profiles to migrate' };
    }

    // Migrate each profile and its associated data
    for (const profile of anonymousProfiles) {
      // Update the profile's userId
      await ctx.db.patch(profile._id, { userId });

      // No need to migrate related data (feedings, sleep, etc.) as they reference babyId, not userId
    }

    // Migrate app state (like active profile selection)
    const anonymousAppStates = await ctx.db
      .query('appState')
      .withIndex('by_user', (q) => q.eq('userId', anonymousUserId))
      .collect();

    for (const state of anonymousAppStates) {
      // Check if the authenticated user already has this state key
      const existingState = await ctx.db
        .query('appState')
        .withIndex('by_user_key', (q) => q.eq('userId', userId).eq('key', state.key))
        .first();

      if (!existingState) {
        // Migrate the state to the new user
        await ctx.db.patch(state._id, { userId });
      } else {
        // Delete the anonymous state since authenticated user already has one
        await ctx.db.delete(state._id);
      }
    }

    console.log(
      `Linked ${anonymousProfiles.length} profiles from anonymous user to authenticated user`
    );

    return {
      linked: true,
      profilesLinked: anonymousProfiles.length,
    };
  },
});

/**
 * Check if the current user has data that could be migrated
 * (useful for showing migration prompts)
 */
export const checkMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { hasData: false };
    }

    const profiles = await ctx.db
      .query('babyProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return {
      hasData: profiles.length > 0,
      profileCount: profiles.length,
    };
  },
});

/**
 * Admin function to manually transfer data from one user to another.
 * Use this to link anonymous user data to an authenticated account.
 */
export const manuallyLinkAccounts = mutation({
  args: {
    fromUserId: v.string(),
    toUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { fromUserId, toUserId } = args;

    // Get all baby profiles owned by the source user
    const sourceProfiles = await ctx.db
      .query('babyProfiles')
      .withIndex('by_user', (q) => q.eq('userId', fromUserId))
      .collect();

    console.log(
      `Found ${sourceProfiles.length} profiles to migrate from ${fromUserId} to ${toUserId}`
    );

    // Migrate each profile
    for (const profile of sourceProfiles) {
      await ctx.db.patch(profile._id, { userId: toUserId });
      console.log(`Migrated profile: ${profile.nickname}`);
    }

    // Migrate app state
    const sourceAppStates = await ctx.db
      .query('appState')
      .withIndex('by_user', (q) => q.eq('userId', fromUserId))
      .collect();

    for (const state of sourceAppStates) {
      const existingState = await ctx.db
        .query('appState')
        .withIndex('by_user_key', (q) => q.eq('userId', toUserId).eq('key', state.key))
        .first();

      if (!existingState) {
        await ctx.db.patch(state._id, { userId: toUserId });
      } else {
        await ctx.db.delete(state._id);
      }
    }

    return {
      success: true,
      profilesMigrated: sourceProfiles.length,
      appStatesMigrated: sourceAppStates.length,
    };
  },
});

/**
 * List all users with their profiles (for debugging)
 */
export const listUsersWithProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const allProfiles = await ctx.db.query('babyProfiles').collect();

    // Group by userId
    const userMap = new Map<string, { profiles: string[]; isAnonymous: boolean }>();

    for (const profile of allProfiles) {
      const userId = profile.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, { profiles: [], isAnonymous: true });
      }
      userMap.get(userId)!.profiles.push(profile.nickname);
    }

    // Check auth users to determine if anonymous
    const users = await ctx.db.query('users').collect();
    for (const user of users) {
      // User table may have email field from auth providers
      const hasEmail =
        user != null &&
        typeof user === 'object' &&
        'email' in user &&
        typeof user.email === 'string';
      if (userMap.has(user._id)) {
        userMap.get(user._id)!.isAnonymous = !hasEmail;
      }
    }

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      profiles: data.profiles,
      isAnonymous: data.isAnonymous,
    }));
  },
});

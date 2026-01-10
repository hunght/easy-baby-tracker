import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the current user's authentication status
 * Returns whether the user is anonymous (no email) or authenticated with email
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the user from the auth tables
    const user = await ctx.db.get(userId);

    if (!user) {
      return { isAnonymous: true, email: null };
    }

    // Check if the user has an email (authenticated users have email)
    const email = (user as any).email;
    const isAnonymous = !email;

    return {
      isAnonymous,
      email: email || null,
      userId: userId,
    };
  },
});

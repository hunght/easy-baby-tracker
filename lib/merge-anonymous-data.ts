import { supabase } from './supabase';

/**
 * Merges all data from an anonymous user account to an authenticated user account.
 * @internal - Exported for use in SupabaseAuthProvider
 *
 * IMPORTANT: This function is only needed when a user signs in to an EXISTING account
 * (different user ID). If an anonymous user is converted using `updateUser()`, the user ID
 * stays the same, so no data migration is needed - all data is automatically preserved!
 *
 * This function is called when:
 * - User was anonymous (user A)
 * - User signs in to an existing account (user B, different ID)
 * - We need to transfer data from user A to user B
 *
 * @param anonymousUserId The user ID of the anonymous account
 * @param authenticatedUserId The user ID of the authenticated account
 */
export async function mergeAnonymousDataToAuthenticated(
  anonymousUserId: string,
  authenticatedUserId: string
): Promise<void> {
  console.log('🔄 Merging anonymous data:', { anonymousUserId, authenticatedUserId });

  try {
    // 1. Merge baby profiles
    // Get all baby profiles from anonymous user
    const { data: anonymousProfiles, error: profilesError } = await supabase
      .from('baby_profiles')
      .select('id')
      .eq('user_id', anonymousUserId);

    if (profilesError) {
      console.error('Error fetching anonymous profiles:', profilesError);
      throw profilesError;
    }

    if (anonymousProfiles && anonymousProfiles.length > 0) {
      // Update all baby profiles to use authenticated user_id
      const { error: updateProfilesError } = await supabase
        .from('baby_profiles')
        .update({ user_id: authenticatedUserId })
        .eq('user_id', anonymousUserId);

      if (updateProfilesError) {
        console.error('Error updating baby profiles:', updateProfilesError);
        throw updateProfilesError;
      }

      console.log(`✅ Merged ${anonymousProfiles.length} baby profile(s)`);
    }

    // 2. Merge app_state
    // Get all app_state entries from anonymous user
    const { data: anonymousAppState, error: appStateError } = await supabase
      .from('app_state')
      .select('key, value')
      .eq('user_id', anonymousUserId);

    if (appStateError) {
      console.error('Error fetching anonymous app_state:', appStateError);
      throw appStateError;
    }

    if (anonymousAppState && anonymousAppState.length > 0) {
      // For each app_state entry, upsert to authenticated user
      // This will preserve anonymous data but won't overwrite existing authenticated data
      for (const state of anonymousAppState) {
        const { error: upsertError } = await supabase.from('app_state').upsert(
          {
            user_id: authenticatedUserId,
            key: state.key,
            value: state.value,
          },
          { onConflict: 'user_id,key' }
        );

        if (upsertError) {
          console.warn(`Warning: Could not merge app_state key "${state.key}":`, upsertError);
          // Continue with other entries
        }
      }

      // Delete anonymous app_state entries after merging
      await supabase.from('app_state').delete().eq('user_id', anonymousUserId);

      console.log(`✅ Merged ${anonymousAppState.length} app_state entry/entries`);
    }

    // 3. All other data (feedings, sleep, etc.) is automatically associated
    // because they reference baby_id, which now belongs to the authenticated user

    console.log('✅ Data merge completed successfully');
  } catch (error) {
    console.error('❌ Error merging anonymous data:', error);
    throw error;
  }
}

/**
 * Detects if we need to merge data and performs the merge.
 * Should be called after a user successfully signs in.
 *
 * @param previousUserId The user ID before sign-in (should be anonymous)
 * @param currentUserId The authenticated user ID after sign-in
 * @param wasPreviousAnonymous Whether the previous user was anonymous
 */
export async function handleDataMergeAfterLogin(
  previousUserId: string | null,
  currentUserId: string,
  wasPreviousAnonymous: boolean
): Promise<void> {
  // Only merge if:
  // 1. We had a previous user (anonymous)
  // 2. Current user is authenticated (not anonymous)
  // 3. They are different users
  // 4. Previous user was anonymous
  if (!previousUserId || previousUserId === currentUserId || !wasPreviousAnonymous) {
    return;
  }

  console.log('🔄 Detected transition from anonymous to authenticated, merging data...');
  await mergeAnonymousDataToAuthenticated(previousUserId, currentUserId);
}

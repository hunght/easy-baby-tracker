import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import type { Database } from './supabase-types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Sign in anonymously. Creates a new anonymous user if no session exists.
 * Anonymous users can be upgraded to full users later.
 */
export async function signInAnonymously() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    console.log(
      '🔐 Existing session found:',
      session.user.id,
      session.user.is_anonymous ? '(anonymous)' : ''
    );
    return session;
  }

  console.log('🔐 No session found, signing in anonymously...');
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('🔐 Anonymous sign-in error:', error);
    throw error;
  }

  console.log('🔐 Signed in anonymously:', data.session?.user.id);
  return data.session;
}

/**
 * Get current user ID. Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Require current user ID. Throws if not authenticated.
 */
export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Sign out the current user and sign in anonymously.
 * This clears the authenticated session and creates a new anonymous session.
 */
export async function signOut(): Promise<void> {
  console.log('🔐 Signing out...');
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('🔐 Sign out error:', error);
    throw error;
  }

  // After sign out, sign in anonymously to maintain app functionality
  console.log('🔐 Signing in anonymously after logout...');
  await signInAnonymously();
  console.log('🔐 Signed out and signed in anonymously');
}

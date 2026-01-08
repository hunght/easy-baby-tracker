import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { supabase, signInAnonymously } from '@/lib/supabase';
import { handleDataMergeAfterLogin } from '@/lib/merge-anonymous-data';

// ============================================
// AUTH CONTEXT
// ============================================

type SupabaseAuthContextType = {
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  session: null,
  user: null,
  isAnonymous: true,
  isLoading: true,
});

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const wasPreviousAnonymousRef = useRef<boolean>(false);
  const queryClient = useQueryClient();

  // Initialize auth on mount
  const { isLoading, error } = useQuery({
    queryKey: ['supabase-auth-init'],
    queryFn: async () => {
      console.log('🔐 Initializing Supabase auth...');
      const session = await signInAnonymously();
      setSession(session);
      previousUserIdRef.current = session?.user?.id ?? null;
      wasPreviousAnonymousRef.current = session?.user?.is_anonymous ?? false;
      return true;
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Listen for auth state changes and handle data merging
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id ?? 'no user');

      const previousUserId = previousUserIdRef.current;
      const wasPreviousAnonymous = wasPreviousAnonymousRef.current;
      const currentUserId = session?.user?.id ?? null;
      const isCurrentAnonymous = session?.user?.is_anonymous ?? false;

      // Handle data merge when user signs in to an EXISTING account (different user ID)
      // Note: If anonymous user is converted using updateUser(), the user ID stays the same,
      // so no merge is needed - data is automatically preserved!
      if (
        event === 'SIGNED_IN' &&
        currentUserId &&
        previousUserId &&
        previousUserId !== currentUserId &&
        wasPreviousAnonymous &&
        !isCurrentAnonymous
      ) {
        try {
          // User signed in to an existing account while previously anonymous
          // Need to merge data from anonymous account to authenticated account
          await handleDataMergeAfterLogin(previousUserId, currentUserId, wasPreviousAnonymous);
          // Invalidate all queries to refetch data after merge
          queryClient.invalidateQueries();
        } catch (error) {
          console.error('Failed to merge anonymous data:', error);
          // Don't block the sign-in process if merge fails
        }
      } else if (
        event === 'TOKEN_REFRESHED' &&
        wasPreviousAnonymous &&
        !isCurrentAnonymous &&
        previousUserId === currentUserId
      ) {
        // Anonymous user was converted to permanent user using updateUser()
        // User ID is the same, so no data migration needed - all data is already linked!
        console.log('✅ Anonymous user converted to permanent user (same ID, no migration needed)');
        queryClient.invalidateQueries();
      }

      // Update refs and session
      previousUserIdRef.current = currentUserId;
      wasPreviousAnonymousRef.current = isCurrentAnonymous;
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-xl font-bold text-foreground">Setting up your account...</Text>
        <Text className="text-center text-base text-muted-foreground">
          This will only take a moment
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Text className="text-xl font-bold text-destructive">Authentication Error</Text>
        <Text className="text-center text-base text-muted-foreground">{error.message}</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Please check your internet connection and restart the app.
        </Text>
      </View>
    );
  }

  const contextValue: SupabaseAuthContextType = {
    session,
    user: session?.user ?? null,
    isAnonymous: session?.user?.is_anonymous ?? true,
    isLoading: false,
  };

  return (
    <SupabaseAuthContext.Provider value={contextValue}>{children}</SupabaseAuthContext.Provider>
  );
}

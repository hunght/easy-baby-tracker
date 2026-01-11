import { ConvexAuthProvider as ConvexAuthProviderBase, useAuthToken } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { convex } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { Text } from '@/components/ui/text';

// ============================================
// SECURE STORAGE FOR REACT NATIVE
// ============================================

const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors
    }
  },
};

// ============================================
// AUTH CONTEXT
// ============================================

type ConvexAuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
};

const ConvexAuthContext = createContext<ConvexAuthContextType>({
  isLoading: true,
  isAuthenticated: false,
  userEmail: null,
});

export function useConvexAuth() {
  return useContext(ConvexAuthContext);
}

// ============================================
// LOADING SCREEN
// ============================================

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text className="text-xl font-bold text-foreground">Loading...</Text>
    </View>
  );
}

// ============================================
// AUTH INITIALIZER (INNER COMPONENT)
// ============================================

function AuthInitializer({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = token !== null;

  // Query to get user info (only when authenticated)
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');

  // Initialize - just check if we have a stored token
  useEffect(() => {
    // Give a moment for token to load from storage
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Log when auth state changes
  const userEmail = currentUser?.email ?? null;
  useEffect(() => {
    console.log('🔑 Auth state:', {
      authenticated: isAuthenticated,
      email: userEmail,
    });
  }, [isAuthenticated, userEmail]);

  // Show loading while initializing
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Provide auth context to children
  const contextValue: ConvexAuthContextType = {
    isLoading: false,
    isAuthenticated,
    userEmail,
  };

  return <ConvexAuthContext.Provider value={contextValue}>{children}</ConvexAuthContext.Provider>;
}

// ============================================
// MAIN PROVIDER COMPONENT
// ============================================

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProviderBase client={convex} storage={secureStorage}>
      <AuthInitializer>{children}</AuthInitializer>
    </ConvexAuthProviderBase>
  );
}

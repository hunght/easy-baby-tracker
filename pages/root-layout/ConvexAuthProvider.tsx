import {
  ConvexAuthProvider as ConvexAuthProviderBase,
  useAuthActions,
  useAuthToken,
} from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { convex } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

// Key for storing anonymous user ID
const ANONYMOUS_USER_ID_KEY = "anonymous_user_id";

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
  isAnonymous: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  anonymousUserId: string | null;
  clearAnonymousUserId: () => Promise<void>;
};

const ConvexAuthContext = createContext<ConvexAuthContextType>({
  isAnonymous: true,
  isLoading: true,
  isAuthenticated: false,
  anonymousUserId: null,
  clearAnonymousUserId: async () => {},
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
      <Text className="text-xl font-bold text-foreground">
        Setting up your account...
      </Text>
      <Text className="text-center text-base text-muted-foreground">
        This will only take a moment
      </Text>
    </View>
  );
}

// ============================================
// ERROR SCREEN
// ============================================

function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
      <Text className="text-xl font-bold text-destructive">
        Authentication Error
      </Text>
      <Text className="text-center text-base text-muted-foreground">
        {message}
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        Please check your internet connection and restart the app.
      </Text>
    </View>
  );
}

// ============================================
// AUTH INITIALIZER (INNER COMPONENT)
// ============================================

function AuthInitializer({ children }: { children: ReactNode }) {
  const { signIn } = useAuthActions();
  const token = useAuthToken();
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasAttemptedSignIn, setHasAttemptedSignIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);

  const isAuthenticated = token !== null;

  // Query to get user info and determine if anonymous
  const currentUser = useQuery(api.users.getCurrentUser);
  const isAnonymous = currentUser?.isAnonymous ?? true;

  // Clear anonymous user ID after successful account linking
  const clearAnonymousUserId = useCallback(async () => {
    await SecureStore.deleteItemAsync(ANONYMOUS_USER_ID_KEY);
    setAnonymousUserId(null);
  }, []);

  // Load stored anonymous user ID on mount
  useEffect(() => {
    SecureStore.getItemAsync(ANONYMOUS_USER_ID_KEY).then((storedId) => {
      if (storedId) {
        setAnonymousUserId(storedId);
      }
    });
  }, []);

  // Store anonymous user ID when authenticated as anonymous
  useEffect(() => {
    if (currentUser?.isAnonymous && currentUser?.userId) {
      SecureStore.setItemAsync(ANONYMOUS_USER_ID_KEY, currentUser.userId);
      setAnonymousUserId(currentUser.userId);
    }
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // If already authenticated, we're done
      if (isAuthenticated) {
        console.log("✅ Already authenticated");
        if (mounted) {
          setIsInitializing(false);
        }
        return;
      }

      // If we've already tried to sign in, don't try again
      if (hasAttemptedSignIn) {
        return;
      }

      try {
        console.log("🔐 Initiating Convex anonymous sign-in...");
        setHasAttemptedSignIn(true);
        const result = await signIn("anonymous");
        console.log("✅ Anonymous sign-in completed, signingIn:", result.signingIn);

        // Give it a moment for the token to be stored
        setTimeout(() => {
          if (mounted) {
            setIsInitializing(false);
          }
        }, 500);
      } catch (err) {
        console.error("❌ Anonymous sign-in failed:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Authentication failed")
          );
          setIsInitializing(false);
        }
      }
    }

    // Small delay on first load to let provider initialize
    const timer = setTimeout(() => {
      initAuth();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [signIn, isAuthenticated, hasAttemptedSignIn]);

  // Log when auth state changes
  const userEmail = currentUser?.email ?? null;
  useEffect(() => {
    console.log("🔑 Auth state:", {
      authenticated: isAuthenticated,
      isAnonymous,
      email: userEmail,
    });
  }, [isAuthenticated, isAnonymous, userEmail]);

  // Show error state
  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  // Show loading while initializing or waiting for auth
  if (isInitializing || (!isAuthenticated && hasAttemptedSignIn)) {
    return <LoadingScreen />;
  }

  // If authenticated, render children with context
  if (isAuthenticated) {
    const contextValue: ConvexAuthContextType = {
      isAnonymous,
      isLoading: false,
      isAuthenticated: true,
      anonymousUserId,
      clearAnonymousUserId,
    };

    return (
      <ConvexAuthContext.Provider value={contextValue}>
        {children}
      </ConvexAuthContext.Provider>
    );
  }

  // Fallback loading screen
  return <LoadingScreen />;
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

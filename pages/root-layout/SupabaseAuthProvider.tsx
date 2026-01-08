import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { supabase, signInAnonymously } from '@/lib/supabase';

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

    // Initialize auth on mount
    const { isLoading, error } = useQuery({
        queryKey: ['supabase-auth-init'],
        queryFn: async () => {
            console.log('🔐 Initializing Supabase auth...');
            const session = await signInAnonymously();
            setSession(session);
            return true;
        },
        retry: 3,
        retryDelay: 1000,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    // Listen for auth state changes
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('🔐 Auth state changed:', _event, session?.user?.id ?? 'no user');
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
                <Text className="text-center text-base text-muted-foreground">
                    {error.message}
                </Text>
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
        <SupabaseAuthContext.Provider value={contextValue}>
            {children}
        </SupabaseAuthContext.Provider>
    );
}

import { SupabaseAuthProvider } from './SupabaseAuthProvider';

// Component that initializes database and auth
// Now using Supabase instead of local SQLite migrations
export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

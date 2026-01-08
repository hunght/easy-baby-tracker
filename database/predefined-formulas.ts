import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase-types';

type FormulaRuleInsert = Database['public']['Tables']['easy_formula_rules']['Insert'];

/**
 * Seed predefined formula rules - called during migration or first app load
 */
export async function seedPredefinedFormulas(): Promise<void> {
  console.log('Seeding is now handled by Supabase SQL migration.');
  // No-op: Seeding is done via SQL migration to bypass RLS restrictions on client
}

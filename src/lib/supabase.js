import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase now issues publishable keys; older projects use anon keys.
// Accept either name so both setups work.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Client is null until env vars are set — UI must handle that state
// instead of crashing or inventing fake data.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

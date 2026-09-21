import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Client is null until env vars are set — UI must handle that state
// instead of crashing or inventing fake data.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

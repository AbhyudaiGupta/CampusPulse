import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_project_url" &&
    supabaseAnonKey !== "your_supabase_anon_key"
);

/**
 * Client-side Supabase client singleton for browser usage.
 * Gracefully returns null when Supabase is not configured yet,
 * allowing full demo mode with mock data without crashing.
 */
export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  : null;

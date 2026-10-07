import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_project_url" &&
    supabaseAnonKey !== "your_supabase_anon_key"
);

export const isServiceRoleConfigured = Boolean(
  supabaseUrl &&
    serviceRoleKey &&
    serviceRoleKey !== "your_supabase_service_role_key"
);

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers using request cookies.
 */
export async function createServerSupabaseClient() {
  if (!isServerSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Route handler or Server Component cookie write guard
        }
      },
    },
  });
}

/**
 * Creates an elevated Supabase client with the service role key.
 * STRICT SECURITY: ONLY callable inside secure server API route handlers.
 * NEVER expose this or import this in any client component.
 */
export function getServiceRoleClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured) {
    return null;
  }

  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

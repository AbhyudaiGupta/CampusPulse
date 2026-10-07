"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useApp, type UserSession } from "@/context/AppContext";

export interface CurrentUserResult {
  user: UserSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: "student" | "admin";
  isDemo: boolean;
  signOut: () => Promise<void>;
}

/**
 * Hook to provide current authenticated user or demo user fallback.
 * Subscribes to Supabase auth state changes when configured.
 */
export function useCurrentUser(): CurrentUserResult {
  const app = useApp();
  const [supabaseUser, setSupabaseUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const role = (session.user.user_metadata?.role as "student" | "admin") || "student";
          setSupabaseUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            role,
            studentId: session.user.user_metadata?.student_id,
            department: session.user.user_metadata?.department,
          });
        } else {
          setSupabaseUser(null);
        }
      } catch (err) {
        if (isMounted) setSupabaseUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const role = (session.user.user_metadata?.role as "student" | "admin") || "student";
          setSupabaseUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            role,
            studentId: session.user.user_metadata?.student_id,
            department: session.user.user_metadata?.department,
          });
        } else {
          setSupabaseUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    await app.signOut();
  }, [app]);

  // If real Supabase user exists, prefer it; otherwise fallback cleanly to AppContext demo user
  const effectiveUser = supabaseUser || app.user;
  const isDemo = !supabaseUser && Boolean(app.user);

  return {
    user: effectiveUser,
    loading,
    isAuthenticated: Boolean(effectiveUser),
    role: effectiveUser?.role || "student",
    isDemo,
    signOut,
  };
}

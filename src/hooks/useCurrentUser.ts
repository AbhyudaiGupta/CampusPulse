"use client";

import { useApp } from "@/context/AppContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { UserSession } from "@/context/AppContext";

export interface CurrentUserResult {
  user: UserSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: "student" | "admin";
  isDemo: boolean;
  signOut: () => Promise<void>;
}

// AppContext loads the role from profiles. Never trust editable user metadata.
export function useCurrentUser(): CurrentUserResult {
  const app = useApp();
  return {
    user: app.user,
    loading: false,
    isAuthenticated: Boolean(app.user),
    role: app.user?.role || "student",
    isDemo: !isSupabaseConfigured && Boolean(app.user),
    signOut: app.signOut,
  };
}

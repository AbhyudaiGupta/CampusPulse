import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabaseServer";
import type { UserProfile, UserRole } from "./types";
import { z } from "zod";

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

/**
 * Verifies the JWT token server-side via Supabase Auth and fetches the user profile.
 * Never trusts client-provided identity headers or unverified tokens.
 */
export async function getAuthenticatedUser(): Promise<{
  user: AuthenticatedUserPayload | null;
  error?: string;
  status?: number;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    // Demo fallback when Supabase is unconfigured
    return {
      user: {
        id: "demo-student-id",
        email: "abhay.student@campus.edu",
        role: "student",
        fullName: "Abhay",
      },
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return {
      user: null,
      error: "Authentication required: Invalid or expired session",
      status: 401,
    };
  }

  // Fetch verified profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    return {
      user: {
        id: authUser.id,
        email: authUser.email || "",
        role: "student",
        fullName: authUser.user_metadata?.full_name || "Campus Student",
      },
    };
  }

  return {
    user: {
      id: authUser.id,
      email: authUser.email || "",
      role: (profile.role as UserRole) || "student",
      fullName: profile.full_name || "Campus Student",
    },
  };
}

/**
 * Server-side authorization gate: Verifies authenticated user AND confirms admin role.
 */
export async function getAuthenticatedAdmin(): Promise<{
  user: AuthenticatedUserPayload | null;
  error?: string;
  status?: number;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    // In mock demo mode, allow admin role for simulation inspection if requested
    return {
      user: {
        id: "demo-admin-id",
        email: "priya.menon@campus.edu",
        role: "admin",
        fullName: "Dr. Priya Menon",
      },
    };
  }

  const authResult = await getAuthenticatedUser();
  if (authResult.error || !authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      user: null,
      error: "Forbidden: Campus administrator role required",
      status: 403,
    };
  }

  return { user: authResult.user };
}

/**
 * Standardized safe error response helper that formats Zod or database errors
 * without exposing internal database details or credentials.
 */
export function createSafeErrorResponse(error: unknown, defaultMessage = "Internal server error", status = 500) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
  }
  const message = defaultMessage;
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

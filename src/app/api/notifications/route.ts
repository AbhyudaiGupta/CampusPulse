import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";

/**
 * GET /api/notifications
 * Retrieves user-scoped in-app notifications.
 * 
 * SECURITY:
 * - Scoped strictly to verified `user.id` from server auth.
 * - Students cannot read other students' notifications.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      // Mock demo notifications
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        data: MOCK_NOTIFICATIONS,
      });
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return createSafeErrorResponse(error, "Failed to load notifications");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      data: notifications,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

/**
 * PATCH /api/notifications
 * Marks all notifications as read for current user.
 */
export async function PATCH() {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        message: "All notifications marked as read",
      });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return createSafeErrorResponse(error, "Failed to update notifications");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: "All notifications marked as read",
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

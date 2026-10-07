import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * PATCH /api/notifications/[id]/read
 * Marks a specific notification as read.
 * 
 * SECURITY:
 * - Scoped strictly to `user_id = user.id`.
 * - Prevents cross-user state mutation.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        message: "Notification marked as read",
        data: { id, read: true },
      });
    }

    // Verify ownership and update
    const { data: updated, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id) // Strict ownership condition
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { success: false, error: "Notification not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

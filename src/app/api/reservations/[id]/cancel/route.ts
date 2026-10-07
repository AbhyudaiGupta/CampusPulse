import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient, getServiceRoleClient } from "@/lib/supabaseServer";

/**
 * PATCH /api/reservations/[id]/cancel
 * Releases a seat hold or cancels an active reservation.
 * 
 * SECURITY:
 * - Session must be authenticated.
 * - Ownership check: `reservation.user_id` must match `user.id`.
 * - Immediately frees up space capacity for other students.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify user session server-side
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const supabase = await createServerSupabaseClient();
    const serviceClient = getServiceRoleClient();

    if (!supabase) {
      // Mock demo cancellation
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        message: "Reservation cancelled and seat released.",
        data: {
          id,
          userId: user.id,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        },
      });
    }

    const client = serviceClient || supabase;

    // 2. Fetch reservation to verify ownership
    const { data: reservation, error: fetchError } = await client
      .from("reservations")
      .select("id, user_id, status, space_id")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 3. Strict ownership check
    if (reservation.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only cancel your own reservations" },
        { status: 403 }
      );
    }

    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Reservation is already cancelled" },
        { status: 400 }
      );
    }

    // 4. Update status to cancelled
    const { data: updatedReservation, error: updateError } = await client
      .from("reservations")
      .update({
        status: "cancelled",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return createSafeErrorResponse(updateError, "Failed to cancel reservation");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: "Reservation cancelled. Seat has been released for other students.",
      data: updatedReservation,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient, getServiceRoleClient } from "@/lib/supabaseServer";

/**
 * PATCH /api/reservations/[id]/check-in
 * Verifies authenticated student session and confirms their own seat hold upon arrival.
 * 
 * SECURITY:
 * - Session must be authenticated.
 * - Ownership check: `reservation.user_id` must match `user.id`.
 * - Hold must not be expired.
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
      // Mock demo check-in response
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        message: "Check-in confirmed successfully.",
        data: {
          id,
          userId: user.id,
          status: "confirmed",
          checkedInAt: new Date().toISOString(),
        },
      });
    }

    const client = serviceClient || supabase;

    // 2. Fetch reservation to verify ownership and expiry
    const { data: reservation, error: fetchError } = await client
      .from("reservations")
      .select("id, user_id, status, expires_at, space_id")
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
        { success: false, error: "Forbidden: You can only check in to your own reservations" },
        { status: 403 }
      );
    }

    // 4. Expiration check
    if (reservation.status !== "holding") {
      return NextResponse.json(
        { success: false, error: "Only an active seat hold can be checked in." },
        { status: 400 }
      );
    }

    if (reservation.status === "holding" && new Date(reservation.expires_at) < new Date()) {
      // Mark as expired
      await client
        .from("reservations")
        .update({ status: "expired" })
        .eq("id", id);

      return NextResponse.json(
        { success: false, error: "The 10-minute hold window has expired. Please reserve again." },
        { status: 400 }
      );
    }

    // 5. Update to confirmed
    const nowIso = new Date().toISOString();
    const { data: updatedReservation, error: updateError } = await client
      .from("reservations")
      .update({
        status: "confirmed",
        checked_in_at: nowIso,
      })
      .eq("id", id)
      .eq("status", "holding")
      .gt("expires_at", nowIso)
      .select()
      .single();

    if (updateError) {
      return createSafeErrorResponse(updateError, "Failed to confirm check-in");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: "Check-in confirmed. Desk is now yours.",
      data: updatedReservation,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

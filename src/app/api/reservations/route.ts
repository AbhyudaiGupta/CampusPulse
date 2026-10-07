import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient, getServiceRoleClient } from "@/lib/supabaseServer";
import { z } from "zod";

const ReservationCreateSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  seatLabel: z.string().min(1, "Seat label is required").default("Desk-01"),
});

/**
 * POST /api/reservations
 * Creates a 10-minute temporary seat hold.
 * 
 * SECURITY:
 * - Session identity is strictly verified server-side (user_id = user.id).
 * - Client cannot forge or provide a trusted user ID.
 * - Current availability is re-calculated server-side against live capacity and active holds.
 * - Prevents overbooking.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify user session server-side
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;

    // 2. Validate request payload with Zod
    const body = await request.json();
    const payload = ReservationCreateSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const serviceClient = getServiceRoleClient();

    // 10-minute hold window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

    if (!supabase) {
      // Mock demo hold creation
      const mockReservation = {
        id: `hold-${Date.now()}`,
        userId: user.id,
        spaceId: payload.spaceId,
        seatLabel: payload.seatLabel,
        status: "holding",
        expiresAt: expiresAt,
        createdAt: now.toISOString(),
      };

      return NextResponse.json({
        success: true,
        source: "mock_demo",
        message: "Seat held for 10 minutes. Please confirm check-in on arrival.",
        data: mockReservation,
      });
    }

    const client = serviceClient || supabase;

    // 3. Query space capacity
    const { data: space, error: spaceError } = await client
      .from("spaces")
      .select("id, name, capacity, live_occupancy(occupied)")
      .eq("id", payload.spaceId)
      .single();

    if (spaceError || !space) {
      return NextResponse.json(
        { success: false, error: "Campus space not found" },
        { status: 404 }
      );
    }

    // 4. Count current occupants and active holds before creating another hold.
    const occupancyRow = Array.isArray(space.live_occupancy)
      ? space.live_occupancy[0]
      : space.live_occupancy;
    const occupiedSeats = Number(occupancyRow?.occupied) || 0;

    const { data: activeReservations, error: countError } = await client
      .from("reservations")
      .select("id, status, expires_at")
      .eq("space_id", payload.spaceId)
      .or(`status.eq.confirmed,and(status.eq.holding,expires_at.gt.${now.toISOString()})`);

    if (countError) {
      return createSafeErrorResponse(countError, "Failed to verify space capacity");
    }

    const activeCount = activeReservations ? activeReservations.length : 0;
    const availableSeats = space.capacity - occupiedSeats - activeCount;

    if (availableSeats <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Space is currently at capacity. No seats available for reservation.",
        },
        { status: 409 }
      );
    }

    // 5. Insert user-scoped reservation with 10-minute hold
    const { data: newReservation, error: insertError } = await client
      .from("reservations")
      .insert({
        user_id: user.id, // Strictly server-derived from verified session
        space_id: space.id,
        seat_label: payload.seatLabel,
        status: "holding",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      return createSafeErrorResponse(insertError, "Failed to create seat hold");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: "Seat held for 10 minutes. Please confirm check-in on arrival.",
      data: newReservation,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

/**
 * GET /api/reservations
 * Returns user's own reservations (user-scoped).
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
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        data: [],
      });
    }

    // Query user-scoped reservations
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(`
        *,
        spaces (name, building, floor, type)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return createSafeErrorResponse(error, "Failed to load reservations");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      data: reservations,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

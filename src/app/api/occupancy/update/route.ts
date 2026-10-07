import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { updateSpaceOccupancy } from "@/lib/occupancyStore";
import { z } from "zod";

const OccupancyUpdateSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  occupied: z.number().int().min(0, "Occupied count must be 0 or greater"),
  queueCount: z.number().int().min(0).optional().default(0),
  noiseLevel: z.enum(["silent", "quiet", "moderate", "loud"]).optional().default("moderate"),
});

/**
 * POST /api/occupancy/update
 * Admin-only endpoint for campus operations or gateway sensor hardware integration.
 * Strictly verifies admin role server-side.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify admin role server-side
    const authResult = await getAuthenticatedAdmin();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin privilege required" },
        { status: authResult.status || 403 }
      );
    }

    // 2. Validate request payload with Zod
    const body = await request.json();
    const payload = OccupancyUpdateSchema.parse(body);

    // 3. Update through the validated occupancy update service
    const result = await updateSpaceOccupancy({
      spaceId: payload.spaceId,
      occupied: payload.occupied,
      queueCount: payload.queueCount,
      noiseLevel: payload.noiseLevel,
      source: "door_counter",
      eventType: "admin_manual_override",
    });

    return NextResponse.json({
      success: true,
      message: "Occupancy state updated and published to real-time telemetry",
      data: {
        spaceId: result.space.id,
        spaceName: result.space.name,
        occupied: result.space.occupied,
        available: result.space.availableSeats,
        status: result.space.status,
        updatedAt: result.space.lastUpdated,
      },
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

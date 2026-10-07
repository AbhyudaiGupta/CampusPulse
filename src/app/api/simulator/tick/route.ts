import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { executeSimulationTick } from "@/lib/simulatorEngine";

/**
 * POST /api/simulator/tick
 * Admin-only fallback: Manually triggers one simulation tick through the validated
 * occupancy update service. Ensures 100% reliable execution in serverless or interactive demos.
 */
export async function POST() {
  try {
    const authResult = await getAuthenticatedAdmin();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin privilege required" },
        { status: authResult.status || 403 }
      );
    }

    const result = await executeSimulationTick();

    return NextResponse.json({
      success: true,
      message: `Simulation tick executed (${result.eventsCount} sensor event${result.eventsCount !== 1 ? "s" : ""})`,
      status: result.status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

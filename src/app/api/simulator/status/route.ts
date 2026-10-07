import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { getSimulatorStatus } from "@/lib/simulatorEngine";

/**
 * GET /api/simulator/status
 * Admin-only: Returns current simulation state, heartbeat, and latest sensor events.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedAdmin();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin privilege required" },
        { status: authResult.status || 403 }
      );
    }

    const status = await getSimulatorStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

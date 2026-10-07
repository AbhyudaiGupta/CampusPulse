import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { stopSimulator } from "@/lib/simulatorEngine";

/**
 * POST /api/simulator/stop
 * Admin-only: Pauses the simulated sensor stream.
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

    const status = await stopSimulator();

    return NextResponse.json({
      success: true,
      message: "Simulated sensor engine paused",
      status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

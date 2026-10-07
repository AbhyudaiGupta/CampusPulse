import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { resetSimulator } from "@/lib/simulatorEngine";

/**
 * POST /api/simulator/reset
 * Admin-only: Restores all campus facilities to default baseline.
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

    const status = await resetSimulator();

    return NextResponse.json({
      success: true,
      message: "Campus occupancy reset to default baseline",
      status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { startSimulator } from "@/lib/simulatorEngine";
import { z } from "zod";

const StartSchema = z.object({
  scenario: z
    .enum(["normal", "lunch_rush", "exam_surge", "lab_release", "event_exit", "reset"])
    .optional(),
  frequencySeconds: z.number().int().min(1).max(15).optional().default(3),
});

/**
 * POST /api/simulator/start
 * Admin-only: Starts the simulated anonymous IoT sensor engine.
 */
export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedAdmin();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin privilege required" },
        { status: authResult.status || 403 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }

    const { scenario, frequencySeconds } = StartSchema.parse(body);
    const status = await startSimulator(scenario, frequencySeconds);

    return NextResponse.json({
      success: true,
      message: `Simulated anonymous sensor feed active (${status.scenarioTitle})`,
      status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

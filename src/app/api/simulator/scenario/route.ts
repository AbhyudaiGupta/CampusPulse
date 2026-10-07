import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { setSimulatorScenario } from "@/lib/simulatorEngine";
import { z } from "zod";

const ScenarioSchema = z.object({
  scenario: z.enum(["normal", "lunch_rush", "exam_surge", "lab_release", "event_exit", "reset"]),
});

/**
 * POST /api/simulator/scenario
 * Admin-only: Switches active campus load scenario and primes immediate spatial transition.
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

    const body = await request.json();
    const { scenario } = ScenarioSchema.parse(body);

    const status = await setSimulatorScenario(scenario);

    return NextResponse.json({
      success: true,
      message: `Scenario switched to: ${status.scenarioTitle}`,
      status,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

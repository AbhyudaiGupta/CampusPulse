import { NextResponse } from "next/server";
import { isServerSupabaseConfigured } from "@/lib/supabaseServer";
import { getLiveSpaces } from "@/lib/occupancyStore";
import { createSafeErrorResponse } from "@/lib/authServer";

/**
 * GET /api/spaces
 * Returns list of campus facilities with aggregated live occupancy.
 * Accessible to authenticated users and public pre-walk discovery.
 */
export async function GET() {
  try {
    const spaces = await getLiveSpaces();
    return NextResponse.json({
      success: true,
      source: isServerSupabaseConfigured ? "live_occupancy_service" : "mock_demo",
      data: spaces,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

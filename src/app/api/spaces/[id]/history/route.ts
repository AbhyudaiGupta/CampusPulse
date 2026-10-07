import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { MOCK_SPACES } from "@/lib/mockData";
import { createSafeErrorResponse } from "@/lib/authServer";

/**
 * GET /api/spaces/[id]/history
 * Retrieves sensor occupancy timeline for forecasting.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      const space = MOCK_SPACES.find((s) => s.id === id);
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        data: space ? space.hourlyForecast : [],
      });
    }

    const { data: events, error } = await supabase
      .from("sensor_events")
      .select("id, occupancy_count, recorded_at, event_type")
      .eq("space_id", id)
      .order("recorded_at", { ascending: false })
      .limit(24);

    if (error) {
      // Fallback to hourly forecast if raw sensor events are empty
      const space = MOCK_SPACES.find((s) => s.id === id);
      return NextResponse.json({
        success: true,
        source: "forecast_model",
        data: space ? space.hourlyForecast : [],
      });
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      data: events,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { getLiveSpaces } from "@/lib/occupancyStore";
import { createSafeErrorResponse } from "@/lib/authServer";

/**
 * GET /api/spaces/[id]
 * Retrieves single space by UUID or slug with real-time occupancy state.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      // Mock fallback: find by ID or slug
      const space = (await getLiveSpaces()).find((s) => s.id === id);
      if (!space) {
        return NextResponse.json(
          { success: false, error: "Campus space not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        data: space,
      });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = supabase
      .from("spaces")
      .select(`
        *,
        live_occupancy (*)
      `);

    const { data: space, error } = isUuid
      ? await query.eq("id", id).single()
      : await query.eq("slug", id).single();

    if (error || !space) {
      return NextResponse.json(
        { success: false, error: "Campus space not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      data: space,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedUser, createSafeErrorResponse } from "@/lib/authServer";
import { createServerSupabaseClient, getServiceRoleClient } from "@/lib/supabaseServer";
import { z } from "zod";

const AlertSubscriptionSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  thresholdPercent: z.number().int().min(1).max(100).default(70),
  active: z.boolean().optional().default(true),
});

/**
 * POST /api/alerts
 * Subscribes a student to automated crowd easing alerts when occupancy drops below threshold.
 * 
 * SECURITY:
 * - Session must be authenticated.
 * - `user_id` is strictly derived from session identity, never accepted from request body.
 */
export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const payload = AlertSubscriptionSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const serviceClient = getServiceRoleClient();

    if (!supabase) {
      // Mock demo alert subscription response
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        message: `Alert subscribed for space at ${payload.thresholdPercent}% threshold.`,
        data: {
          id: `alert-${Date.now()}`,
          userId: user.id,
          spaceId: payload.spaceId,
          thresholdPercent: payload.thresholdPercent,
          active: payload.active,
          createdAt: new Date().toISOString(),
        },
      });
    }

    const client = serviceClient || supabase;

    // Upsert subscription
    const { data: alert, error: upsertError } = await client
      .from("alert_subscriptions")
      .upsert(
        {
          user_id: user.id, // Strictly server-derived
          space_id: payload.spaceId,
          threshold_percent: payload.thresholdPercent,
          active: payload.active,
        },
        { onConflict: "user_id,space_id" }
      )
      .select()
      .single();

    if (upsertError) {
      return createSafeErrorResponse(upsertError, "Failed to save alert subscription");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      message: `Crowd alert registered for < ${payload.thresholdPercent}% occupancy.`,
      data: alert,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

/**
 * GET /api/alerts
 * Retrieves active subscriptions for authenticated user.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        source: "mock_demo",
        data: [],
      });
    }

    const { data: alerts, error } = await supabase
      .from("alert_subscriptions")
      .select(`
        *,
        spaces (name, building, floor)
      `)
      .eq("user_id", user.id)
      .eq("active", true);

    if (error) {
      return createSafeErrorResponse(error, "Failed to load alert subscriptions");
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      data: alerts,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, createSafeErrorResponse } from "@/lib/authServer";
import { evaluateOperationalInsights } from "@/lib/automatedInsights";
import { getServiceRoleClient } from "@/lib/supabaseServer";
import { z } from "zod";

const ApplyInsightSchema = z.object({
  insightId: z.string(),
  spaceId: z.string(),
  spaceName: z.string(),
  suggestedAction: z.string(),
  noticeTitle: z.string().optional(),
  noticeBody: z.string().optional(),
  previewOnly: z.boolean().optional().default(false),
});

/**
 * GET /api/simulator/insights
 * Admin-only: Evaluates transparent operational rules across campus spaces.
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

    const insights = await evaluateOperationalInsights();

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

/**
 * POST /api/simulator/insights
 * Admin-only: Prepares an advisory preview in demo mode or sends it to student
 * accounts when the server has a configured service-role client.
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
    const payload = ApplyInsightSchema.parse(body);

    const title = payload.noticeTitle || `Campus Operations Notice: ${payload.spaceName}`;
    const message =
      payload.noticeBody ||
      `Spatial routing update: ${payload.suggestedAction}`;

    const serviceClient = getServiceRoleClient();
    if (payload.previewOnly || !serviceClient) {
      return NextResponse.json({
        success: true,
        source: "demo_preview",
        message: `Advisory preview prepared for ${payload.spaceName}. No student accounts were notified.`,
        appliedInsightId: payload.insightId,
        notice: { title, message, timestamp: new Date().toISOString() },
      });
    }

    const { data: students, error: studentsError } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("role", "student");

    if (studentsError) {
      return createSafeErrorResponse(studentsError, "Failed to load student recipients");
    }

    const recipients = students || [];
    if (recipients.length > 0) {
      const { error: notificationError } = await serviceClient.from("notifications").insert(
        recipients.map((student) => ({
          user_id: student.id,
          type: "crowd_alert",
          title,
          message,
          read: false,
          action_url: `/spaces/${payload.spaceId}`,
          created_at: new Date().toISOString(),
        }))
      );

      if (notificationError) {
        return createSafeErrorResponse(notificationError, "Failed to send student advisory");
      }
    }

    return NextResponse.json({
      success: true,
      source: "supabase_postgresql",
      recipientCount: recipients.length,
      message: recipients.length > 0
        ? `Student advisory sent to ${recipients.length} accounts for ${payload.spaceName}.`
        : `Advisory prepared for ${payload.spaceName}; no student accounts were found.`,
      appliedInsightId: payload.insightId,
      notice: {
        title,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

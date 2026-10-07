import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const destination = searchParams.get("next") || "/";
  const next = destination.startsWith("/") && !destination.startsWith("//") && !destination.includes("\\")
    ? destination : "/";
  const supabase = await createServerSupabaseClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
  return NextResponse.redirect(new URL(next, origin));
}

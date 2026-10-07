"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, Loader2, CheckCircle } from "lucide-react";
import { PageTransition } from "@/components/ui/Primitives";

import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);

    if (supabase) {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });

      if (resetErr) {
        setError(resetErr.message || "Failed to send reset link.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setDone(true);
      return;
    }

    // Demo fallback when Supabase is not configured
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setDone(true);
  }

  return (
    <PageTransition>
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-surface-base)] p-6">
        <div className="w-full max-w-[360px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--color-cyan-600)] flex items-center justify-center">
              <Activity size={16} color="#fff" />
            </div>
            <span className="font-bold text-[15px] text-[var(--color-text-primary)]">CampusPulse</span>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-[6px] bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h1 className="text-[20px] font-bold text-[var(--color-text-primary)]">Check your inbox</h1>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent.
              </p>
              <Link href="/login" className="btn btn-primary mt-2">Back to Sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] mb-1">Reset password</h1>
              <p className="text-[13px] text-[var(--color-text-muted)] mb-7">
                Enter your email and we will send a reset link.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Email address</label>
                  <input id="email" type="email" className="input" placeholder="you@campus.edu"
                    value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-[6px] px-3 py-2" role="alert">{error}</p>}
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className="text-center mt-5 text-[12px] text-[var(--color-text-muted)]">
                <Link href="/login" className="text-[var(--color-cyan-600)] font-semibold hover:underline">Back to Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

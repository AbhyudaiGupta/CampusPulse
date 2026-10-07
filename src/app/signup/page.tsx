"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { PageTransition } from "@/components/ui/Primitives";

import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);

    if (supabase) {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authErr) {
        setError(authErr.message || "Failed to create account.");
        setLoading(false);
        return;
      }

      setLoading(false);

      if (data.session) {
        // Auto-confirmed or local instance
        router.push("/");
      } else {
        // Email confirmation link dispatched
        setDone(true);
      }
      return;
    }

    // Demo fallback when Supabase is not configured
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
  }

  return (
    <PageTransition>
      <div className="auth-root">
        {/* Left panel */}
        <div className="auth-left">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-[6px] bg-[var(--color-cyan-600)] flex items-center justify-center">
                <Activity size={20} color="#fff" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-white font-bold text-[17px]">CampusPulse</p>
                <p className="text-[rgba(255,255,255,0.4)] text-[11px]">Know before you go.</p>
              </div>
            </div>
            <div className="mt-auto">
              <h2 className="text-white font-bold text-[22px] leading-snug">
                Your campus intelligence starts here.
              </h2>
              <p className="text-[rgba(255,255,255,0.5)] text-[13px] mt-3 leading-relaxed">
                Create a free account to access crowd forecasts, smart recommendations, and reservation management.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="w-full max-w-[380px]">
            {done ? (
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <div className="w-14 h-14 rounded-[6px] bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">Check your inbox</h1>
                <p className="text-[14px] text-[var(--color-text-muted)] max-w-[280px]">
                  We have sent a confirmation link to <span className="font-semibold text-[var(--color-text-primary)]">{form.email}</span>. Click it to activate your account.
                </p>
                <Link href="/login" className="btn btn-primary mt-2">Back to Sign in</Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">Create account</h1>
                  <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Join your campus network.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Full name</label>
                    <input id="name" type="text" className="input" placeholder="Your full name"
                      value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" required disabled={loading} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Email address</label>
                    <input id="email" type="email" className="input" placeholder="you@campus.edu"
                      value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required disabled={loading} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Password</label>
                    <div className="relative">
                      <input id="password" type={showPass ? "text" : "password"} className="input pr-10"
                        placeholder="Min. 8 characters" value={form.password}
                        onChange={(e) => update("password", e.target.value)} autoComplete="new-password" required disabled={loading} />
                      <button type="button" onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                        aria-label={showPass ? "Hide password" : "Show password"}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-[6px] px-3 py-2" role="alert">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg w-full mt-1" disabled={loading}>
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>

                <p className="text-[12px] text-[var(--color-text-muted)] text-center mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[var(--color-cyan-600)] font-semibold hover:underline">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

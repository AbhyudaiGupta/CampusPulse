"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/ui/Primitives";

// ── Campus data visual (left panel) ───────────────────────────────────────────

function CampusVisual() {
  const nodes = [
    { x: 30, y: 35, label: "Library", pct: 62, color: "#f59e0b" },
    { x: 65, y: 25, label: "Lab 2", pct: 73, color: "#f59e0b" },
    { x: 20, y: 65, label: "Canteen", pct: 72, color: "#f59e0b" },
    { x: 55, y: 60, label: "Hub", pct: 66, color: "#f59e0b" },
    { x: 80, y: 70, label: "Hall A", pct: 12, color: "#10b981" },
    { x: 40, y: 48, label: "Study C", pct: 40, color: "#f59e0b" },
  ];

  const connections = [
    [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5],
  ];

  return (
    <div className="relative w-full h-72" aria-hidden>
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
        {/* Grid lines */}
        {[20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1={v} y1="5" x2={v} y2="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
            <line x1="5" y1={v} x2="95" y2={v} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          </g>
        ))}
        {/* Connections */}
        {connections.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke="#06b6d4"
            strokeWidth="0.4"
            strokeOpacity={0.3}
            strokeDasharray="2 2"
          />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g key={i}>
            <circle cx={node.x} cy={node.y} r="4" fill={node.color} fillOpacity={0.9} />
            <circle cx={node.x} cy={node.y} r="6" fill={node.color} fillOpacity={0.15} />
            <text x={node.x} y={node.y + 9} fontSize="3.5" fill="rgba(255,255,255,0.55)" textAnchor="middle">
              {node.label}
            </text>
            <text x={node.x} y={node.y + 0.8} fontSize="2.8" fill="white" textAnchor="middle" fontWeight="bold">
              {node.pct}%
            </text>
          </motion.g>
        ))}
      </svg>
      <p className="text-[11px] text-[rgba(255,255,255,0.3)] text-center mt-2">
        Anonymous occupancy data. Prototype simulation.
      </p>
    </div>
  );
}

// ── Login page ─────────────────────────────────────────────────────────────────

import { useApp } from "@/context/AppContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemo } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);

    if (supabase) {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        setError(authErr.message || "Failed to sign in. Please verify your credentials.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/");
      return;
    }

    // Demo fallback when Supabase is not configured
    await new Promise((r) => setTimeout(r, 600));
    loginAsDemo("student");
    setLoading(false);
    router.push("/");
  }

  async function handleGoogleSignIn() {
    setError(null);
    if (supabase) {
      setGoogleLoading(true);
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authErr) {
        setError(authErr.message || "Google sign-in is not configured on this Supabase project.");
        setGoogleLoading(false);
      }
      return;
    }

    // Demo fallback
    loginAsDemo("student");
    router.push("/");
  }

  function continueAsDemo(role: "student" | "admin") {
    loginAsDemo(role);
    router.push(role === "admin" ? "/admin" : "/");
  }

  return (
    <PageTransition>
      <div className="auth-root">
        {/* Left panel */}
        <div className="auth-left">
          <div className="relative z-10 flex flex-col h-full">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-[6px] bg-[var(--color-cyan-600)] flex items-center justify-center">
                <Activity size={20} color="#fff" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-white font-bold text-[17px] tracking-tight">CampusPulse</p>
                <p className="text-[rgba(255,255,255,0.4)] text-[11px]">Know before you go.</p>
              </div>
            </div>

            {/* Campus visual */}
            <CampusVisual />

            {/* Copy */}
            <div className="mt-auto">
              <h2 className="text-white font-bold text-[22px] leading-snug tracking-tight">
                Find your space<br />before you leave.
              </h2>
              <p className="text-[rgba(255,255,255,0.5)] text-[13px] mt-3 leading-relaxed">
                Real-time anonymous occupancy, crowd forecasts, and smart recommendations for every campus resource.
              </p>
              <div className="flex gap-4 mt-6 flex-wrap">
                {[
                  { label: "Privacy first", sub: "No tracking" },
                  { label: "Live data", sub: "Updated every minute" },
                  { label: "Smart picks", sub: "AI recommendations" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-white text-[12px] font-semibold">{item.label}</p>
                    <p className="text-[rgba(255,255,255,0.4)] text-[11px]">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="w-full max-w-[380px]">
            <div className="mb-8">
              <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                Sign in
              </h1>
              <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
                Access your campus dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className={`input${error ? " input-error" : ""}`}
                  placeholder="you@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[12px] text-[var(--color-cyan-600)] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    className={`input pr-10${error ? " input-error" : ""}`}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-[6px] px-3 py-2" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full mt-1"
                disabled={loading || googleLoading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="btn btn-secondary w-full gap-2.5 text-[13px] border border-[var(--color-border-subtle)]"
              >
                {googleLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Demo separator */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wide">Demo mode</span>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => continueAsDemo("student")}
                className="btn btn-outline w-full justify-start gap-3 text-[13px]"
              >
                <div className="w-7 h-7 rounded-[7px] bg-[var(--color-surface-muted)] flex items-center justify-center">
                  <Activity size={13} color="var(--color-text-secondary)" />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Continue as Student</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">Alex Sharma, demo account</span>
                </div>
                <ArrowRight size={13} className="ml-auto opacity-40" />
              </button>

              <button
                onClick={() => continueAsDemo("admin")}
                className="btn btn-outline w-full justify-start gap-3 text-[13px]"
              >
                <div className="w-7 h-7 rounded-[7px] bg-[var(--color-navy-800)] flex items-center justify-center">
                  <Activity size={13} color="#22d3ee" />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Continue as Admin</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">Dr. Priya Menon, demo account</span>
                </div>
                <ArrowRight size={13} className="ml-auto opacity-40" />
              </button>
            </div>

            <p className="text-[12px] text-[var(--color-text-muted)] text-center mt-6">
              No account?{" "}
              <Link href="/signup" className="text-[var(--color-cyan-600)] font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

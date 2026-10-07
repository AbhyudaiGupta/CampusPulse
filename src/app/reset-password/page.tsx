"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    if (!supabase) return setError("Password recovery is unavailable in demo mode.");
    setLoading(true);
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) throw new Error("This recovery link expired. Request a new link.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-[400px] space-y-4">
        <h1 className="text-xl font-semibold">{done ? "Password updated" : "Choose a new password"}</h1>
        {done ? <Link href="/login" className="btn btn-primary">Back to sign in</Link> : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" className="input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" className="input" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={loading} />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Saving…" : "Update password"}</button>
            <Link href="/forgot-password" className="text-sm underline">Request another recovery link</Link>
          </form>
        )}
      </div>
    </main>
  );
}

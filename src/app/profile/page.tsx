"use client";

import { useState } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge } from "@/components/ui/Primitives";
import { useApp } from "@/context/AppContext";
import {
  User,
  Mail,
  Shield,
  Volume2,
  Accessibility,
  Clock,
  Bell,
  LogOut,
  Check,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loginAsDemo, signOut, preferences, updatePreferences } = useApp();
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleSavePreferences() {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role ?? "student"} userName={user?.name ?? "Student Demo"} />

      <main className="app-main" id="main-content">
        <TopNav
          title="Profile & Preferences"
          breadcrumb={["CampusPulse", "Account"]}
          userName={user?.name ?? "Student Demo"}
          role={user?.role ?? "student"}
        />

        <div className="page-content max-w-[800px]">
          <PageTransition>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                  User Profile & Campus Preferences
                </h1>
                <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                  Manage your personal smart-campus defaults, acoustic filters, and notifications.
                </p>
              </div>
              <DemoDataBadge />
            </div>

            {/* Controlled Demo Account Switcher */}
            <div className="card p-4 mb-6 border border-cyan-200 bg-cyan-50">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-600" />
                    Demo Persona Switcher
                  </span>
                  <p className="text-[12px] text-cyan-950 mt-0.5">
                    Switch between student and campus administrator roles to inspect role-scoped permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsDemo("student")}
                    className={`btn text-[12px] py-1.5 px-3 border transition-colors ${
                      user?.role === "student"
                        ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] font-semibold"
                        : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    <User size={13} /> Student Demo (Abhay)
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsDemo("admin")}
                    className={`btn text-[12px] py-1.5 px-3 border transition-colors ${
                      user?.role === "admin"
                        ? "bg-cyan-700 text-white border-cyan-800 font-semibold"
                        : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    <ShieldCheck size={13} /> Admin Demo (Dr. Menon)
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div className="card p-5 mb-6 border border-[var(--color-border-subtle)] bg-white">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-[12px] bg-[var(--color-navy-900)] flex items-center justify-center text-cyan-400 font-bold text-[22px]">
                  {user?.name ? user.name[0] : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">
                    {user?.name ?? "Guest User"}
                  </h2>
                  <p className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                    <Mail size={12} /> {user?.email ?? "Not signed in"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                      {user?.role === "admin" ? "Campus Administrator" : "Undergraduate Student"}
                    </span>
                    {user?.studentId && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        ID: {user.studentId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={signOut}
                    className="btn btn-secondary text-[12px] py-1.5 px-3 text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Study & Spatial Preferences */}
            <div className="card p-5 mb-6 border border-[var(--color-border-subtle)] bg-white space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-[var(--color-cyan-600)]" />
                  <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                    Smart Study Preferences
                  </h2>
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Guides Best Spot ranking
                </span>
              </div>

              {/* 1. Acoustic Level Preference */}
              <div>
                <label className="text-[12px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-2">
                  <Volume2 size={14} className="text-[var(--color-text-muted)]" />
                  Preferred Acoustic Environment:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "silent", label: "Silent (Deep Focus)" },
                      { id: "quiet", label: "Quiet (Whispers)" },
                      { id: "moderate", label: "Moderate (Collab)" },
                      { id: "no_preference", label: "No Preference" },
                    ] as const
                  ).map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => updatePreferences({ quietLevel: q.id })}
                      className={`p-2.5 rounded-[8px] text-[12px] font-medium text-left border transition-all ${
                        preferences.quietLevel === q.id
                          ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] shadow-xs"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Walk Distance Tolerance */}
              <div>
                <label className="text-[12px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-2">
                  <Clock size={14} className="text-[var(--color-text-muted)]" />
                  Maximum Preferred Walk Duration:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updatePreferences({ maxWalkMinutes: mins })}
                      className={`p-2 rounded-[8px] text-[12px] font-semibold text-center border transition-all ${
                        preferences.maxWalkMinutes === mins
                          ? "bg-cyan-700 text-white border-cyan-800"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                      }`}
                    >
                      {mins} minutes
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Accessibility Requirement */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-[9px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.accessibilityRequired}
                    onChange={(e) => updatePreferences({ accessibilityRequired: e.target.checked })}
                    className="rounded border-[var(--color-border)] text-[var(--color-cyan-600)] focus:ring-[var(--color-cyan-500)]"
                  />
                  <div className="flex-1 text-[12px]">
                    <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Accessibility size={14} className="text-emerald-600" />
                      Prioritize Wheelchair & Step-Free Accessible Spaces
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                      Ensures elevator proximity and wide ramp pathways in route generation.
                    </span>
                  </div>
                </label>
              </div>

              {/* Notification Toggles */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                <h3 className="text-[13px] font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-2.5">
                  <Bell size={14} className="text-[var(--color-cyan-600)]" />
                  In-App Notification Preferences
                </h3>

                <div className="space-y-2 text-[12px]">
                  <label className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] cursor-pointer">
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)] block">
                        Crowd Pressure Alerts
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Receive alerts when your watched study zones fall below 70% occupancy.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.crowdAlerts}
                      onChange={(e) => updatePreferences({ crowdAlerts: e.target.checked })}
                      className="rounded border-[var(--color-border)] text-[var(--color-cyan-600)]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] cursor-pointer">
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)] block">
                        Reservation 10-Minute Hold Reminders
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Alerts 3 minutes before your temporary seat hold expires.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.reservationReminders}
                      onChange={(e) => updatePreferences({ reservationReminders: e.target.checked })}
                      className="rounded border-[var(--color-border)] text-[var(--color-cyan-600)]"
                    />
                  </label>
                </div>
              </div>

              {/* Save Feedback */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Preferences are stored in your client session and update recommendations in real-time.
                </span>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="btn btn-primary text-[12px] py-1.5 px-4 font-semibold"
                >
                  {saveSuccess ? (
                    <>
                      <Check size={13} /> Saved!
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </button>
              </div>
            </div>

            {/* Privacy Trust Commitment */}
            <div className="card p-4 border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[12px]">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)]">
                    Privacy-First Architecture
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    CampusPulse operates under a zero-individual-tracking mandate. Your preferences
                    and search history remain strictly on your local device. Headroom counts are aggregated
                    via anonymous thermal and optical gateway counters without biometric identification.
                  </p>
                </div>
              </div>
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

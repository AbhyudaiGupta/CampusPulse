"use client";

import { useState, useEffect } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge } from "@/components/ui/Primitives";
import { useSpaces, useCurrentUser } from "@/hooks";
import type { SpaceType } from "@/lib/types";
import {
  Sparkles,
  MapPin,
  ArrowRight,
  Filter,
  Activity,
  Layers,
  Clock,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { MiniHeatmap } from "@/components/dashboard/MiniHeatmap";
import { MetricOverview } from "@/components/dashboard/MetricOverview";
import { BestMatchCard } from "@/components/dashboard/BestMatchCard";
import { LiveResourceCard } from "@/components/dashboard/LiveResourceCard";
import { FlowForecastChart } from "@/components/dashboard/FlowForecastChart";
import { ActionTiles } from "@/components/dashboard/ActionTiles";
import { PrivacyTrustPanel } from "@/components/dashboard/PrivacyTrustPanel";
import { useApp } from "@/context/AppContext";

export default function StudentDashboardPage() {
  const { spaces, lastUpdated, error: spacesError } = useSpaces();
  const { user } = useCurrentUser();
  const { reservations } = useApp();
  const [filterType, setFilterType] = useState<SpaceType | "all">("all");
  const userName = user?.name || "Abhay";
  const [greeting, setGreeting] = useState(`Good evening, ${userName}`);
  const [currentTimeText, setCurrentTimeText] = useState("Current local time");
  const [lastUpdateText, setLastUpdateText] = useState("Awaiting telemetry");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) setGreeting(`Good morning, ${userName}`);
      else if (hour < 17) setGreeting(`Good afternoon, ${userName}`);
      else setGreeting(`Good evening, ${userName}`);

      const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      setCurrentTimeText(`${dayName}, ${timeStr}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 60_000);
    return () => clearInterval(interval);
  }, [userName]);

  useEffect(() => {
    if (!lastUpdated) return;
    setLastUpdateText(new Date(lastUpdated).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }));
  }, [lastUpdated]);

  const filteredSpaces = spaces.filter((s) => {
    if (filterType === "all") return true;
    return s.type === filterType;
  });

  return (
    <div className="app-layout">
      {/* Background geometric grid */}
      <div className="campus-grid-bg" aria-hidden />

      {/* Main navigation sidebar */}
      <Sidebar role={user?.role || "student"} userName={userName} />

      {/* Main content viewport */}
      <main className="app-main" id="main-content">
        <TopNav
          title="Student Dashboard"
          breadcrumb={["CampusPulse", "Live Hub"]}
          userName={userName}
          role={user?.role || "student"}
        />

        <div className="page-content">
          <PageTransition>
            {/* ── 1. Hero Section ────────────────────────────────────────── */}
            <div className="card p-6 mb-7 border border-[var(--color-border-subtle)] bg-white relative overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Headline & Actions */}
                <div className="lg:col-span-7">
                  {/* Context Pills (Medium radius, strictly non-pill) */}
                  <div className="flex items-center gap-2 flex-wrap mb-3 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] font-medium border border-[var(--color-border-subtle)]">
                      <Clock size={12} className="text-[var(--color-cyan-600)]" />
                      {currentTimeText}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {spaces.length} spaces monitored
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[7px] bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {spacesError ? "Space feed unavailable" : `Updated ${lastUpdateText}`}
                    </span>
                    <DemoDataBadge />
                  </div>

                  {/* Greeting & Subtitle */}
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight mb-2">
                    {greeting}
                  </h1>
                  <p className="text-[14px] sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-xl mb-6">
                    See availability, avoid queues, and find the right campus space before you walk there.
                  </p>

                  {/* Two Medium-Radius Rectangular Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href="/recommendation"
                      className="btn btn-primary text-[13px] py-2.5 px-5 font-semibold inline-flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles size={15} />
                      Find my best spot
                    </Link>
                    <Link
                      href="/map"
                      className="btn btn-secondary text-[13px] py-2.5 px-5 font-medium inline-flex items-center gap-2"
                    >
                      <Compass size={15} />
                      Explore live map
                    </Link>
                  </div>
                </div>

                {/* Right: Miniature Animated Campus Heatmap */}
                <div className="lg:col-span-5">
                  <MiniHeatmap spaces={spaces} />
                </div>
              </div>
            </div>

            {/* ── 2. Premium Metric Overview ─────────────────────────────── */}
            <MetricOverview spaces={spaces} reservations={reservations} />

            {/* ── 3. Quick Action Tiles ──────────────────────────────────── */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                  Instant Tasks
                </h2>
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  One-tap access to live campus services
                </span>
              </div>
              <ActionTiles />
            </div>

            {/* ── 4. Main Split View: Availability + Best Match ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
              {/* Left Column (8 cols): Live Campus Availability */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div>
                    <h2 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
                      <Activity size={18} className="text-[var(--color-cyan-600)]" />
                      Live campus availability
                    </h2>
                    <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                      Direct occupancy feeds with noise and queue telemetry
                    </p>
                  </div>

                  {/* Category Filter Tabs (Rectangular, non-pill) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px]">
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "study_space", label: "Study" },
                        { id: "computer_lab", label: "Labs" },
                        { id: "canteen", label: "Dining" },
                        { id: "collaboration", label: "Collab" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFilterType(t.id)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors shrink-0 ${
                          filterType === t.id
                            ? "bg-[var(--color-navy-900)] text-white"
                            : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resource Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSpaces.map((space, i) => (
                    <LiveResourceCard key={space.id} space={space} index={i} />
                  ))}
                </div>

                {/* Bottom link to complete directory */}
                <div className="pt-2 flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
                  <span>Showing {filteredSpaces.length} of {spaces.length} campus facilities</span>
                  <Link
                    href="/spaces"
                    className="font-semibold text-[var(--color-cyan-700)] hover:text-[var(--color-cyan-600)] flex items-center gap-1 transition-colors"
                  >
                    Open full directory
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols / 4 cols): Best Match Decision Card */}
              <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
                <BestMatchCard spaces={spaces} />
              </div>
            </div>

            {/* ── 5. Campus Flow Forecast Section ────────────────────────── */}
            <div className="mb-8">
              <FlowForecastChart spaces={spaces} />
            </div>

            {/* ── 6. Privacy Trust Panel ─────────────────────────────────── */}
            <div className="mb-4">
              <PrivacyTrustPanel />
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

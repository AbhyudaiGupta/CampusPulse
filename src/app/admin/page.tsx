"use client";

import { useState } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge, StatusBadge, OccupancyBar, LiveUpdateIndicator } from "@/components/ui/Primitives";
import { computeAdminMetrics } from "@/lib/mockData";
import { useSpaces, useCurrentUser, useSimulator } from "@/hooks";
import { ForecastChart } from "@/components/charts/ForecastChart";
import {
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  Settings,
  Activity,
  ShieldCheck,
  BarChart2,
  Radio,
  Sliders,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SPACE_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { AdminTopMetrics } from "@/components/admin/AdminTopMetrics";
import { AdminDigitalTwinMap } from "@/components/admin/AdminDigitalTwinMap";
import { EventFlowPipeline } from "@/components/admin/EventFlowPipeline";
import { SimulationControlDeck } from "@/components/admin/SimulationControlDeck";
import { SensorStreamPanel } from "@/components/admin/SensorStreamPanel";
import { AutomatedInsightsDeck } from "@/components/admin/AutomatedInsightsDeck";
import { WhatIfPlanner } from "@/components/admin/WhatIfPlanner";
import { HistoricalAnalytics } from "@/components/admin/HistoricalAnalytics";
import { AdminPrivacyPanel } from "@/components/admin/AdminPrivacyPanel";

export default function AdminPage() {
  const { user: appUser, loginAsDemo, reservations } = useApp();
  const { user } = useCurrentUser();
  const { spaces, refetch: refetchSpaces } = useSpaces();
  const isAdmin = (user?.role || appUser?.role) === "admin";

  const {
    status,
    insights,
    isLoading,
    isPulsing,
    start,
    stop,
    setScenario,
    reset,
    tick,
    applyInsight,
  } = useSimulator(() => {
    refetchSpaces();
  });

  const [selectedSpaceId, setSelectedSpaceId] = useState(spaces[0]?.id || "");
  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || spaces[0];

  if (!isAdmin) {
    return (
      <div className="app-layout">
        <div className="campus-grid-bg" aria-hidden />
        <Sidebar role="student" userName={user?.name ?? "Student Demo"} />
        <main className="app-main" id="main-content">
          <TopNav title="Admin Access Gate" breadcrumb={["CampusPulse", "Admin"]} />
          <div className="page-content max-w-[620px] mx-auto py-12">
            <PageTransition>
              <div className="card p-8 text-center border border-[var(--color-border-subtle)] bg-white shadow-sm">
                <div className="w-16 h-16 rounded-[14px] bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] mb-2">
                  Admin Credentials Required
                </h1>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
                  The Command Centre provides university-wide occupancy distribution, capacity thresholds,
                  and operations telemetry. You are currently signed in as{" "}
                  <strong>{user?.name || "Student"}</strong> ({user?.role || "student"} role).
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => loginAsDemo("admin")}
                    className="btn btn-primary text-[13px] py-2 px-5 font-semibold w-full sm:w-auto"
                  >
                    Authenticate as Admin Demo (Dr. Priya Menon)
                  </button>
                  <Link
                    href="/"
                    className="btn btn-secondary text-[12px] py-2 px-4 w-full sm:w-auto"
                  >
                    Return to Student Dashboard
                  </Link>
                </div>
              </div>
            </PageTransition>
          </div>
        </main>
      </div>
    );
  }

  const chartData = spaces.map((s) => ({
    name: s.name.split(" ")[0],
    full: s.name,
    occupancy: s.occupancyPercent,
    available: 100 - s.occupancyPercent,
  }));

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const space = spaces.find((s) => s.name.startsWith(label));
    return (
      <div className="bg-white border border-[var(--color-border-subtle)] rounded-[6px] px-3 py-2 text-[12px]">
        <p className="font-semibold text-[var(--color-text-primary)]">{space?.name}</p>
        <p className="text-amber-600 mt-0.5">Occupancy: {payload[0]?.value}%</p>
        <p className="text-emerald-600">Available: {space?.availableSeats} seats</p>
      </div>
    );
  };

  const handleApplyPlannerAction = async (actionTitle: string, details: string) => {
    await applyInsight({
      id: `planner-${Date.now()}`,
      spaceId: "campus-wide",
      spaceName: "Campus Operations",
      signal: "What-If Policy Applied",
      signalType: "high_capacity",
      rationale: details,
      suggestedAction: actionTitle,
      estimatedPrototypeEffect: "Rebalances spatial student flows",
      severity: "warning",
    });
  };

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role="admin" userName="Dr. Priya Menon" />
      <main className="app-main" id="main-content">
        <TopNav
          title="Campus Operations Command Centre"
          breadcrumb={["CampusPulse", "Command Centre"]}
          userName="Dr. Priya Menon"
          role="admin"
        />
        <div className="page-content space-y-6">
          <PageTransition>
            {/* ── 1. Page Header Bar ───────────────────────────────────── */}
            <div className="card p-6 border border-[var(--color-border-subtle)] bg-white mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <ShieldCheck size={22} className="text-cyan-600" />
                    <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                      Campus Operations Command Centre
                    </h1>
                    <DemoDataBadge />
                  </div>
                  <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                    Live anonymous occupancy, predicted crowd pressure, and recommended capacity actions.
                  </p>
                </div>

                {/* Status Pills / Identity Badges */}
                <div className="flex items-center gap-2 flex-wrap text-[12px]">
                  <span className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] font-semibold border border-[var(--color-border-subtle)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[2px] bg-cyan-600" />
                    Dr. Priya Menon (Administrator)
                  </span>
                  <span className="px-2.5 py-1 rounded-[6px] bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    Scenario: {status.scenarioTitle}
                  </span>
                  <LiveUpdateIndicator
                    state={status.isRunning ? "live" : "demo"}
                    label={status.isRunning ? "Live Streaming" : "Standby"}
                  />
                  {status.lastTickAt && (
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock size={12} /> Heartbeat: {new Date(status.lastTickAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── 2. Top Metric Cards (6 Cards with Mini Visualizations) ── */}
            <div className="mb-6">
              <AdminTopMetrics
                spaces={spaces}
                activeReservationsCount={reservations.filter(
                  (reservation) => reservation.status === "upcoming" || reservation.status === "active"
                ).length}
              />
            </div>

            {/* ── 3. Main Digital-Twin Map & Crowd Pressure Overlay ─────── */}
            <div className="mb-6">
              <AdminDigitalTwinMap
                spaces={spaces}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={(id) => setSelectedSpaceId(id)}
              />
            </div>

            {/* ── 4. Telemetry Pipeline Visualizer ─────────────────────── */}
            <div className="mb-6">
              <EventFlowPipeline
                isPulsing={isPulsing}
                activeScenario={status.scenarioTitle}
                lastTickTime={status.lastTickAt}
              />
            </div>

            {/* ── 5. Simulation Control Deck ───────────────────────────── */}
            <div className="mb-6">
              <SimulationControlDeck
                status={status}
                onStart={start}
                onStop={stop}
                onScenarioChange={setScenario}
                onReset={reset}
                onTick={tick}
                isLoading={isLoading}
              />
            </div>

            {/* ── 6. Simulated Sensor Stream Panel ─────────────────────── */}
            <div className="mb-6">
              <SensorStreamPanel
                events={status.recentEvents}
                lastSyncTime={status.lastTickAt}
                isRunning={status.isRunning}
              />
            </div>

            {/* ── 7. Insight & Action Section (Information, Monitor, Action needed) ── */}
            <div className="mb-6">
              <AutomatedInsightsDeck
                insights={insights}
                onApplyInsight={applyInsight}
              />
            </div>

            {/* ── 8. What-If Capacity Planner ──────────────────────────── */}
            <div className="mb-6">
              <WhatIfPlanner
                spaces={spaces}
                onApplyPlannerAction={handleApplyPlannerAction}
              />
            </div>

            {/* ── 9. Historical Operational Analytics ──────────────────── */}
            <div className="mb-6">
              <HistoricalAnalytics spaces={spaces} />
            </div>

            {/* ── 10. Privacy, Safety & Trust Governance Panel ─────────── */}
            <div className="mb-6">
              <AdminPrivacyPanel />
            </div>

            {/* ── 11. Facility Telemetry Detail & Forecast Inspector ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
              {/* Space Selector List */}
              <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                <h2 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-4">
                  Campus Facilities Live Status
                </h2>
                <div className="flex flex-col gap-2">
                  {spaces.map((space, i) => (
                    <motion.button
                      key={space.id}
                      onClick={() => setSelectedSpaceId(space.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-[10px] border text-left transition-all ${
                        selectedSpaceId === space.id
                          ? "border-cyan-500 bg-cyan-50/60 ring-1 ring-cyan-500/20"
                          : "border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      aria-pressed={selectedSpaceId === space.id}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-[var(--color-text-primary)] truncate">
                          {space.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {space.building} &bull; {space.availableSeats} of {space.capacity} free
                        </p>
                      </div>
                      <div className="w-28 shrink-0">
                        <OccupancyBar percent={space.occupancyPercent} status={space.status} height={6} />
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={space.status} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Selected Space Telemetry Card */}
              {selectedSpace && (
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
                          {selectedSpace.name}
                        </h2>
                        <p className="text-[12px] text-[var(--color-text-muted)]">
                          {SPACE_TYPE_LABELS[selectedSpace.type]} &bull; {selectedSpace.building}
                        </p>
                      </div>
                      <StatusBadge status={selectedSpace.status} />
                    </div>

                    <div className="bg-[var(--color-surface-base)] rounded-[8px] p-3 border border-[var(--color-border-subtle)] mb-4 space-y-2">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[var(--color-text-muted)]">Headroom</span>
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {selectedSpace.occupied} / {selectedSpace.capacity} ({selectedSpace.occupancyPercent}%)
                        </span>
                      </div>
                      <OccupancyBar percent={selectedSpace.occupancyPercent} status={selectedSpace.status} height={8} />
                      <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] pt-1">
                        <span>Acoustics: {selectedSpace.noiseLevel}</span>
                        <span>Est. Queue: {selectedSpace.estimatedWaitMinutes}m</span>
                      </div>
                    </div>

                    <h3 className="text-[12px] font-bold text-[var(--color-text-primary)] mb-2">
                      6-Hour Temporal Forecast
                    </h3>
                    <ForecastChart data={selectedSpace.hourlyForecast.slice(8, 20)} compact />
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
                    <Link
                      href={`/spaces/${selectedSpace.id}`}
                      className="btn btn-secondary w-full justify-center text-[12px] py-2 font-medium"
                    >
                      Open Public Space Inspector &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

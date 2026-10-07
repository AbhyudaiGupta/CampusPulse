"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { History, TrendingDown, BarChart3, Clock, Sparkles } from "lucide-react";
import type { CampusSpace } from "@/lib/types";

interface HistoricalAnalyticsProps {
  spaces: CampusSpace[];
}

const HISTORICAL_HOURLY = [
  { time: "07:00", library: 12, labs: 8, canteen: 18, campusAvg: 12 },
  { time: "08:00", library: 25, labs: 20, canteen: 42, campusAvg: 28 },
  { time: "09:00", library: 45, labs: 48, canteen: 35, campusAvg: 42 },
  { time: "10:00", library: 68, labs: 72, canteen: 30, campusAvg: 58 },
  { time: "11:00", library: 82, labs: 85, canteen: 48, campusAvg: 70 },
  { time: "12:00", library: 75, labs: 65, canteen: 94, campusAvg: 78 },
  { time: "13:00", library: 62, labs: 58, canteen: 92, campusAvg: 71 },
  { time: "14:00", library: 88, labs: 80, canteen: 45, campusAvg: 72 },
  { time: "15:00", library: 94, labs: 75, canteen: 38, campusAvg: 70 },
  { time: "16:00", library: 91, labs: 62, canteen: 42, campusAvg: 66 },
  { time: "17:00", library: 78, labs: 40, canteen: 65, campusAvg: 61 },
  { time: "18:00", library: 60, labs: 28, canteen: 78, campusAvg: 54 },
  { time: "19:00", library: 48, labs: 20, canteen: 60, campusAvg: 42 },
  { time: "20:00", library: 35, labs: 15, canteen: 35, campusAvg: 28 },
];

export function HistoricalAnalytics({ spaces }: HistoricalAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "comparison">("profile");

  // Compute underutilized spaces (< 40% current occupancy)
  const underusedSpaces = [...spaces]
    .sort((a, b) => a.occupancyPercent - b.occupancyPercent)
    .slice(0, 3);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-[var(--color-border-subtle)] rounded-[6px] p-2.5 text-[12px]">
        <p className="font-bold text-[var(--color-text-primary)] mb-1">{label}</p>
        {payload.map((item: any, i: number) => (
          <p key={i} style={{ color: item.color }} className="font-semibold text-[11px]">
            {item.name}: {item.value}%
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History size={18} className="text-cyan-600" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Historical Operational Analytics
            </h2>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Hourly demand telemetry, longitudinal resource patterns, and underutilized space metrics.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-muted)] rounded-[8px] border border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold ${
              activeTab === "profile"
                ? "bg-[var(--color-navy-950)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Hourly Campus Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold ${
              activeTab === "comparison"
                ? "bg-[var(--color-navy-950)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Multi-Resource Curve
          </button>
        </div>
      </div>

      {/* ── Main Chart View ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mb-5">
        <div className="lg:col-span-8 bg-[var(--color-surface-base)] rounded-[6px] p-4 border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3 text-[12px]">
            <span className="font-bold text-[var(--color-text-primary)]">
              {activeTab === "profile" ? "Composite Campus Demand Profile (07:00 to 20:00)" : "Facility Density Comparison by Sector"}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Aggregated sensor events baseline
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            {activeTab === "profile" ? (
              <AreaChart data={HISTORICAL_HOURLY} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="campusAvg" stroke="#0891b2" strokeWidth={2.5} fill="none" name="Campus Average Load" />
              </AreaChart>
            ) : (
              <AreaChart data={HISTORICAL_HOURLY} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="library" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} strokeWidth={2} name="Central Library" />
                <Area type="monotone" dataKey="canteen" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} name="Main Canteen" />
                <Area type="monotone" dataKey="labs" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="Computer Labs" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Right: Most Underused Resources Card */}
        <div className="lg:col-span-4 bg-[var(--color-surface-base)] rounded-[6px] p-4 border border-[var(--color-border-subtle)] space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--color-border-subtle)]">
            <TrendingDown size={14} className="text-emerald-600" />
            <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">
              Most Underutilized Facilities
            </h3>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            High available capacity identified for dynamic study diversion and energy efficiency.
          </p>

          <div className="space-y-2">
            {underusedSpaces.map((s) => (
              <div key={s.id} className="p-2.5 rounded-[7px] bg-white border border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                  <span className="text-[var(--color-text-primary)]">{s.name}</span>
                  <span className="text-emerald-700 font-bold">{s.occupancyPercent}% load</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                  <span>{s.building}</span>
                  <span className="font-semibold text-emerald-600">{s.availableSeats} of {s.capacity} seats free</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

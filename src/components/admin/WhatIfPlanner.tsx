"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { CampusSpace } from "@/lib/types";

interface WhatIfPlannerProps {
  spaces: CampusSpace[];
  onApplyPlannerAction?: (actionTitle: string, details: string) => Promise<void>;
}

type PlannerScenarioKey = "seminar_study" | "canteen_speed" | "close_maintenance";

export function WhatIfPlanner({
  spaces,
  onApplyPlannerAction,
}: WhatIfPlannerProps) {
  const [selectedScenario, setSelectedScenario] = useState<PlannerScenarioKey>("seminar_study");
  const [applied, setApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Baselines computed from current spaces
  const totalCapacity = spaces.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = spaces.reduce((acc, s) => acc + s.occupied, 0);
  const baselineAvailable = Math.max(0, totalCapacity - totalOccupied);
  const baselineCrowded = spaces.filter((s) => s.occupancyPercent >= 80).length;
  const baselineQueueWait = 11; // illustrative queue peak minutes

  const scenarios = {
    seminar_study: {
      id: "seminar_study",
      title: "Open Seminar Hall A as Temporary Study Space",
      desc: "Estimate how opening Seminar Hall A could create extra study capacity during library surges.",
      target: "Seminar Hall (Academic South)",
      effectSummary: "Illustrates a possible shift in study demand into Seminar Hall A.",
      before: {
        crowdedZones: baselineCrowded,
        availableSeats: baselineAvailable,
        queueWaitMin: baselineQueueWait,
        campusLoadPct: Math.round((totalOccupied / totalCapacity) * 100),
      },
      after: {
        crowdedZones: Math.max(0, baselineCrowded - 1),
        availableSeats: baselineAvailable + 90,
        queueWaitMin: Math.max(2, baselineQueueWait - 4),
        campusLoadPct: Math.round((totalOccupied / (totalCapacity + 120)) * 100),
      },
      distribution: [
        { name: "Central Library", before: 94, after: 72 },
        { name: "Study Room C", before: 88, after: 68 },
        { name: "Seminar Hall (New Open)", before: 15, after: 65 },
        { name: "Computer Lab 2", before: 52, after: 50 },
      ],
    },
    canteen_speed: {
      id: "canteen_speed",
      title: "Increase Canteen Service Rate",
      desc: "Estimate how faster service could affect the Main Canteen queue during meal surges.",
      target: "Main Canteen (Central Quad)",
      effectSummary: "Illustrates a possible reduction in the Main Canteen queue wait.",
      before: {
        crowdedZones: baselineCrowded,
        availableSeats: baselineAvailable,
        queueWaitMin: 14,
        campusLoadPct: Math.round((totalOccupied / totalCapacity) * 100),
      },
      after: {
        crowdedZones: Math.max(0, baselineCrowded - 1),
        availableSeats: baselineAvailable + 22,
        queueWaitMin: 4,
        campusLoadPct: Math.round((totalOccupied / totalCapacity) * 100),
      },
      distribution: [
        { name: "Main Canteen Queue", before: 88, after: 42 },
        { name: "Innovation Hub", before: 78, after: 60 },
        { name: "Study Room C", before: 82, after: 64 },
      ],
    },
    close_maintenance: {
      id: "close_maintenance",
      title: "Temporarily Close a Space",
      desc: "Estimate how closing Computer Lab 2 for maintenance could affect nearby spaces.",
      target: "Computer Lab 2 (Tech Block B)",
      effectSummary: "Illustrates possible redirection from Computer Lab 2 into nearby spaces.",
      before: {
        crowdedZones: baselineCrowded,
        availableSeats: baselineAvailable,
        queueWaitMin: baselineQueueWait,
        campusLoadPct: Math.round((totalOccupied / totalCapacity) * 100),
      },
      after: {
        crowdedZones: baselineCrowded + 1,
        availableSeats: Math.max(0, baselineAvailable - 45),
        queueWaitMin: baselineQueueWait + 2,
        campusLoadPct: Math.min(100, Math.round((totalOccupied / (totalCapacity - 60)) * 100)),
      },
      distribution: [
        { name: "Computer Lab 2 (Closed)", before: 65, after: 0 },
        { name: "Innovation Hub", before: 50, after: 78 },
        { name: "Central Library Desks", before: 70, after: 84 },
      ],
    },
  };

  const active = scenarios[selectedScenario];

  const handleApply = async () => {
    setIsApplying(true);
    setActionError(null);
    try {
      await onApplyPlannerAction?.(active.title, active.effectSummary);
      setApplied(true);
      setTimeout(() => setApplied(false), 3500);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not prepare the advisory.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal size={18} className="text-cyan-600" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              What-If Capacity &amp; Resource Planner
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-cyan-50 text-cyan-800 border border-cyan-200">
              Operations Sandbox
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Compare illustrative scenarios before making a facilities decision.
          </p>
        </div>

        <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
          Prototype assumptions &bull; no live occupancy or facility changes
        </span>
      </div>

      {/* ── Scenario Selection (Medium-radius rectangles) ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { key: "seminar_study", label: "Open Seminar Hall A as temporary study space", tag: "Overflow Study" },
          { key: "canteen_speed", label: "Increase canteen service rate", tag: "Queue Mitigation" },
          { key: "close_maintenance", label: "Temporarily close a space", tag: "Redirection Test" },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setSelectedScenario(s.key as any);
              setApplied(false);
              setActionError(null);
            }}
            className={`p-3 rounded-[8px] border text-left ${
              selectedScenario === s.key
                ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] ring-1 ring-cyan-400/20"
                : "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] ${
                selectedScenario === s.key ? "bg-white/10 text-cyan-300" : "bg-white text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
              }`}>
                {s.tag}
              </span>
            </div>
            <div className="text-[13px] font-bold leading-tight">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Active Scenario Details Box ─────────────────────────────── */}
      <div className="p-4 rounded-[6px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
              {active.title}
            </h3>
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
              {active.desc}
            </p>
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={applied || isApplying}
            className={`btn text-[12px] py-2 px-4 font-semibold flex items-center gap-1.5 rounded-[8px] shrink-0 ${
              applied
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-cyan-700 hover:bg-cyan-800 text-white"
            }`}
          >
            {applied ? (
              <>
                <CheckCircle2 size={14} /> Advisory Prepared
              </>
            ) : isApplying ? (
              "Preparing..."
            ) : (
              <>
                <Sparkles size={14} /> Prepare Student Advisory
              </>
            )}
          </button>
        </div>

        {actionError && (
          <p role="alert" className="mt-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-[7px] px-3 py-2">
            {actionError}
          </p>
        )}

        {/* ── Before vs After Visual Comparison Grid ───────────────── */}
        <p className="pt-3 text-[11px] text-[var(--color-text-muted)]">
          Before-and-after figures are example estimates from fixed scenario assumptions. They do not update live occupancy or facility settings.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
          {/* 1. Crowded Zones */}
          <div className="bg-white p-3 rounded-[8px] border border-[var(--color-border-subtle)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Crowded Zones (&gt;80%)</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-red-700">{active.before.crowdedZones}</span>
              <ArrowRight size={13} className="text-[var(--color-text-muted)]" />
              <span className="text-[18px] font-bold text-emerald-700">{active.after.crowdedZones}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {active.after.crowdedZones < active.before.crowdedZones ? "-1 congested zone" : "Managed load"}
            </span>
          </div>

          {/* 2. Available Seats */}
          <div className="bg-white p-3 rounded-[8px] border border-[var(--color-border-subtle)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Available Seats</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-slate-700">{active.before.availableSeats}</span>
              <ArrowRight size={13} className="text-[var(--color-text-muted)]" />
              <span className="text-[18px] font-bold text-emerald-700">{active.after.availableSeats}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              +{active.after.availableSeats - active.before.availableSeats} headroom
            </span>
          </div>

          {/* 3. Avg Queue Wait */}
          <div className="bg-white p-3 rounded-[8px] border border-[var(--color-border-subtle)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Example Queue Wait</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-amber-700">{active.before.queueWaitMin}m</span>
              <ArrowRight size={13} className="text-[var(--color-text-muted)]" />
              <span className="text-[18px] font-bold text-emerald-700">{active.after.queueWaitMin}m</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {active.before.queueWaitMin - active.after.queueWaitMin}m wait reduction
            </span>
          </div>

          {/* 4. Campus Density */}
          <div className="bg-white p-3 rounded-[8px] border border-[var(--color-border-subtle)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Campus Load Avg</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-slate-700">{active.before.campusLoadPct}%</span>
              <ArrowRight size={13} className="text-[var(--color-text-muted)]" />
              <span className="text-[18px] font-bold text-blue-700">{active.after.campusLoadPct}%</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
              Balanced spatial spread
            </span>
          </div>
        </div>
      </div>

      {/* ── Capacity Distribution Shift Comparison Bars ──────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-bold text-[var(--color-text-primary)]">
            Example Occupancy Shift by Zone
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Estimated before and after
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {active.distribution.map((d) => (
            <div key={d.name} className="p-3 rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
              <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                <span className="text-[var(--color-text-primary)]">{d.name}</span>
                <span className="text-[var(--color-text-muted)]">
                  {d.before}% &rarr; <strong className="text-emerald-700">{d.after}%</strong>
                </span>
              </div>
              <div className="space-y-1">
                {/* Before bar */}
                <div className="w-full h-1.5 rounded-[2px] bg-slate-200 overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${d.before}%` }} />
                </div>
                {/* After bar */}
                <div className="w-full h-1.5 rounded-[2px] bg-slate-200 overflow-hidden">
                  <div className="h-full bg-cyan-600" style={{ width: `${d.after}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

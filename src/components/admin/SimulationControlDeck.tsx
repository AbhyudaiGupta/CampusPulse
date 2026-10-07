"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Activity,
  Layers,
  Utensils,
  BookOpen,
  Monitor,
  Calendar,
  Check,
  Info,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { SimulatorScenario, SimulatorStatus } from "@/lib/types";
import { ResetConfirmModal } from "./ResetConfirmModal";

interface SimulationControlDeckProps {
  status: SimulatorStatus;
  onStart: (scenario?: SimulatorScenario, freq?: number) => Promise<void>;
  onStop: () => Promise<void>;
  onScenarioChange: (scenario: SimulatorScenario) => Promise<void>;
  onReset: () => Promise<void>;
  onTick: () => Promise<void>;
  isLoading?: boolean;
}

const SCENARIOS: {
  id: SimulatorScenario;
  title: string;
  desc: string;
  icon: typeof Activity;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: "normal",
    title: "Normal Campus Day",
    desc: "Balanced 40-60% baseline across study spaces, labs, and dining zones.",
    icon: Activity,
    badge: "Balanced",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "lunch_rush",
    title: "Lunch Rush",
    desc: "Main Canteen surges to 94% with 14m queues; library drops as students eat.",
    icon: Utensils,
    badge: "Dining Surge",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "exam_surge",
    title: "Exam Week Library Surge",
    desc: "Central Library & Study Rooms reach 96% silent capacity; zero open carrels.",
    icon: BookOpen,
    badge: "Study Spike",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "lab_release",
    title: "Lab Release",
    desc: "Computer Lab 2 vacates rapidly (85% → 20%) as scheduled session concludes.",
    icon: Monitor,
    badge: "Lab Drop",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "event_exit",
    title: "Event Exit",
    desc: "Seminar Hall empties after keynote, creating an instant crowd wave to transit.",
    icon: Calendar,
    badge: "Transit Wave",
    badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
];

export function SimulationControlDeck({
  status,
  onStart,
  onStop,
  onScenarioChange,
  onReset,
  onTick,
  isLoading = false,
}: SimulationControlDeckProps) {
  const [selectedFreq, setSelectedFreq] = useState<number>(status.frequencySeconds || 3);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTimingExplainer, setShowTimingExplainer] = useState(false);

  const isRunning = status.isRunning;
  const currentScenario = status.scenario;

  const handleTogglePlay = async () => {
    if (isRunning) {
      await onStop();
    } else {
      await onStart(currentScenario, selectedFreq);
    }
  };

  const handleFrequencyChange = async (freq: number) => {
    setSelectedFreq(freq);
    if (isRunning) {
      await onStart(currentScenario, freq);
    }
  };

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-[var(--color-border-subtle)] flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-600 inline-block" />
            <h2 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Simulation Control Deck
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-cyan-50 text-cyan-800 border border-cyan-200">
              Admin Only
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Control the simulated anonymous IoT sensor stream across campus spaces.
          </p>
        </div>

        {/* Heartbeat Status Box */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ${
                isRunning ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <div className="text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {isRunning ? "Engine Active" : "Engine Paused"}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                {status.totalTicks} ticks logged &bull; {status.lastTickAt ? `${new Date(status.lastTickAt).toLocaleTimeString()}` : "No ticks"}
              </div>
            </div>
          </div>

          {/* Primary Play / Pause Button (Strictly medium-radius rectangle) */}
          <button
            type="button"
            onClick={() => void handleTogglePlay().catch(() => {})}
            disabled={isLoading}
            className={`btn text-[13px] py-2 px-4 font-semibold flex items-center gap-2 rounded-[8px] ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-700 hover:bg-emerald-800 text-white"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={15} /> Pause Simulation
              </>
            ) : (
              <>
                <Play size={15} /> Start Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Operational Control Controls ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6 items-center">
        {/* Frequency Selector */}
        <div className="md:col-span-5">
          <label className="text-[12px] font-semibold text-[var(--color-text-secondary)] block mb-1.5 flex items-center gap-1.5">
            <Clock size={13} className="text-[var(--color-text-muted)]" />
            Update Frequency Interval
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 2, label: "2 seconds", note: "Rapid Demo" },
              { val: 3, label: "3 seconds", note: "Recommended" },
              { val: 5, label: "5 seconds", note: "Relaxed" },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                onClick={() => void handleFrequencyChange(f.val).catch(() => {})}
                className={`p-2 rounded-[8px] border text-left ${
                  selectedFreq === f.val
                    ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)]"
                    : "bg-white text-[var(--color-text-primary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)]"
                }`}
              >
                <div className="text-[12px] font-bold leading-tight">{f.label}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    selectedFreq === f.val ? "text-cyan-300" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {f.note}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Tick Fallback & Reset Controls */}
        <div className="md:col-span-7 flex items-end justify-start md:justify-end gap-3 flex-wrap">
          {/* Run 1 Simulation Tick Button */}
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1.5">
              Deterministic Step
            </span>
            <button
              type="button"
              onClick={() => void onTick().catch(() => {})}
              disabled={isLoading}
              className="btn btn-secondary text-[12px] py-2 px-3.5 font-semibold flex items-center gap-2 rounded-[8px]"
              title="Executes one immediate anonymous sensor tick"
            >
              <FastForward size={14} className="text-cyan-700" />
              Run 1 Simulation Tick
            </button>
          </div>

          {/* Reset Campus Button */}
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1.5">
              Baseline Restore
            </span>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={isLoading}
              className="btn text-[12px] py-2 px-3.5 font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 rounded-[8px]"
            >
              <RotateCcw size={13} />
              Reset Campus
            </button>
          </div>

          {/* Timing Explanation Toggle */}
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block mb-1.5">
              Demo Timing Info
            </span>
            <button
              type="button"
              onClick={() => setShowTimingExplainer((v) => !v)}
              className="btn btn-ghost text-[12px] py-2 px-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 rounded-[8px]"
              aria-label="Toggle timing explanation"
            >
              <HelpCircle size={14} />
              <span>Timing note</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Demo Timing Explainer Callout ────────────────────────────── */}
      {showTimingExplainer && (
        <div className="p-3.5 mb-5 rounded-[8px] bg-slate-50 border border-slate-200 text-[12px] text-slate-700 leading-relaxed flex items-start gap-2.5">
          <Info size={15} className="text-cyan-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-slate-900 font-semibold block mb-0.5">
              Reliable Demonstration Timing Note:
            </strong>
            Keep this page open to advance the simulation at your selected frequency. Demo values persist in this browser and are shared with its other tabs. Use <strong>“Run 1 Simulation Tick”</strong> to advance a scenario manually. Separate browsers have independent demos.
          </div>
        </div>
      )}

      {/* ── Scenarios Grid ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[13px] font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-700" />
            Preset Campus Scenarios
          </label>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Click to activate scenario dynamics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isSelected = currentScenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => void onScenarioChange(sc.id).catch(() => {})}
                className={`p-3.5 rounded-[6px] border text-left flex flex-col justify-between ${
                  isSelected
                    ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] ring-1 ring-cyan-500/20"
                    : "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)] hover:bg-white hover:border-[var(--color-border)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-[6px] border flex items-center justify-center ${
                        isSelected
                          ? "bg-cyan-900 border-cyan-700 text-cyan-300"
                          : "bg-white border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border ${
                        isSelected ? "bg-white/10 text-cyan-300 border-cyan-700/50" : sc.badgeColor
                      }`}
                    >
                      {sc.badge}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-bold leading-tight mb-1">{sc.title}</h3>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isSelected ? "text-slate-300" : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {sc.desc}
                  </p>
                </div>

                <div
                  className={`mt-3 pt-2 border-t text-[11px] font-semibold flex items-center justify-between ${
                    isSelected
                      ? "border-white/15 text-cyan-300"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <span>{isSelected ? "Active Scenario" : "Switch Scenario"}</span>
                  {isSelected && <Check size={13} className="text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={async () => {
          setShowResetModal(false);
          await onReset().catch(() => {});
        }}
        isLoading={isLoading}
      />
    </div>
  );
}

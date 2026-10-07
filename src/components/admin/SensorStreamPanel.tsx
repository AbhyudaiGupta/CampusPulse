"use client";

import { motion } from "framer-motion";
import {
  DoorOpen,
  Laptop,
  Monitor,
  Users,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Shield,
  Activity,
} from "lucide-react";
import type { SimulatedSensorEvent, SensorSourceType } from "@/lib/types";

interface SensorStreamPanelProps {
  events: SimulatedSensorEvent[];
  lastSyncTime?: string | null;
  isRunning?: boolean;
}

const SOURCES: {
  type: SensorSourceType;
  title: string;
  subtitle: string;
  hardwareTech: string;
  icon: typeof DoorOpen;
  accentColor: string;
}[] = [
  {
    type: "door_counter",
    title: "Door Counter",
    subtitle: "Bidirectional entry beam",
    hardwareTech: "Optical break-beam / ToF lidar",
    icon: DoorOpen,
    accentColor: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    type: "desk_sensor",
    title: "Desk Sensor",
    subtitle: "Anonymous seat presence",
    hardwareTech: "Ultrasonic / PIR under-desk",
    icon: Laptop,
    accentColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    type: "lab_aggregate",
    title: "Lab Aggregate",
    subtitle: "Workstation terminal active",
    hardwareTech: "Aggregated OS daemon count",
    icon: Monitor,
    accentColor: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    type: "queue_counter",
    title: "Queue Counter",
    subtitle: "Counter line depth delta",
    hardwareTech: "Line-of-flight depth array",
    icon: Users,
    accentColor: "text-amber-700 bg-amber-50 border-amber-200",
  },
];

export function SensorStreamPanel({
  events,
  lastSyncTime,
  isRunning = true,
}: SensorStreamPanelProps) {
  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={16} className="text-cyan-600" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Simulated Sensor Stream
            </h2>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Normalized anonymous edge events ingested into the occupancy pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock size={12} /> Last sync:
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : "Synchronizing..."}
          </span>
        </div>
      </div>

      {/* ── 4 Source Tiles ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {SOURCES.map((src) => {
          const Icon = src.icon;
          // Count events from this source
          const sourceEventsCount = events.filter((e) => e.source === src.type).length;
          return (
            <div
              key={src.type}
              className="p-3.5 rounded-[6px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-[7px] border flex items-center justify-center ${src.accentColor}`}>
                  <Icon size={16} />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-[1px] bg-emerald-500" />
                  Active
                </span>
              </div>

              <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">
                {src.title}
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {src.subtitle}
              </p>

              <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                <span className="truncate max-w-[120px]">{src.hardwareTech}</span>
                <span className="font-bold text-[var(--color-text-primary)]">{sourceEventsCount} msgs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Required Truthfulness Banner ───────────────────────────── */}
      <div className="p-3 mb-5 rounded-[8px] bg-cyan-50/70 border border-cyan-200 flex items-start gap-2.5 text-[12px] text-cyan-950">
        <Shield size={16} className="text-cyan-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Hardware Integration Architecture:</strong> Demo feed uses simulated anonymous counts. Production systems can send the same normalized events from approved physical door counters, desk sensors, lab-system aggregates, or aggregate network counts.
        </div>
      </div>

      {/* ── Recent Event Stream List ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
            Latest Telemetry Log ({events.length} records)
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Auto-scrolling stream
          </span>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-[8px] text-[13px] text-[var(--color-text-muted)]">
            Waiting for simulation ticks... Click &ldquo;Start Simulation&rdquo; or &ldquo;Run 1 Simulation Tick&rdquo; above.
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {events.map((ev, idx) => {
              const isPositive = ev.delta > 0;
              return (
                <motion.div
                  key={ev.id || idx}
                  className="p-2.5 rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-between gap-3 text-[12px] hover:bg-white transition-colors"
                >
                  {/* Left: Source Icon & Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-cyan-500 shrink-0" />
                    <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[140px]">
                      {ev.spaceName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] shrink-0">
                      {ev.sourceLabel.split(" ")[0]}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">
                      {ev.eventType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Right: Delta and Occupancy Status */}
                  <div className="flex items-center gap-3 shrink-0">
                    {ev.delta !== 0 && (
                      <span
                        className={`font-mono font-bold text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] ${
                          isPositive
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-blue-700 bg-blue-50 border border-blue-200"
                        }`}
                      >
                        {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {isPositive ? `+${ev.delta}` : ev.delta}
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                      {ev.newOccupancy}/{ev.capacity} ({ev.occupancyPercent}%)
                    </span>

                    <span className="text-[10px] text-[var(--color-text-muted)] hidden md:inline">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Radio, ShieldCheck, Database, LayoutDashboard, ArrowRight } from "lucide-react";

interface EventFlowPipelineProps {
  isPulsing?: boolean;
  activeScenario?: string;
  lastTickTime?: string | null;
}

export function EventFlowPipeline({
  isPulsing = false,
  activeScenario = "Normal",
  lastTickTime,
}: EventFlowPipelineProps) {
  const nodes = [
    {
      id: "source",
      icon: Radio,
      title: "Simulated Sensor Feed",
      subtitle: "Anonymous edge counters",
      badge: "Edge Source",
      accent: "text-cyan-600 bg-cyan-50 border-cyan-200",
      activeBg: "border-cyan-400",
    },
    {
      id: "validation",
      icon: ShieldCheck,
      title: "Secure Backend Gate",
      subtitle: "Admin JWT & Zod bound check",
      badge: "RBAC Guard",
      accent: "text-blue-700 bg-blue-50 border-blue-200",
      activeBg: "border-blue-400",
    },
    {
      id: "database",
      icon: Database,
      title: "Live Occupancy Database",
      subtitle: "Supabase Realtime / Memory",
      badge: "Postgres Realtime",
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
      activeBg: "border-emerald-400",
    },
    {
      id: "consumer",
      icon: LayoutDashboard,
      title: "Student Map & Admin Hub",
      subtitle: "Sub-50ms reactive updates",
      badge: "Client Realtime",
      accent: "text-amber-700 bg-amber-50 border-amber-200",
      activeBg: "border-amber-400",
    },
  ];

  return (
    <div className="card p-5 border border-[var(--color-border-subtle)] bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-500" aria-hidden />
          <h2 className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] uppercase">
            Data Architecture &amp; Telemetry Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
          <span>Active Pipeline:</span>
          <span className="font-semibold text-[var(--color-navy-950)] px-2 py-0.5 rounded-[5px] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
            {activeScenario}
          </span>
          {lastTickTime && (
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Last synced: {new Date(lastTickTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <div key={node.id} className="relative flex flex-col">
              {/* Node Card */}
              <motion.div
                className={`p-3.5 rounded-[6px] border h-full flex flex-col justify-between ${
                  isPulsing ? node.activeBg : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-[7px] border flex items-center justify-center ${node.accent}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                      {node.badge}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-[var(--color-text-primary)] leading-snug">
                    {node.title}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {node.subtitle}
                  </p>
                </div>

                {/* Status indicator bar */}
                <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">Step 0{i + 1}</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-emerald-500 inline-block" />
                    Verified
                  </span>
                </div>
              </motion.div>

              {/* Arrow connector between nodes on desktop */}
              {i < nodes.length - 1 && (
                <div
                  className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-[var(--color-border-subtle)] items-center justify-center text-[var(--color-text-muted)]"
                  aria-hidden
                >
                  <ArrowRight size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety Truthfulness Caption */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] flex items-center justify-between flex-wrap gap-2">
        <p>
          <strong className="text-[var(--color-text-secondary)]">Simulated anonymous sensor feed:</strong> Prototype uses synthetic count streams. Production adapters accept identical JSON payloads from approved optical door counters, desk sensors, or aggregate network counts.
        </p>
        <span className="text-cyan-800 font-medium bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-[5px]">
          Zero personal data or camera vision required
        </span>
      </div>
    </div>
  );
}

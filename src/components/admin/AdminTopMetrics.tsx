"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  BookMarked,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { CampusSpace } from "@/lib/types";

interface AdminTopMetricsProps {
  spaces: CampusSpace[];
  activeReservationsCount?: number;
}

export function AdminTopMetrics({
  spaces,
  activeReservationsCount = 8,
}: AdminTopMetricsProps) {
  const totalCapacity = spaces.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = spaces.reduce((acc, s) => acc + s.occupied, 0);
  const availableSeats = Math.max(0, totalCapacity - totalOccupied);
  const crowdedSpaces = spaces.filter((s) => s.occupancyPercent >= 80);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const queues = spaces.map((s) => s.estimatedWaitMinutes).filter((q) => q > 0);
  const avgQueueWait = queues.length > 0 ? (queues.reduce((a, b) => a + b, 0) / queues.length).toFixed(1) : "0.0";

  const metrics = [
    {
      id: "monitored",
      label: "Monitored Spaces",
      value: spaces.length,
      sub: "Active edge nodes",
      icon: Building2,
      accent: "text-cyan-600 bg-cyan-50 border-cyan-200",
      barPct: 100,
      barColor: "bg-cyan-500",
    },
    {
      id: "occupancy",
      label: "Current Occupancy",
      value: totalOccupied,
      unit: `/${totalCapacity}`,
      sub: `${avgOccupancy}% campus density`,
      icon: Users,
      accent: "text-blue-700 bg-blue-50 border-blue-200",
      barPct: avgOccupancy,
      barColor: avgOccupancy > 75 ? "bg-amber-500" : "bg-blue-600",
    },
    {
      id: "available",
      label: "Available Seats",
      value: availableSeats,
      sub: "Immediate headroom",
      icon: CheckCircle2,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
      barPct: totalCapacity > 0 ? Math.round((availableSeats / totalCapacity) * 100) : 0,
      barColor: "bg-emerald-500",
    },
    {
      id: "crowded",
      label: "Crowded Zones",
      value: crowdedSpaces.length,
      sub: crowdedSpaces.length > 0 ? crowdedSpaces.map((s) => s.name.split(" ")[0]).join(", ") : "None (>80%)",
      icon: AlertTriangle,
      accent: crowdedSpaces.length > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-slate-600 bg-slate-50 border-slate-200",
      barPct: spaces.length > 0 ? Math.round((crowdedSpaces.length / spaces.length) * 100) : 0,
      barColor: "bg-red-500",
    },
    {
      id: "reservations",
      label: "Active Reservations",
      value: activeReservationsCount,
      sub: "10-min active holds",
      icon: BookMarked,
      accent: "text-indigo-700 bg-indigo-50 border-indigo-200",
      barPct: Math.min(100, activeReservationsCount * 8),
      barColor: "bg-indigo-600",
    },
    {
      id: "queue",
      label: "Avg Queue Pressure",
      value: `${avgQueueWait}m`,
      sub: "Counter service delay",
      icon: Clock,
      accent: Number(avgQueueWait) > 5 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-cyan-700 bg-cyan-50 border-cyan-200",
      barPct: Math.min(100, Math.round(Number(avgQueueWait) * 6)),
      barColor: Number(avgQueueWait) > 8 ? "bg-red-500" : "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-4 border border-[var(--color-border-subtle)] bg-white flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] leading-tight truncate">
                  {m.label}
                </span>
                <div className={`w-7 h-7 rounded-[7px] border flex items-center justify-center shrink-0 ${m.accent}`}>
                  <Icon size={14} />
                </div>
              </div>

              <div className="flex items-baseline gap-1 my-1">
                <span className="text-[22px] font-extrabold text-[var(--color-text-primary)] leading-tight tracking-tight">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                    {m.unit}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {m.sub}
              </p>
            </div>

            {/* Compact mini-visualization bar */}
            <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="w-full h-1 rounded-[2px] bg-[var(--color-surface-muted)] overflow-hidden">
                <motion.div
                  className={`h-full ${m.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.barPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

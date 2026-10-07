"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Layers,
  Flame,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Volume2,
  Users,
  Compass,
} from "lucide-react";
import type { CampusSpace } from "@/lib/types";
import { OccupancyBar, StatusBadge } from "@/components/ui/Primitives";

interface AdminDigitalTwinMapProps {
  spaces: CampusSpace[];
  onSelectSpace?: (spaceId: string) => void;
  selectedSpaceId?: string;
}

export function AdminDigitalTwinMap({
  spaces,
  onSelectSpace,
  selectedSpaceId,
}: AdminDigitalTwinMapProps) {
  const [projection, setProjection] = useState<"live" | "30m" | "1h">("live");

  // Calculate projected occupancies based on temporal forecasts
  const projectedSpaces = useMemo(() => {
    return spaces.map((s) => {
      let projectedOcc = s.occupied;
      let projectedPct = s.occupancyPercent;

      if (projection === "30m") {
        // Average next 30m drift
        const nextHour = s.hourlyForecast[13]?.predicted ?? s.occupancyPercent;
        projectedPct = Math.round((s.occupancyPercent * 0.6) + (nextHour * 0.4));
        projectedOcc = Math.round((projectedPct / 100) * s.capacity);
      } else if (projection === "1h") {
        const nextHour = s.hourlyForecast[14]?.predicted ?? s.occupancyPercent;
        projectedPct = Math.round(nextHour);
        projectedOcc = Math.round((projectedPct / 100) * s.capacity);
      }

      const availableSeats = Math.max(0, s.capacity - projectedOcc);
      const status = projectedPct >= 75 ? "crowded" : projectedPct >= 40 ? "moderate" : "quiet";

      return {
        ...s,
        occupied: projectedOcc,
        availableSeats,
        occupancyPercent: projectedPct,
        status,
      } as CampusSpace;
    });
  }, [spaces, projection]);

  // Rank spaces by pressure/urgency
  const pressureRanked = useMemo(() => {
    return [...projectedSpaces].sort((a, b) => {
      // Urgency weighted by occupancy % and queue wait
      const scoreA = a.occupancyPercent + (a.estimatedWaitMinutes * 3);
      const scoreB = b.occupancyPercent + (b.estimatedWaitMinutes * 3);
      return scoreB - scoreA;
    });
  }, [projectedSpaces]);

  // Dynamic flow arrow thickness based on space loads (min 2, max 7)
  const canteenSpace = projectedSpaces.find((s) => s.type === "canteen" || s.id.includes("canteen"));
  const librarySpace = projectedSpaces.find((s) => s.id.includes("library"));
  const seminarSpace = projectedSpaces.find((s) => s.type === "event_space" || s.id.includes("seminar"));

  const flowAcademicToCanteenWidth = Math.max(2, Math.min(8, Math.round(((canteenSpace?.occupancyPercent || 50) / 100) * 8)));
  const flowHostelToLibraryWidth = Math.max(2, Math.min(8, Math.round(((librarySpace?.occupancyPercent || 50) / 100) * 8)));
  const flowSeminarToCanteenWidth = Math.max(2, Math.min(7, Math.round(((seminarSpace?.occupancyPercent || 30) / 100) * 7)));

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Section Header & Projection Toggle ─────────────────────── */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border-subtle)] flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass size={18} className="text-cyan-600" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Spatial Digital Twin &amp; Crowd Pressure Overlay
            </h2>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            High-fidelity campus spatial topology with aggregated corridor flow vectors.
          </p>
        </div>

        {/* Projection Mode Toggle (Medium-radius rectangles, no pills) */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-muted)] rounded-[8px] border border-[var(--color-border-subtle)]">
          {[
            { id: "live", label: "Live Telemetry" },
            { id: "30m", label: "+30m Projection" },
            { id: "1h", label: "+1h Projection" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setProjection(mode.id as any)}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold ${
                projection === mode.id
                  ? "bg-[var(--color-navy-950)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Split Grid: Interactive Map + Pressure Ranked Side Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Large Visual Vector Map */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative w-full aspect-[16/10] bg-[var(--color-navy-950)] rounded-[6px] overflow-hidden border border-slate-800">
            {/* Architectural Grid Lines */}
            <svg
              className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="admin-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.4" />
                </pattern>
                {/* Arrowhead marker */}
                <marker id="flow-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker id="flow-arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#admin-map-grid)" />
            </svg>

            {/* SVG Illustrative Campus Walkways & Flow Arrows */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 625" preserveAspectRatio="none">
              {/* Campus Roads / Paths */}
              <path
                d="M 120 480 Q 300 450 500 380 T 880 200"
                fill="none"
                stroke="#1e293b"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M 280 180 Q 420 260 520 380 T 640 480"
                fill="none"
                stroke="#1e293b"
                strokeWidth="24"
                strokeLinecap="round"
              />

              {/* 1. Flow Arrow: Academic Block (480, 200) to Main Canteen (680, 420) */}
              <motion.path
                d="M 480 220 Q 580 300 660 400"
                fill="none"
                stroke="#f59e0b"
                strokeWidth={flowAcademicToCanteenWidth}
                strokeDasharray="8 6"
                markerEnd="url(#flow-arrow-amber)"
              />

              {/* 2. Flow Arrow: Hostel Gate (140, 490) to Central Library (340, 180) */}
              <motion.path
                d="M 160 470 Q 240 330 330 200"
                fill="none"
                stroke="#38bdf8"
                strokeWidth={flowHostelToLibraryWidth}
                strokeDasharray="8 6"
                markerEnd="url(#flow-arrow)"
              />

              {/* 3. Flow Arrow: Seminar Hall (820, 220) to Main Canteen (700, 400) */}
              <motion.path
                d="M 810 240 Q 770 320 710 390"
                fill="none"
                stroke="#38bdf8"
                strokeWidth={flowSeminarToCanteenWidth}
                strokeDasharray="6 6"
                markerEnd="url(#flow-arrow)"
              />
            </svg>

            {/* Interactive Space Markers on Digital Twin */}
            {projectedSpaces.map((space) => {
              const x = space.coordinates?.mapX ?? 50;
              const y = space.coordinates?.mapY ?? 50;
              const isSelected = selectedSpaceId === space.id;
              const isCrowded = space.status === "crowded";
              const isModerate = space.status === "moderate";

              const pinColor = isCrowded
                ? "bg-red-500 border-red-300 text-white"
                : isModerate
                ? "bg-amber-500 border-amber-300 text-white"
                : "bg-emerald-500 border-emerald-300 text-white";

              return (
                <div
                  key={space.id}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  onClick={() => onSelectSpace?.(space.id)}
                >
                  {/* High congestion marker */}
                  {isCrowded && (
                    <span className="absolute inset-0 rounded-[6px] bg-red-400 opacity-30 pointer-events-none" />
                  )}

                  <div
                    className={`px-2.5 py-1.5 rounded-[6px] border flex items-center gap-1.5 ${pinColor} ${
                      isSelected ? "ring-1 ring-cyan-300" : ""
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-white inline-block" />
                    <span className="font-bold text-[11px] tracking-tight whitespace-nowrap">
                      {space.name.split(" ")[0]}
                    </span>
                    <span className="font-mono text-[10px] font-extrabold opacity-95">
                      {space.occupancyPercent}%
                    </span>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                    <div className="bg-white text-slate-900 text-[11px] rounded-[6px] py-1.5 px-2.5 border border-slate-200 whitespace-nowrap font-medium">
                      <p className="font-bold text-slate-950">{space.name}</p>
                      <p className="text-slate-600">
                        {space.occupied}/{space.capacity} occupied &bull; {space.availableSeats} open
                      </p>
                      {space.estimatedWaitMinutes > 0 && (
                        <p className="text-amber-700 font-semibold">
                          Queue: {space.estimatedWaitMinutes} min delay
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Legend (Bottom-Left) */}
            <div className="absolute bottom-3 left-3 bg-slate-900 border border-slate-700 rounded-[6px] px-3 py-2 text-[10px] text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-emerald-500 inline-block" /> Quiet (&lt;40%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-amber-500 inline-block" /> Moderate (40-75%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-red-500 inline-block" /> Crowded (&gt;75%)
              </span>
            </div>
          </div>

          {/* Crowd Flow Illustration Caption & Truthfulness Notice */}
          <div className="p-3 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-[8px] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] flex-wrap gap-2">
            <span className="text-[var(--color-text-secondary)] font-medium">
              Illustrative flow from aggregated prototype events.
            </span>
            <span>
              Vector paths reflect transit pressure &bull; Never implies individual tracking or identity inspection.
            </span>
          </div>
        </div>

        {/* Right Column (4 cols): Pressure-Zone Side Panel Ranked by Urgency */}
        <div className="lg:col-span-4 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-[6px] p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-1.5">
                <Flame size={15} className="text-amber-600" />
                <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">
                  Pressure Ranked Urgency
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                Ranked 1 to {pressureRanked.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {pressureRanked.map((s, idx) => {
                const isTopUrgent = idx === 0 && s.occupancyPercent >= 75;
                const isSelected = selectedSpaceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSpace?.(s.id)}
                    className={`p-2.5 rounded-[6px] border cursor-pointer ${
                      isSelected
                        ? "bg-white border-cyan-500 ring-1 ring-cyan-400/30"
                        : "bg-white border-[var(--color-border-subtle)] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-[4px] text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? "bg-red-100 text-red-800"
                              : idx === 1
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-[12px] text-[var(--color-text-primary)] truncate">
                          {s.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[11px] text-[var(--color-text-primary)]">
                        {s.occupancyPercent}%
                      </span>
                    </div>

                    <OccupancyBar percent={s.occupancyPercent} status={s.status} height={4} />

                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5 pt-1 border-t border-[var(--color-border-subtle)]">
                      <span>{s.availableSeats} open seats</span>
                      {s.estimatedWaitMinutes > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          Queue: {s.estimatedWaitMinutes}m
                        </span>
                      ) : (
                        <span>Acoustics: {s.noiseLevel}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-muted)] text-center">
            Click any facility card to focus on Digital Twin
          </div>
        </div>
      </div>
    </div>
  );
}

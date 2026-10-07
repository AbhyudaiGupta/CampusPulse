"use client";

import { useState } from "react";
import type { CampusSpace } from "@/lib/types";
import { MapPin, Users, Clock } from "lucide-react";
import Link from "next/link";

interface MiniHeatmapProps {
  spaces: CampusSpace[];
  className?: string;
}

export function MiniHeatmap({ spaces, className }: MiniHeatmapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeSpace = spaces.find((s) => s.id === hoveredId);

  return (
    <div
      className={`relative bg-[var(--color-navy-950)] rounded-[6px] p-5 border border-[var(--color-navy-700)] text-white overflow-hidden ${className || ""}`}
      aria-label="Campus occupancy live heatmap"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-[2px] h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-300">
            Live Campus Heatmap
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {spaces.length} active zones
        </span>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full aspect-[16/10] max-h-[220px]">
        <svg
          viewBox="0 0 100 62"
          className="w-full h-full rounded-[4px]"
          aria-label="Campus spatial nodes"
          role="img"
        >
          {/* Subtle connecting walkways */}
          <path
            d="M 35 28 L 58 42 L 65 35 L 48 70 L 22 55 Z"
            fill="none"
            stroke="rgba(34, 211, 238, 0.12)"
            strokeWidth="0.8"
            strokeDasharray="1.5 1.5"
          />
          <path
            d="M 35 28 L 40 22 L 65 35"
            fill="none"
            stroke="rgba(34, 211, 238, 0.15)"
            strokeWidth="0.8"
          />

          {/* Buildings Footprints */}
          <g opacity="0.45">
            {/* Block A */}
            <rect
              x="26"
              y="14"
              width="24"
              height="20"
              rx="2"
              fill="#163056"
              stroke="#2756a8"
              strokeWidth="0.4"
            />
            <text x="38" y="19" fontSize="2.2" fill="#94a3b8" textAnchor="middle" fontFamily="Inter">
              Block A
            </text>

            {/* Block B */}
            <rect
              x="52"
              y="28"
              width="26"
              height="22"
              rx="2"
              fill="#163056"
              stroke="#2756a8"
              strokeWidth="0.4"
            />
            <text x="65" y="32" fontSize="2.2" fill="#94a3b8" textAnchor="middle" fontFamily="Inter">
              Block B
            </text>

            {/* Student Centre */}
            <rect
              x="12"
              y="44"
              width="22"
              height="14"
              rx="2"
              fill="#1e4080"
              stroke="#2756a8"
              strokeWidth="0.4"
            />
            <text x="23" y="48" fontSize="2.2" fill="#94a3b8" textAnchor="middle" fontFamily="Inter">
              Student Hub
            </text>

            {/* Block C */}
            <rect
              x="38"
              y="48"
              width="22"
              height="12"
              rx="2"
              fill="#163056"
              stroke="#2756a8"
              strokeWidth="0.4"
            />
            <text x="49" y="52" fontSize="2.2" fill="#94a3b8" textAnchor="middle" fontFamily="Inter">
              Block C
            </text>
          </g>

          {/* Interactive Space Markers */}
          {spaces.map((s) => {
            const x = s.coordinates.mapX;
            // Scale mapY slightly to fit 62 height
            const y = (s.coordinates.mapY / 100) * 60 + 2;
            const isHovered = hoveredId === s.id;
            const isHigh = s.occupancyPercent >= 75;
            const isLow = s.occupancyPercent < 40;
            const color = isLow ? "#10b981" : isHigh ? "#ef4444" : "#f59e0b";

            return (
              <g
                key={s.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(s.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => setHoveredId(s.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setHoveredId(s.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${s.name}: ${s.occupancyPercent}% occupied`}
              >
                {/* Crowded-space marker */}
                {isHigh && (
                  <circle
                    cx={x}
                    cy={y}
                    r="5.5"
                    fill={color}
                    fillOpacity="0.25"
                  />
                )}

                {/* Outer Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "4.8" : "3.6"}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? "1.2" : "0.6"}
                  strokeOpacity={isHovered ? "1" : "0.7"}
                />

                {/* Inner Core */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "3.2" : "2.4"}
                  fill={color}
                />

                {/* Label text */}
                <text
                  x={x}
                  y={y - 4.5}
                  fontSize="2.4"
                  fontWeight="600"
                  fill={isHovered ? "#22d3ee" : "#f1f5f9"}
                  textAnchor="middle"
                  fontFamily="Inter"
                >
                  {s.name.split(" ")[0]}
                </text>
                <text
                  x={x}
                  y={y + 0.8}
                  fontSize="1.7"
                  fontWeight="700"
                  fill="#ffffff"
                  textAnchor="middle"
                  fontFamily="Inter"
                >
                  {s.occupancyPercent}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        {activeSpace && (
          <div
            className="absolute bottom-2 left-2 right-2 bg-[var(--color-navy-950)] border border-[var(--color-navy-700)] rounded-[4px] p-2.5 flex items-center justify-between text-[11px] pointer-events-none"
          >
            <div>
              <p className="font-semibold text-white truncate">{activeSpace.name}</p>
              <p className="text-slate-400 text-[10px] flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {activeSpace.distanceMinutes} min walk
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users size={10} /> {activeSpace.availableSeats} seats open
                </span>
              </p>
            </div>
            <div className="text-right pl-2">
              <span
                className={`inline-block px-1.5 py-0.5 rounded-[5px] font-bold text-[10px] ${
                  activeSpace.occupancyPercent < 40
                    ? "bg-emerald-500/20 text-emerald-400"
                    : activeSpace.occupancyPercent < 75
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {activeSpace.occupancyPercent}% load
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link to interactive map */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-[var(--color-navy-700)] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Quiet (&lt;40%)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Mod (40-75%)
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Crowded (&gt;75%)
          </span>
        </div>
        <Link
          href="/map"
          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <MapPin size={11} /> Open Full Map
        </Link>
      </div>
    </div>
  );
}

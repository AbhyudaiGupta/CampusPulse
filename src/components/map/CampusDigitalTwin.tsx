"use client";

import { useState } from "react";
import type { CampusSpace } from "@/lib/types";
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  Compass,
  Footprints,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CampusDigitalTwinProps {
  spaces: CampusSpace[];
  selectedSpaceId: string | null;
  onSelectSpace: (id: string) => void;
  showStudentLocation: boolean;
  showBestRoute: boolean;
  targetSpaceId?: string;
  timeOffsetHours: number; // 0 for live, 0.5 for 30m, 1 for 1h, 6 for 6h
}

// Map coordinates for fictional campus buildings (1000 x 640 viewBox)
interface BuildingAnchor {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
}

const BUILDINGS: BuildingAnchor[] = [
  {
    id: "bldg-library",
    name: "Library Block",
    label: "Library Block",
    x: 180,
    y: 110,
    w: 190,
    h: 140,
    fill: "#e2eaf4",
    stroke: "#b8cce2",
  },
  {
    id: "bldg-academic",
    name: "Academic Block",
    label: "Academic Block A",
    x: 420,
    y: 90,
    w: 220,
    h: 150,
    fill: "#e2eaf4",
    stroke: "#b8cce2",
  },
  {
    id: "bldg-labs",
    name: "Computer Labs",
    label: "Tech Block B - Labs",
    x: 690,
    y: 130,
    w: 190,
    h: 130,
    fill: "#e2eaf4",
    stroke: "#b8cce2",
  },
  {
    id: "bldg-study",
    name: "Study Rooms",
    label: "Quiet Study Annex",
    x: 370,
    y: 270,
    w: 160,
    h: 90,
    fill: "#dff0ea",
    stroke: "#a7d7c5",
  },
  {
    id: "bldg-canteen",
    name: "Main Canteen",
    label: "Student Dining Centre",
    x: 180,
    y: 350,
    w: 170,
    h: 130,
    fill: "#fef3c7",
    stroke: "#fcd34d",
  },
  {
    id: "bldg-hub",
    name: "Innovation Hub",
    label: "Innovation Pavilion",
    x: 710,
    y: 310,
    w: 180,
    h: 140,
    fill: "#e2eaf4",
    stroke: "#b8cce2",
  },
  {
    id: "bldg-seminar",
    name: "Seminar Hall",
    label: "Auditorium & Events",
    x: 450,
    y: 400,
    w: 190,
    h: 130,
    fill: "#e2eaf4",
    stroke: "#b8cce2",
  },
  {
    id: "bldg-gate",
    name: "Hostel Gate",
    label: "Hostel Gate (Campus Entry)",
    x: 70,
    y: 520,
    w: 150,
    h: 80,
    fill: "#dbeafe",
    stroke: "#93c5fd",
  },
];

// Coordinate anchors for spaces in the 1000x640 canvas
const SPACE_CANVAS_COORDS: Record<string, { x: number; y: number }> = {
  "central-library": { x: 275, y: 180 },
  "study-room-c": { x: 450, y: 315 },
  "computer-lab-2": { x: 785, y: 195 },
  "main-canteen": { x: 265, y: 415 },
  "innovation-hub": { x: 800, y: 380 },
  "seminar-hall-a": { x: 545, y: 465 },
};

// Walking route paths from Hostel Gate (145, 560) to destinations
const ROUTES_FROM_GATE: Record<string, string> = {
  "study-room-c": "M 145 560 L 265 490 L 350 420 L 450 315",
  "central-library": "M 145 560 L 210 440 L 220 300 L 275 180",
  "main-canteen": "M 145 560 L 200 480 L 265 415",
  "computer-lab-2": "M 145 560 L 350 490 L 580 380 L 710 260 L 785 195",
  "innovation-hub": "M 145 560 L 350 510 L 600 450 L 730 410 L 800 380",
  "seminar-hall-a": "M 145 560 L 320 520 L 450 490 L 545 465",
};

export function CampusDigitalTwin({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  showStudentLocation,
  showBestRoute,
  targetSpaceId = "study-room-c",
  timeOffsetHours,
}: CampusDigitalTwinProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compute projected occupancy for each space based on time offset
  function getProjectedStats(space: CampusSpace) {
    if (timeOffsetHours === 0) {
      return {
        occupied: space.occupied,
        available: space.availableSeats,
        percent: space.occupancyPercent,
        status: space.status,
      };
    }
    const currentHour = 12; // Base noon simulated hour
    const projectedHour = Math.min(23, Math.round(currentHour + timeOffsetHours));
    const forecastPoint = space.hourlyForecast.find((f) => f.hour === projectedHour);
    const predictedPercent = forecastPoint ? forecastPoint.predicted : space.occupancyPercent;
    const predictedOccupied = Math.round((predictedPercent / 100) * space.capacity);
    const predictedAvailable = Math.max(0, space.capacity - predictedOccupied);
    const predictedStatus: CampusSpace["status"] =
      predictedPercent < 40 ? "quiet" : predictedPercent < 75 ? "moderate" : "crowded";

    return {
      occupied: predictedOccupied,
      available: predictedAvailable,
      percent: predictedPercent,
      status: predictedStatus,
    };
  }

  // Active walking route string
  const activeRoutePath = ROUTES_FROM_GATE[selectedSpaceId || targetSpaceId] || ROUTES_FROM_GATE["study-room-c"];
  const targetSpace = spaces.find((s) => s.id === (selectedSpaceId || targetSpaceId));

  return (
    <div className="relative w-full h-[620px] rounded-[6px] overflow-hidden bg-[#0a1628] border border-[var(--color-navy-700)] select-none">
      {/* Background architectural grid and contours */}
      <svg
        viewBox="0 0 1000 640"
        className="w-full h-full object-cover"
        aria-label="Interactive Campus Intelligence Vector Digital Twin"
        role="region"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>

        </defs>

        {/* Base ground & grid */}
        <rect width="1000" height="640" fill="#0b172a" />
        <rect width="1000" height="640" fill="url(#campusGrid)" />

        {/* Topographic landscape curves (Campus Greens) */}
        <path
          d="M 0 200 Q 250 160 500 240 T 1000 200 L 1000 0 L 0 0 Z"
          fill="#081324"
          opacity="0.8"
        />
        <path
          d="M 0 540 Q 300 480 600 520 T 1000 480 L 1000 640 L 0 640 Z"
          fill="#081324"
          opacity="0.9"
        />

        {/* Central Courtyard Greenery */}
        <ellipse cx="440" cy="270" rx="90" ry="50" fill="#0d233a" stroke="#16375c" strokeWidth="1" />
        <text x="440" y="274" fontSize="11" fill="#476585" textAnchor="middle" fontFamily="Inter" fontWeight="500">
          Central Quadrangle
        </text>

        {/* Walkway Network */}
        <g stroke="#1b3558" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7">
          {/* Main Arterial Paths */}
          <path d="M 145 560 L 265 415 L 440 270 L 450 160" />
          <path d="M 440 270 L 275 180" />
          <path d="M 440 270 L 785 195" />
          <path d="M 440 270 L 545 465 L 800 380" />
          <path d="M 265 415 L 545 465" />
          <path d="M 785 195 L 800 380" />
        </g>
        {/* Inner Walkway inlays */}
        <g stroke="#294e7a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8">
          <path d="M 145 560 L 265 415 L 440 270 L 450 160" />
          <path d="M 440 270 L 275 180" />
          <path d="M 440 270 L 785 195" />
          <path d="M 440 270 L 545 465 L 800 380" />
          <path d="M 265 415 L 545 465" />
          <path d="M 785 195 L 800 380" />
        </g>

        {/* Campus Buildings Layout */}
        {BUILDINGS.map((b) => (
          <g key={b.id}>
            {/* Building Shadow */}
            <rect
              x={b.x + 4}
              y={b.y + 6}
              width={b.w}
              height={b.h}
              rx={12}
              fill="rgba(0,0,0,0.5)"
            />

            {/* Building Body */}
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={10}
              fill="#0f223f"
              stroke="#22426d"
              strokeWidth={1.5}
            />

            {/* Architectural Interior Division Accent */}
            <rect
              x={b.x + 8}
              y={b.y + 8}
              width={b.w - 16}
              height={b.h - 16}
              rx={6}
              fill="#142c50"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />

            {/* Building Label */}
            <text
              x={b.x + b.w / 2}
              y={b.y + 24}
              fontSize="12"
              fontWeight="700"
              fill="#e2e8f0"
              textAnchor="middle"
              fontFamily="Inter"
              letterSpacing="0.2px"
            >
              {b.name}
            </text>
            <text
              x={b.x + b.w / 2}
              y={b.y + 40}
              fontSize="10"
              fontWeight="500"
              fill="#7b9bbd"
              textAnchor="middle"
              fontFamily="Inter"
            >
              {b.label}
            </text>
          </g>
        ))}

        {/* Animated Walking Route (When 'Find my best route' is enabled) */}
        {showBestRoute && (
          <g>
            {/* Active route */}
            <path
              d={activeRoutePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="6 6"
            />
          </g>
        )}

        {/* Simulated Student Location at Hostel Gate */}
        {showStudentLocation && (
          <g transform="translate(145, 560)">
            <circle cx="0" cy="0" r="16" fill="#38bdf8" fillOpacity="0.12" />
            <circle cx="0" cy="0" r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
            {/* Tooltip callout */}
            <rect x="-65" y="-34" width="130" height="22" rx="6" fill="#040d1f" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="-19" fill="#e0f2fe" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="Inter">
              You are here (Hostel Gate)
            </text>
          </g>
        )}

        {/* Live Resource Markers Layer */}
        {spaces.map((space) => {
          const coords = SPACE_CANVAS_COORDS[space.id];
          if (!coords) return null;

          const stats = getProjectedStats(space);
          const isSelected = selectedSpaceId === space.id;
          const isHovered = hoveredId === space.id;

          const markerColor =
            stats.status === "quiet"
              ? "#10b981"
              : stats.status === "moderate"
              ? "#f59e0b"
              : "#ef4444";

          const isCrowded = stats.status === "crowded";

          return (
            <g
              key={space.id}
              transform={`translate(${coords.x}, ${coords.y})`}
              onClick={() => onSelectSpace(space.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectSpace(space.id);
                }
              }}
              onMouseEnter={() => setHoveredId(space.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer group"
              tabIndex={0}
              role="button"
              aria-label={`${space.name}: ${stats.available} seats available`}
            >
              {/* Crowded status marker */}
              {isCrowded && (
                <circle
                  cx="0"
                  cy="0"
                  r="28"
                  fill={markerColor}
                  fillOpacity="0.2"
                />
              )}

              {/* Selection Ring */}
              {isSelected && (
                <circle
                  cx="0"
                  cy="0"
                  r="24"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Main Badge Base */}
              <circle
                cx="0"
                cy="0"
                r={isHovered ? 18 : 15}
                fill="#040d1f"
                stroke={markerColor}
                strokeWidth={isHovered ? 3 : 2.2}
              />

              {/* Center status dot */}
              <circle cx="0" cy="0" r={isHovered ? 8 : 6} fill={markerColor} />

              {/* Available Seats Pill Banner */}
              <g transform="translate(0, -24)">
                <rect
                  x="-36"
                  y="-12"
                  width="72"
                  height="20"
                  rx="6"
                  fill="#040d1f"
                  stroke={markerColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="2"
                  fontSize="10"
                  fontWeight="700"
                  fill="#ffffff"
                  textAnchor="middle"
                  fontFamily="Inter"
                >
                  {stats.available} seats
                </text>
              </g>

              {/* Space Name Tag */}
              <text
                x="0"
                y="27"
                fontSize="11"
                fontWeight="700"
                fill={isSelected ? "#22d3ee" : isHovered ? "#ffffff" : "#cbd5e1"}
                textAnchor="middle"
                fontFamily="Inter"
              >
                {space.name}
              </text>

              {/* Minimal Hover Flyout Tooltip */}
              {isHovered && (
                <g transform="translate(0, 42)">
                  <rect
                    x="-65"
                    y="0"
                    width="130"
                    height="38"
                    rx="6"
                    fill="#040d1f"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x="0" y="15" fill="#f8fafc" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="Inter">
                    {stats.percent}% occupied ({stats.occupied}/{space.capacity})
                  </text>
                  <text x="0" y="29" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="Inter">
                    {space.distanceMinutes} min walk | {space.noiseLevel}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Walking Route Notification Banner */}
      {showBestRoute && targetSpace && (
        <div className="absolute top-4 left-4 bg-[#040d1f] border border-cyan-500/50 rounded-[6px] px-3.5 py-2 text-white flex items-center gap-3 z-20 text-[12px]">
          <div className="p-1.5 rounded-[6px] bg-cyan-500/20 text-cyan-400">
            <Footprints size={15} />
          </div>
          <div>
            <p className="font-bold text-cyan-300">
              Optimal Walking Route: Hostel Gate to {targetSpace.name}
            </p>
            <p className="text-slate-300 text-[11px]">
              Est. time: {targetSpace.distanceMinutes} min (approx. 180m covered walkway)
            </p>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-[#040d1f] border border-[var(--color-navy-700)] rounded-[6px] p-2.5 text-white flex items-center gap-4 text-[11px] z-10 flex-wrap">
        <span className="font-semibold text-slate-300">Occupancy:</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Quiet (&lt;40%)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Moderate (40-75%)
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Crowded (&gt;75%)
        </span>
      </div>
    </div>
  );
}

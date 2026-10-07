"use client";

import { useState } from "react";
import type { CampusSpace } from "@/lib/types";
import {
  MapPin,
  Clock,
  Users,
  Wifi,
  Zap,
  Monitor,
  Accessibility,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Volume2,
  Volume1,
  VolumeX,
  ChevronDown,
  ChevronUp,
  BookMarked,
  UtensilsCrossed,
} from "lucide-react";
import { SPACE_TYPE_LABELS, cn, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface LiveResourceCardProps {
  space: CampusSpace;
  index?: number;
}

export function LiveResourceCard({ space, index = 0 }: LiveResourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status badge config (Strictly non-pill)
  const statusConfig = {
    quiet: { label: "Available", class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    moderate: { label: "Moderate", class: "text-amber-700 bg-amber-50 border-amber-200" },
    crowded: { label: "Crowded", class: "text-red-700 bg-red-50 border-red-200" },
    closed: { label: "Closed", class: "text-slate-500 bg-slate-100 border-slate-200" },
  }[space.status];

  // Noise icon & label
  function getNoiseDetails(level: string) {
    if (level === "silent") return { icon: <VolumeX size={12} />, label: "Silent zone" };
    if (level === "quiet") return { icon: <Volume1 size={12} />, label: "Quiet study" };
    if (level === "moderate") return { icon: <Volume2 size={12} />, label: "Conversational" };
    return { icon: <Volume2 size={12} />, label: "Active dining" };
  }
  const noise = getNoiseDetails(space.noiseLevel);

  // Forecast trend calculation
  const nextHourForecast = space.hourlyForecast[1]?.predicted ?? space.occupancyPercent;
  const trendDiff = nextHourForecast - space.occupancyPercent;
  const trend =
    trendDiff > 3
      ? { label: "Rising", icon: <TrendingUp size={12} className="text-red-500" /> }
      : trendDiff < -3
      ? { label: "Easing", icon: <TrendingDown size={12} className="text-emerald-500" /> }
      : { label: "Steady", icon: <Minus size={12} className="text-slate-400" /> };

  function renderFacilityIcon(f: string) {
    const l = f.toLowerCase();
    if (l.includes("wi-fi") || l.includes("wifi")) return <Wifi size={13} />;
    if (l.includes("power") || l.includes("outlet")) return <Zap size={13} />;
    if (l.includes("computer") || l.includes("desktop")) return <Monitor size={13} />;
    if (l.includes("accessible")) return <Accessibility size={13} />;
    return null;
  }

  return (
    <motion.div
      className="card p-4.5 border border-[var(--color-border-subtle)] hover:border-[var(--color-cyan-500)] bg-white relative group"
    >
      {/* Top Header: Name, Location, Status Chip (medium radius, NOT pill) */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/spaces/${space.id}`}
              className="text-[15px] font-bold text-[var(--color-text-primary)] hover:text-[var(--color-cyan-600)] transition-colors truncate"
            >
              {space.name}
            </Link>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
            <MapPin size={12} className="shrink-0 text-[var(--color-text-muted)]" />
            <span>{space.building}, {space.floor}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock size={11} /> {space.distanceMinutes} min walk
            </span>
          </p>
        </div>

        {/* Medium-radius status chip */}
        <span
          className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-[7px] border shrink-0 tracking-wide uppercase",
            statusConfig.class
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Occupancy Bar & Live Load */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[12px] mb-1">
          <span className="text-[var(--color-text-muted)] flex items-center gap-1">
            <Users size={12} />
            <strong className="text-[var(--color-text-primary)]">{space.occupied}</strong> / {space.capacity} occupied
          </span>
          <span className="font-bold text-[var(--color-text-primary)]">
            {space.occupancyPercent}% load
          </span>
        </div>

        {/* Animated Bar */}
        <div className="h-2 w-full bg-[var(--color-surface-muted)] rounded-[4px] overflow-hidden">
          <motion.div
            style={{ width: `${space.occupancyPercent}%` }}
            className={`h-full rounded-[4px] ${
              space.status === "quiet"
                ? "bg-emerald-500"
                : space.status === "moderate"
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Middle Specs: Available seats, Noise, Trend */}
      <div className="flex items-center justify-between text-[11px] pt-1 pb-2 border-b border-[var(--color-border-subtle)] gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] font-semibold">
          <span>{space.availableSeats} seats open</span>
        </div>

        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          {noise.icon}
          <span>{noise.label}</span>
        </div>

        <div className="flex items-center gap-1 text-[var(--color-text-muted)] font-medium">
          {trend.icon}
          <span>{trend.label}</span>
        </div>
      </div>

      {/* Facilities row & updated time */}
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-2.5 mb-3">
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          {space.facilities.map((fac) => {
            const icon = renderFacilityIcon(fac);
            return icon ? (
              <span key={fac} className="p-1 rounded-[5px] bg-[var(--color-surface-base)]" title={fac}>
                {icon}
              </span>
            ) : null;
          })}
        </div>
        <span suppressHydrationWarning>Updated {formatRelativeTime(space.lastUpdated)}</span>
      </div>

      {/* Actions (Medium-radius rectangular buttons) */}
      <div className="flex items-center gap-2">
        <Link
          href={`/spaces/${space.id}`}
          className="btn btn-secondary flex-1 justify-center text-[12px] py-1.5 font-medium"
        >
          View details
        </Link>
        {space.type === "canteen" ? (
          <Link
            href={`/spaces/${space.id}`}
            className="btn btn-outline text-[12px] py-1.5 px-3 font-medium flex items-center gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <UtensilsCrossed size={12} />
            View queue
          </Link>
        ) : (
          <Link
            href={`/spaces/${space.id}`}
            className="btn btn-primary text-[12px] py-1.5 px-3 font-medium flex items-center gap-1"
          >
            <BookMarked size={12} />
            Reserve
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-[7px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] transition-colors"
          aria-label="Expand space preview"
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expand-on-click microinteraction */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] space-y-2 bg-[var(--color-surface-base)] p-3 rounded-[8px]">
              <p className="leading-relaxed">{space.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className="bg-white p-1.5 rounded-[5px] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block">Wait estimate:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {space.estimatedWaitMinutes > 0 ? `${space.estimatedWaitMinutes} min` : "No queue"}
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-[5px] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block">Accessibility:</span>
                  <span className="font-bold text-emerald-600">
                    {space.accessible ? "Wheelchair ramp & elevator" : "Standard access"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

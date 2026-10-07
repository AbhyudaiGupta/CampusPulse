"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, Wifi, Zap, Monitor, ChevronRight } from "lucide-react";
import { cn, STATUS_CONFIG, SPACE_TYPE_LABELS, formatRelativeTime } from "@/lib/utils";
import { StatusBadge, OccupancyBar } from "@/components/ui/Primitives";
import type { CampusSpace } from "@/lib/types";

// ── Facility Icon ─────────────────────────────────────────────────────────────

function FacilityIcon({ facility }: { facility: string }) {
  const lower = facility.toLowerCase();
  if (lower.includes("wi-fi") || lower.includes("wifi")) return <Wifi size={11} />;
  if (lower.includes("power") || lower.includes("outlet")) return <Zap size={11} />;
  if (lower.includes("computer") || lower.includes("desktop")) return <Monitor size={11} />;
  return null;
}

// ── ResourceCard ──────────────────────────────────────────────────────────────

interface ResourceCardProps {
  space: CampusSpace;
  index?: number;
  compact?: boolean;
}

export function ResourceCard({ space, index = 0, compact = false }: ResourceCardProps) {
  const cfg = STATUS_CONFIG[space.status];
  const available = space.status !== "closed";

  return (
    <motion.div
    >
      <Link href={`/spaces/${space.id}`} className="resource-card block" aria-label={`${space.name}, ${cfg.label}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)] truncate leading-tight">
              {space.name}
            </h3>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
              {SPACE_TYPE_LABELS[space.type]} &bull; {space.building}
            </p>
          </div>
          <StatusBadge status={space.status} className="shrink-0 mt-0.5" />
        </div>

        {/* Occupancy */}
        {!compact && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Users size={12} aria-hidden />
                {space.occupied} of {space.capacity} occupied
              </span>
              <span className="font-semibold text-[var(--color-text-secondary)]">
                {space.occupancyPercent}%
              </span>
            </div>
            <OccupancyBar percent={space.occupancyPercent} status={space.status} />
            <p className="text-[11px] text-emerald-600 font-medium">
              {available ? `${space.availableSeats} seats available` : "Currently closed"}
            </p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
            <MapPin size={11} aria-hidden />
            {space.floor}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
            <Clock size={11} aria-hidden />
            {space.distanceMinutes} min walk
          </span>
          {space.estimatedWaitMinutes > 0 && (
            <span className="text-[11px] text-amber-600 font-medium">
              ~{space.estimatedWaitMinutes}m wait
            </span>
          )}
        </div>

        {/* Facilities */}
        {!compact && space.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {space.facilities.slice(0, 4).map((f) => (
              <span key={f} className="chip">
                <FacilityIcon facility={f} />
                {f}
              </span>
            ))}
            {space.facilities.length > 4 && (
              <span className="chip">+{space.facilities.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-2 mt-1">
          <span suppressHydrationWarning className="text-[11px] text-[var(--color-text-muted)]">
            Updated {formatRelativeTime(space.lastUpdated)}
          </span>
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" aria-hidden />
        </div>
      </Link>
    </motion.div>
  );
}

// ── ResourceCardSkeleton ──────────────────────────────────────────────────────

export function ResourceCardSkeleton() {
  return (
    <div className="resource-card pointer-events-none">
      <div className="flex justify-between gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton h-5 w-16 rounded-[6px]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-1.5 w-full rounded" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  );
}

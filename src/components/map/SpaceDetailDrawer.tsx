"use client";

import { useState } from "react";
import type { CampusSpace } from "@/lib/types";
import {
  X,
  MapPin,
  Clock,
  Users,
  Volume2,
  Volume1,
  VolumeX,
  Wifi,
  Zap,
  Monitor,
  Accessibility,
  ArrowRight,
  BookMarked,
  Bell,
  BellRing,
  UtensilsCrossed,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SPACE_TYPE_LABELS, cn, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ForecastChart } from "@/components/charts/ForecastChart";

interface SpaceDetailDrawerProps {
  space: CampusSpace | null;
  onClose: () => void;
  onReserveSuccess?: () => void;
}

export function SpaceDetailDrawer({
  space,
  onClose,
  onReserveSuccess,
}: SpaceDetailDrawerProps) {
  const [isNotified, setIsNotified] = useState(false);
  const [reserveState, setReserveState] = useState<"idle" | "reserving" | "confirmed">("idle");

  if (!space) return null;

  // Status configuration
  const statusConfig = {
    quiet: { label: "Available", class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    moderate: { label: "Moderate", class: "text-amber-700 bg-amber-50 border-amber-200" },
    crowded: { label: "Crowded", class: "text-red-700 bg-red-50 border-red-200" },
    closed: { label: "Closed", class: "text-slate-500 bg-slate-100 border-slate-200" },
  }[space.status];

  // Noise indicator
  function getNoiseDetails(level: string) {
    if (level === "silent") return { icon: <VolumeX size={14} />, label: "Silent zone (Zero talking)" };
    if (level === "quiet") return { icon: <Volume1 size={14} />, label: "Quiet study (Whispers only)" };
    if (level === "moderate") return { icon: <Volume2 size={14} />, label: "Conversational collab" };
    return { icon: <Volume2 size={14} />, label: "Active dining hub" };
  }
  const noise = getNoiseDetails(space.noiseLevel);

  function renderFacilityIcon(f: string) {
    const l = f.toLowerCase();
    if (l.includes("wi-fi") || l.includes("wifi")) return <Wifi size={14} />;
    if (l.includes("power") || l.includes("outlet")) return <Zap size={14} />;
    if (l.includes("computer") || l.includes("desktop")) return <Monitor size={14} />;
    if (l.includes("accessible")) return <Accessibility size={14} />;
    return null;
  }

  // Simulated reserve action
  async function handleQuickReserve() {
    setReserveState("reserving");
    await new Promise((r) => setTimeout(r, 600));
    setReserveState("confirmed");
    if (onReserveSuccess) onReserveSuccess();
  }

  // Two-hour forecast slice
  const twoHourForecast = space.hourlyForecast.slice(12, 17);

  return (
    <AnimatePresence>
      <motion.aside
        className="w-full sm:w-[380px] bg-white border-l border-[var(--color-border)] h-full flex flex-col z-30 overflow-y-auto"
        aria-label="Space Detail Drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-cyan-700)] bg-cyan-50 px-2 py-0.5 rounded-[5px] border border-cyan-200">
                {SPACE_TYPE_LABELS[space.type]}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-[6px] border tracking-wide uppercase",
                  statusConfig.class
                )}
              >
                {statusConfig.label}
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-[var(--color-text-primary)] leading-snug">
              {space.name}
            </h2>
            <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {space.building}, {space.floor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 space-y-4 flex-1">
          {/* Occupancy Big Meter Card */}
          <div className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-[6px] p-4 text-center">
            <div className="flex items-center justify-between text-[12px] text-[var(--color-text-muted)] mb-2">
              <span className="flex items-center gap-1">
                <Users size={12} /> Headroom Count
              </span>
              <span suppressHydrationWarning>Updated {formatRelativeTime(space.lastUpdated)}</span>
            </div>

            <div className="flex items-baseline justify-center gap-1.5 my-2">
              <span className="text-[36px] font-black text-[var(--color-text-primary)] leading-none">
                {space.occupied}
              </span>
              <span className="text-[18px] font-bold text-[var(--color-text-muted)]">
                / {space.capacity}
              </span>
            </div>

            <div className="w-full bg-[var(--color-surface-muted)] h-2.5 rounded-[6px] overflow-hidden my-3">
              <div
                className={`h-full rounded-[2px] ${
                  space.status === "quiet"
                    ? "bg-emerald-500"
                    : space.status === "moderate"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${space.occupancyPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
              <div className="bg-white p-2 rounded-[5px] border border-[var(--color-border-subtle)]">
                <span className="text-[11px] text-[var(--color-text-muted)] block">Available Seats</span>
                <span className="text-[16px] font-bold text-emerald-600">{space.availableSeats}</span>
              </div>
              <div className="bg-white p-2 rounded-[5px] border border-[var(--color-border-subtle)]">
                <span className="text-[11px] text-[var(--color-text-muted)] block">Walk Distance</span>
                <span className="text-[16px] font-bold text-[var(--color-text-primary)]">
                  {space.distanceMinutes} min
                </span>
              </div>
            </div>
          </div>

          {/* Explainable Demand Line */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-[6px] p-3 text-[12px] text-cyan-950">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-[var(--color-cyan-700)]">
              <TrendingUp size={13} /> Real-time Crowd Trajectory
            </p>
            <p className="leading-relaxed">
              Current count is {space.occupied} of {space.capacity}. Recent demand is{" "}
              {space.occupancyPercent > 70 ? "high" : "moderate"}. This space may become crowded within 45 minutes.
            </p>
          </div>

          {/* Canteen Specific Queue Telemetry */}
          {space.type === "canteen" && (
            <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-3 text-[12px] text-amber-900">
              <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
                <UtensilsCrossed size={14} /> Service Queue Estimator
              </p>
              <div className="flex items-center justify-between text-[13px] mt-1">
                <span>Estimated waiting time:</span>
                <strong className="text-[15px] font-black text-amber-800">
                  {space.estimatedWaitMinutes} minutes
                </strong>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Turnover rate: approx. 3 orders processed per minute.
              </p>
            </div>
          )}

          {/* Noise Environment */}
          <div className="flex items-center justify-between p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[12px]">
            <span className="text-[var(--color-text-muted)] font-medium">Acoustic Condition</span>
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              {noise.icon}
              {noise.label}
            </span>
          </div>

          {/* Facilities Icons */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Equipped Amenities
            </p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {space.facilities.map((fac) => (
                <div
                  key={fac}
                  className="flex items-center gap-2 p-2 rounded-[7px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  <span className="text-[var(--color-cyan-600)]">
                    {renderFacilityIcon(fac)}
                  </span>
                  <span className="truncate">{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini 2-Hour Forecast Preview */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 flex items-center justify-between">
              <span>Next Hours Outlook</span>
              <span className="text-[10px] text-slate-400 font-normal">Forecast projection</span>
            </p>
            <ForecastChart data={twoHourForecast} compact />
          </div>
        </div>

        {/* Drawer Footer Actions (Medium-radius rectangular buttons) */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] space-y-2 sticky bottom-0 z-10">
          {reserveState === "confirmed" ? (
            <div className="p-2.5 rounded-[6px] bg-emerald-100 text-emerald-800 text-[12px] font-semibold text-center border border-emerald-300">
              Hold confirmed for 15 minutes! Check Reservations tab.
            </div>
          ) : space.type === "canteen" ? (
            <Link
              href={`/spaces/${space.id}`}
              className="btn btn-primary w-full justify-center text-[13px] py-2.5 font-semibold"
            >
              <UtensilsCrossed size={14} /> View Queue & Order Info
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleQuickReserve}
              disabled={reserveState === "reserving"}
              className="btn btn-primary w-full justify-center text-[13px] py-2.5 font-semibold"
            >
              <BookMarked size={14} />
              {reserveState === "reserving" ? "Securing Seat..." : "Reserve a Seat"}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/spaces/${space.id}`}
              className="btn btn-secondary justify-center text-[12px] py-2 font-medium"
            >
              Full Details <ArrowRight size={13} />
            </Link>

            <button
              type="button"
              onClick={() => setIsNotified(!isNotified)}
              className={cn(
                "btn justify-center text-[12px] py-2 font-medium border",
                isNotified
                  ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                  : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
              )}
            >
              {isNotified ? (
                <>
                  <BellRing size={13} className="text-cyan-600" /> Alert Set
                </>
              ) : (
                <>
                  <Bell size={13} /> Notify Me
                </>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

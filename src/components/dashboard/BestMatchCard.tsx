"use client";

import { useMemo, useState } from "react";
import type { CampusSpace } from "@/lib/types";
import {
  Sparkles,
  MapPin,
  Clock,
  VolumeX,
  Volume1,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface BestMatchCardProps {
  spaces: CampusSpace[];
}

export function BestMatchCard({ spaces }: BestMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const topMatch = useMemo(() => {
    return spaces
      .filter((space) =>
        (space.type === "study_space" || space.type === "quiet_room") &&
        space.status !== "closed" &&
        space.availableSeats > 0
      )
      .map((space) => {
        const noiseBonus = space.noiseLevel === "silent" ? 15 : space.noiseLevel === "quiet" ? 10 : 0;
        const distanceBonus = Math.max(0, (10 - space.distanceMinutes) * 1.5);
        const score = Math.max(
          1,
          Math.min(99, Math.round(55 + (1 - space.occupancyPercent / 100) * 25 + noiseBonus + distanceBonus))
        );
        return { space, score };
      })
      .sort((a, b) => b.score - a.score)[0] ?? null;
  }, [spaces]);

  if (!topMatch) {
    return (
      <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">No open study spaces</h2>
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1 mb-4">
          Check the live map for other campus facilities.
        </p>
        <Link href="/map" className="btn btn-secondary w-full justify-center text-[12px] py-2">
          Explore the live map <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const { space, score } = topMatch;
  const reasons = [
    `${space.availableSeats} seats currently open`,
    `${space.noiseLevel === "silent" ? "Silent" : space.noiseLevel === "quiet" ? "Quiet" : "Moderate"} environment`,
    `${space.distanceMinutes} min walk from the campus centre`,
  ];
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card p-5 border border-[var(--color-cyan-500)] bg-white relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11px] font-bold uppercase tracking-wider bg-[var(--color-navy-950)] text-cyan-400">
          <Sparkles size={12} className="text-cyan-400" />
          Best study match right now
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[6px]">
          {space.availableSeats} seats open
        </span>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-20 shrink-0 border border-cyan-200 bg-cyan-50 px-2 py-3">
          <svg className="hidden" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" stroke="var(--color-surface-muted)" strokeWidth="6" fill="transparent" />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="var(--color-cyan-500)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className=""
            />
          </svg>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[20px] font-black text-[var(--color-text-primary)] leading-none">{score}</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">
              Match
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] leading-snug truncate">
            {space.name}
          </h3>
          <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 truncate">
            <MapPin size={12} className="shrink-0" /> {space.building}, {space.floor}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-cyan-700)] bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-[6px]">
              <Clock size={11} /> {space.distanceMinutes} min walk
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-[6px]">
              {space.noiseLevel === "silent" ? <VolumeX size={11} /> : <Volume1 size={11} />}
              {space.noiseLevel} zone
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-[6px] p-3 mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-semibold text-[var(--color-text-secondary)]">Current occupancy</span>
          <span className="font-bold text-[var(--color-text-primary)]">
            {space.occupied} / {space.capacity} ({space.occupancyPercent}%)
          </span>
        </div>
        <div className="h-2 w-full bg-white rounded-[4px] overflow-hidden border border-[var(--color-border-subtle)]">
          <div
            className={`h-full rounded-[4px] ${
              space.occupancyPercent >= 80 ? "bg-red-500" : space.occupancyPercent >= 60 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${space.occupancyPercent}%` }}
          />
        </div>
        <div className="flex justify-between gap-3 text-[11px] mt-2 text-[var(--color-text-muted)]">
          <span>Queue estimate</span>
          <strong className="text-[var(--color-text-primary)]">
            {space.estimatedWaitMinutes > 0 ? `${space.estimatedWaitMinutes} min` : "No wait reported"}
          </strong>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Why this space
        </p>
        {reasons.map((reason) => (
          <div key={reason} className="flex items-start gap-2 text-[12px]">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-[var(--color-text-primary)]">{reason}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Link href={`/spaces/${space.id}`} className="btn btn-primary w-full justify-center text-[13px] py-2.5 font-semibold">
          View &amp; Hold Seat <ArrowRight size={14} />
        </Link>
        <Link href="/recommendation" className="btn btn-secondary w-full justify-center text-[12px] py-2 font-medium">
          Browse other matches
        </Link>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-[var(--color-cyan-700)] hover:text-[var(--color-cyan-600)] transition-colors py-1"
          aria-expanded={isExpanded}
        >
          <span>How the match is ranked</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div className="overflow-hidden">
              <p className="pt-2 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface-base)] rounded-[6px] p-2.5 mt-1 border border-[var(--color-border-subtle)]">
                Study spaces are ranked by current occupancy, noise level, and walking time. The score updates with the live simulated occupancy feed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

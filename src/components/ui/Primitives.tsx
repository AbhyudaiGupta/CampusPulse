"use client";
import { motion } from "framer-motion";
import { cn, STATUS_CONFIG } from "@/lib/utils";
import type { OccupancyStatus } from "@/lib/types";

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: OccupancyStatus;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("status-badge", status, className)} aria-label={`Status: ${cfg.label}`}>
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            status === "quiet" && "bg-emerald-500",
            status === "moderate" && "bg-amber-500",
            status === "crowded" && "bg-red-500",
            status === "closed" && "bg-slate-400"
          )}
          aria-hidden
        />
      )}
      {cfg.label}
    </span>
  );
}

// ── OccupancyBar ──────────────────────────────────────────────────────────────

interface OccupancyBarProps {
  percent: number;
  status: OccupancyStatus;
  className?: string;
  height?: number;
  animated?: boolean;
}

export function OccupancyBar({
  percent,
  status,
  className,
  height = 6,
  animated = true,
}: OccupancyBarProps) {
  const fillColor =
    status === "quiet"
      ? "bg-emerald-500"
      : status === "moderate"
      ? "bg-amber-500"
      : status === "crowded"
      ? "bg-red-500"
      : "bg-slate-300";

  return (
    <div
      className={cn("occupancy-bar-track", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Occupancy: ${percent}%`}
    >
      <motion.div
        className={cn("occupancy-bar-fill", fillColor)}
        initial={animated ? { width: 0 } : { width: `${percent}%` }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
        style={{ height }}
      />
    </div>
  );
}

// ── AnimatedNumber ────────────────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  className,
  suffix = "",
  prefix = "",
  duration = 1.2,
}: AnimatedNumberProps) {
  return (
    <motion.span
      className={className}
      key={value}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
  animate?: boolean;
}

export function MetricCard({ label, value, sub, icon, accent, className, animate = true }: MetricCardProps) {
  return (
    <motion.div
      className={cn("metric-card", className)}
    >
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {icon && (
          <span
            className="flex items-center justify-center w-9 h-9 rounded-[10px]"
            style={{ background: accent ? `${accent}14` : "var(--color-surface-muted)" }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="metric-value" aria-label={`${label}: ${value}`}>
        {typeof value === "number" ? (
          <motion.span key={value}>
            {value}
          </motion.span>
        ) : (
          value
        )}
      </div>
      {sub && <p className="metric-sub">{sub}</p>}
    </motion.div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, sub, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("section-header", className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── LiveUpdateIndicator ───────────────────────────────────────────────────────

interface LiveUpdateIndicatorProps {
  active?: boolean;
  label?: string;
  className?: string;
  /** Override: "live" | "reconnecting" | "demo" */
  state?: "live" | "reconnecting" | "demo";
}

export function LiveUpdateIndicator({
  active = true,
  label,
  className,
  state,
}: LiveUpdateIndicatorProps) {
  const effectiveState = state || (active ? "live" : "demo");
  const dotColor =
    effectiveState === "live"
      ? "bg-emerald-500"
      : effectiveState === "reconnecting"
      ? "bg-amber-500"
      : "bg-slate-400";
  const effectiveLabel =
    label || (effectiveState === "live" ? "Live" : effectiveState === "reconnecting" ? "Reconnecting" : "Demo mode");

  return (
    <span className={cn("live-indicator", className)} aria-label={effectiveLabel}>
      <span className={cn("w-[7px] h-[7px] rounded-[2px] shrink-0", dotColor)} aria-hidden />
      {effectiveLabel}
    </span>
  );
}

// ── LoadingSkeleton ───────────────────────────────────────────────────────────

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  height?: string;
}

export function LoadingSkeleton({ lines = 3, className, height = "h-4" }: LoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("skeleton", height, i === lines - 1 && "w-2/3")}
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      {icon && (
        <div className="w-14 h-14 rounded-[6px] bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-text-muted)]">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-[var(--color-text-primary)] text-[15px]">{title}</p>
        {body && <p className="text-[13px] text-[var(--color-text-muted)] mt-1 max-w-[300px]">{body}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  body = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      <div className="w-14 h-14 rounded-[6px] bg-red-50 flex items-center justify-center text-red-500">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-[var(--color-text-primary)] text-[15px]">{title}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1 max-w-[300px]">{body}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-sm">
          Try again
        </button>
      )}
    </div>
  );
}

// ── PageTransition ────────────────────────────────────────────────────────────

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── DemoDataBadge ─────────────────────────────────────────────────────────────

export function DemoDataBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-[6px]">
      <span className="w-1.5 h-1.5 rounded-[2px] bg-amber-500" aria-hidden />
      Demo data
    </span>
  );
}

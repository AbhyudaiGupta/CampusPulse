import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OccupancyStatus, SpaceType, UserRole } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const STATUS_CONFIG: Record<
  OccupancyStatus,
  { label: string; color: string; bg: string; border: string; ring: string }
> = {
  quiet: {
    label: "Available",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-400",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    ring: "ring-amber-400",
  },
  crowded: {
    label: "Crowded",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-400",
  },
  closed: {
    label: "Closed",
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    ring: "ring-slate-300",
  },
};

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  study_space: "Study Space",
  computer_lab: "Computer Lab",
  canteen: "Canteen",
  collaboration: "Collaboration",
  event_space: "Event Space",
  quiet_room: "Quiet Room",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  admin: "Administrator",
};

export function getOccupancyBarColor(pct: number): string {
  if (pct < 40) return "bg-emerald-500";
  if (pct < 75) return "bg-amber-500";
  return "bg-red-500";
}

export function getStatusFromPercent(pct: number): OccupancyStatus {
  if (pct < 40) return "quiet";
  if (pct < 75) return "moderate";
  return "crowded";
}

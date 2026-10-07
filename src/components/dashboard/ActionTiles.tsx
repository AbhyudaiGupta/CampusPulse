"use client";

import Link from "next/link";
import {
  BookOpen,
  Monitor,
  Coffee,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface ActionTileData {
  title: string;
  subtitle: string;
  metric: string;
  href: string;
  icon: typeof BookOpen;
  accentColor: string;
  bgTint: string;
  tag: string;
}

const ACTION_TILES: ActionTileData[] = [
  {
    title: "Find quiet study space",
    subtitle: "Silent rooms and individual carrels",
    metric: "18 silent seats open",
    href: "/spaces?type=study_space",
    icon: BookOpen,
    accentColor: "#10b981",
    bgTint: "rgba(16, 185, 129, 0.08)",
    tag: "Deep Focus",
  },
  {
    title: "Find free computer",
    subtitle: "GPU lab workstations and dual screens",
    metric: "11 desktop PCs free",
    href: "/spaces?type=computer_lab",
    icon: Monitor,
    accentColor: "#06b6d4",
    bgTint: "rgba(6, 182, 212, 0.08)",
    tag: "Computing",
  },
  {
    title: "Check canteen queue",
    subtitle: "Live food queue and seating load",
    metric: "8 min wait time",
    href: "/spaces/main-canteen",
    icon: Coffee,
    accentColor: "#f59e0b",
    bgTint: "rgba(245, 158, 11, 0.08)",
    tag: "Dining",
  },
  {
    title: "Manage reservation",
    subtitle: "Your active desks and bookings",
    metric: "2 upcoming holds",
    href: "/reservations",
    icon: CalendarCheck,
    accentColor: "#2756a8",
    bgTint: "rgba(39, 86, 168, 0.08)",
    tag: "Bookings",
  },
];

export function ActionTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
      {ACTION_TILES.map((tile, i) => {
        const IconComponent = tile.icon;
        return (
          <motion.div
            key={tile.title}
          >
            <Link
              href={tile.href}
              className="card p-4 block h-full border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] group relative overflow-hidden"
            >
              {/* Top Row: Icon + Category Tag */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-[6px] flex items-center justify-center"
                  style={{ background: tile.bgTint, color: tile.accentColor }}
                >
                  <IconComponent size={18} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                  {tile.tag}
                </span>
              </div>

              {/* Title and subtitle */}
              <h3 className="font-bold text-[14px] text-[var(--color-text-primary)]">
                {tile.title}
              </h3>
              <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                {tile.subtitle}
              </p>

              {/* Metric readout and arrow */}
              <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
                <span
                  className="font-bold"
                  style={{ color: tile.accentColor }}
                >
                  {tile.metric}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

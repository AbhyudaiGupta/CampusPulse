"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, Clock, Users } from "lucide-react";
import type { CampusSpace, Reservation } from "@/lib/types";

interface MetricOverviewProps {
  spaces: CampusSpace[];
  reservations: Reservation[];
}

interface MetricCard {
  label: string;
  value: string | number;
  sublabel: string;
  badge: string;
  badgeType: "positive" | "warning" | "neutral";
  icon: typeof Users;
  accentColor: string;
}

export function MetricOverview({ spaces, reservations }: MetricOverviewProps) {
  const openSpaces = spaces.filter((space) => space.status !== "closed");
  const capacity = openSpaces.reduce((total, space) => total + space.capacity, 0);
  const occupied = openSpaces.reduce((total, space) => total + space.occupied, 0);
  const availableSeats = Math.max(0, capacity - occupied);
  const crowdedSpaces = openSpaces.filter((space) => space.occupancyPercent >= 75);
  const upcomingReservations = reservations.filter(
    (reservation) => reservation.status === "upcoming" || reservation.status === "active"
  );
  const queueSpaces = openSpaces.filter((space) => space.estimatedWaitMinutes > 0);
  const averageQueueWait = queueSpaces.length
    ? Math.round(queueSpaces.reduce((total, space) => total + space.estimatedWaitMinutes, 0) / queueSpaces.length)
    : 0;

  const crowdedNames = crowdedSpaces.map((space) => space.name).join(", ");
  const metrics: MetricCard[] = [
    {
      label: "Available seats",
      value: availableSeats,
      sublabel: `Across ${openSpaces.length} open campus spaces`,
      badge: `${capacity} total seats monitored`,
      badgeType: "positive",
      icon: Users,
      accentColor: "#10b981",
    },
    {
      label: "Crowded zones",
      value: crowdedSpaces.length,
      sublabel: crowdedNames || "No spaces at or above 75% occupancy",
      badge: crowdedSpaces.length ? "Review these spaces" : "No zone needs attention",
      badgeType: crowdedSpaces.length ? "warning" : "positive",
      icon: AlertTriangle,
      accentColor: crowdedSpaces.length ? "#ef4444" : "#10b981",
    },
    {
      label: "Upcoming reservations",
      value: upcomingReservations.length,
      sublabel: "In your CampusPulse account",
      badge: "Reservation list",
      badgeType: "neutral",
      icon: CalendarCheck,
      accentColor: "#06b6d4",
    },
    {
      label: "Average reported wait",
      value: `${averageQueueWait} min`,
      sublabel: queueSpaces.length
        ? `Across ${queueSpaces.length} space${queueSpaces.length === 1 ? "" : "s"} with a queue`
        : "No queues currently reported",
      badge: averageQueueWait >= 8 ? "Queue pressure is high" : "Current queue estimate",
      badgeType: averageQueueWait >= 8 ? "warning" : "positive",
      icon: Clock,
      accentColor: "#f59e0b",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            className="card p-5 bg-white border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  {metric.label}
                </span>
                <span
                  className="p-2 rounded-[5px]"
                  style={{ backgroundColor: `${metric.accentColor}14`, color: metric.accentColor }}
                >
                  <Icon size={16} />
                </span>
              </div>

              <motion.div
                className="text-[26px] font-black text-[var(--color-text-primary)] leading-none tracking-tight mt-1 mb-2"
              >
                {metric.value}
              </motion.div>

              <p className="text-[12px] text-[var(--color-text-secondary)] font-medium min-h-[18px]">
                {metric.sublabel}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)]">
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-[5px] ${
                  metric.badgeType === "positive"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : metric.badgeType === "warning"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                }`}
              >
                {metric.badge}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

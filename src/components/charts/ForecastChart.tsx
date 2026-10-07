"use client";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { HourlyForecast } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ForecastChartProps {
  data: HourlyForecast[];
  currentHour?: number;
  className?: string;
  compact?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  const color = val < 40 ? "#10b981" : val < 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[5px] px-3 py-2 text-[12px]">
      <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p style={{ color }} className="font-bold mt-0.5">
        {val}% occupancy
      </p>
      <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5">
        {val < 40 ? "Available" : val < 75 ? "Moderate" : "Crowded"}
      </p>
    </div>
  );
};

export function ForecastChart({ data, currentHour, className, compact = false }: ForecastChartProps) {
  const [now, setNow] = useState<number | undefined>(currentHour);

  useEffect(() => {
    if (currentHour !== undefined) {
      setNow(currentHour);
    } else {
      setNow(new Date().getHours());
    }
  }, [currentHour]);
  // Only show 7 AM to 10 PM for readability
  const filtered = data.filter((d) => d.hour >= 7 && d.hour <= 22);

  return (
    <div className={cn("w-full", className)} aria-label="Hourly occupancy forecast chart">
      <ResponsiveContainer width="100%" height={compact ? 100 : 160}>
        <AreaChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            interval={compact ? 2 : 1}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Current time reference */}
          {filtered.some((d) => d.hour === now) && (
            <ReferenceLine
              x={filtered.find((d) => d.hour === now)?.label}
              stroke="#06b6d4"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{ value: "Now", position: "top", fontSize: 9, fill: "#06b6d4" }}
            />
          )}
          {/* Threshold lines */}
          <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="2 4" strokeWidth={1} strokeOpacity={0.5} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="2 4" strokeWidth={1} strokeOpacity={0.4} />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="none"
            dot={false}
            activeDot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1 text-right">
        Prototype simulation. Forecast updated hourly.
      </p>
    </div>
  );
}

// ── SparklineBar (for dashboard) ──────────────────────────────────────────────

interface SparklineProps {
  data: HourlyForecast[];
  height?: number;
  className?: string;
}

export function SparklineBar({ data, height = 36, className }: SparklineProps) {
  const filtered = data.filter((d) => d.hour >= 7 && d.hour <= 22);
  const max = Math.max(...filtered.map((d) => d.predicted));
  return (
    <div className={cn("flex items-end gap-px", className)} style={{ height }} aria-hidden>
      {filtered.map((d) => {
        const barH = max > 0 ? (d.predicted / max) * height : 0;
        const color =
          d.predicted < 40 ? "#10b981" : d.predicted < 75 ? "#f59e0b" : "#ef4444";
        return (
          <div
            key={d.hour}
            style={{ height: barH, width: 3, background: color, borderRadius: 2, opacity: 0.75 }}
          />
        );
      })}
    </div>
  );
}

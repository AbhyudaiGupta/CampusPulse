"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Clock, Info } from "lucide-react";
import type { CampusSpace } from "@/lib/types";

type TimeWindow = "live" | "30m" | "1h" | "6h";

const FORECAST_COLORS = {
  library: "#06b6d4",
  canteen: "#f59e0b",
  studyRoom: "#10b981",
};

function projectedOccupancy(space: CampusSpace | undefined, currentHour: number, offsetHours: number) {
  if (!space || offsetHours === 0) return space?.occupancyPercent ?? 0;

  const forecasts = space.hourlyForecast;
  const baselineNow = forecasts.find((point) => point.hour === currentHour)?.predicted ?? space.occupancyPercent;
  const targetHour = currentHour + offsetHours;
  const lowerHour = Math.floor(targetHour) % 24;
  const fraction = targetHour - Math.floor(targetHour);
  const lower = forecasts.find((point) => point.hour === lowerHour)?.predicted ?? baselineNow;
  const upper = forecasts.find((point) => point.hour === (lowerHour + 1) % 24)?.predicted ?? lower;
  const projected = space.occupancyPercent + lower + (upper - lower) * fraction - baselineNow;

  return Math.max(0, Math.min(100, Math.round(projected)));
}

function buildForecastSeries(
  window: TimeWindow,
  currentHour: number,
  spaces: CampusSpace[]
) {
  const library = spaces.find((space) => space.id.includes("library") || space.name === "Central Library");
  const canteen = spaces.find((space) => space.type === "canteen");
  const studyRoom = spaces.find((space) => space.id.includes("study-room") || space.name === "Study Room C");
  const offsets = window === "6h"
    ? [0, 1, 2, 3, 4, 5, 6]
    : window === "1h"
    ? [0, 0.25, 0.5, 0.75, 1]
    : window === "30m"
    ? [0, 1 / 6, 2 / 6, 0.5]
    : [0];

  return offsets.map((offset) => {
    const label = offset === 0
      ? "Now"
      : window === "6h"
      ? `+${offset}h`
      : `+${Math.round(offset * 60)}m`;
    return {
      label,
      library: projectedOccupancy(library, currentHour, offset),
      canteen: projectedOccupancy(canteen, currentHour, offset),
      studyRoom: projectedOccupancy(studyRoom, currentHour, offset),
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomForecastTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-[var(--color-border-subtle)] rounded-[6px] p-3 text-[12px] min-w-[170px]">
      <p className="font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
        <Clock size={12} className="text-[var(--color-text-muted)]" />
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span
                className="w-2 h-2 rounded-xs"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-[var(--color-text-primary)]">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function FlowForecastChart({ spaces }: { spaces: CampusSpace[] }) {
  const [window, setWindow] = useState<TimeWindow>("6h");
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    setCurrentHour(new Date().getHours());
  }, []);

  const data = buildForecastSeries(window, currentHour, spaces);
  const library = spaces.find((space) => space.id.includes("library") || space.name === "Central Library");
  const canteen = spaces.find((space) => space.type === "canteen");
  const studyRoom = spaces.find((space) => space.id.includes("study-room") || space.name === "Study Room C");

  return (
    <div className="card p-5">
      {/* Header with Title and Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--color-cyan-500)]" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Campus flow forecast
            </h2>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Simulated occupancy outlook for three campus spaces
          </p>
        </div>

        {/* Soft-Corner Segmented Control (Rectangular, strictly non-pill) */}
        <div className="flex items-center bg-[var(--color-surface-muted)] p-1 rounded-[8px] border border-[var(--color-border-subtle)] self-start sm:self-auto">
          {(
            [
          { id: "live", label: "Now" },
              { id: "30m", label: "30 min" },
              { id: "1h", label: "1 hour" },
              { id: "6h", label: "6 hours" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setWindow(item.id)}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium ${
                window === item.id
                  ? "bg-white text-[var(--color-navy-950)] font-semibold"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
              aria-pressed={window === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center gap-5 text-[12px] text-[var(--color-text-secondary)] mb-3 pb-2 border-b border-[var(--color-border-subtle)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-xs" style={{ backgroundColor: FORECAST_COLORS.library }} />
          <strong className="text-[var(--color-text-primary)]">Central Library</strong>
          <span className="text-[11px] text-[var(--color-text-muted)]">(Now: {library?.occupancyPercent ?? 0}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-xs" style={{ backgroundColor: FORECAST_COLORS.canteen }} />
          <strong className="text-[var(--color-text-primary)]">Main Canteen</strong>
          <span className="text-[11px] text-[var(--color-text-muted)]">(Now: {canteen?.occupancyPercent ?? 0}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-xs" style={{ backgroundColor: FORECAST_COLORS.studyRoom }} />
          <strong className="text-[var(--color-text-primary)]">Study Room C</strong>
          <span className="text-[11px] text-[var(--color-text-muted)]">(Now: {studyRoom?.occupancyPercent ?? 0}%)</span>
        </span>
      </div>

      {/* Recharts Line Chart */}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "Inter" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "Inter" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomForecastTooltip />} />

            {/* Threshold lines */}
            <ReferenceLine
              y={75}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              label={{
                value: "Crowded (75%)",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#ef4444",
                opacity: 0.7,
              }}
            />
            <ReferenceLine
              y={40}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              label={{
                value: "Available (40%)",
                position: "insideBottomRight",
                fontSize: 10,
                fill: "#10b981",
                opacity: 0.7,
              }}
            />

            {/* Space Lines */}
            <Line
              type="monotone"
              dataKey="library"
              name="Central Library"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#06b6d4" }}
              activeDot={{ r: 5, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="canteen"
              name="Main Canteen"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#f59e0b" }}
              activeDot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="studyRoom"
              name="Study Room C"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10b981" }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Prototype Disclosure Footer */}
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
        <Info size={12} className="shrink-0" />
        <span>
          Time-of-day curves are illustrative and rebased to current simulated occupancy; they are not trained predictions.
        </span>
      </div>
    </div>
  );
}

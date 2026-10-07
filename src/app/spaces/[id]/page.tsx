"use client";

import { use, useState, useMemo } from "react";
import { MOCK_SPACES } from "@/lib/mockData";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, StatusBadge, OccupancyBar, DemoDataBadge } from "@/components/ui/Primitives";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { useSpaceDetails, useCurrentUser } from "@/hooks";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  Users,
  Wifi,
  Zap,
  Monitor,
  Volume2,
  Accessibility,
  ChevronLeft,
  BookMarked,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  CheckCircle2,
  Bell,
  BellRing,
  ArrowRight,
  Info,
  Check,
  AlertTriangle,
} from "lucide-react";
import { SPACE_TYPE_LABELS, formatRelativeTime, cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CampusSpace } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpaceDetailPage({ params }: Props) {
  const { id } = use(params);
  const { space: liveSpace } = useSpaceDetails(id);
  const { user } = useCurrentUser();
  const userName = user?.name || "Abhay";
  const space = liveSpace || MOCK_SPACES.find((s) => s.id === id);
  if (!space) notFound();

  // Interactive seat selector state
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  // Compare locations state (select up to 3 places)
  const [compareIds, setCompareIds] = useState<string[]>([
    space.id,
    MOCK_SPACES.find((s) => s.id !== space.id)?.id || "study-room-c",
  ]);

  // Generate 24 pseudo seat cells based on space capacity and occupancy
  const seatGrid = useMemo(() => {
    const totalCells = Math.min(32, space.capacity);
    const occupiedCount = Math.round((space.occupancyPercent / 100) * totalCells);
    const heldCount = Math.min(3, Math.round(totalCells * 0.1));

    return Array.from({ length: totalCells }, (_, i) => {
      const row = String.fromCharCode(65 + Math.floor(i / 8));
      const col = (i % 8) + 1;
      const seatId = `${row}${col}`;

      let status: "occupied" | "held" | "available" = "available";
      if (i < occupiedCount) {
        status = "occupied";
      } else if (i < occupiedCount + heldCount) {
        status = "held";
      }

      return { id: seatId, status };
    });
  }, [space]);

  // Peak forecast calculation
  const peakForecast = useMemo(() => {
    return space.hourlyForecast.reduce((max, curr) =>
      curr.predicted > max.predicted ? curr : max
    );
  }, [space]);

  // Recent demand trend
  const nextHourForecast = space.hourlyForecast[1]?.predicted ?? space.occupancyPercent;
  const demandDirection =
    nextHourForecast > space.occupancyPercent + 3
      ? "rising"
      : nextHourForecast < space.occupancyPercent - 3
      ? "easing"
      : "steady";

  // Radial progress calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (space.occupancyPercent / 100) * circumference;

  const radialColor =
    space.status === "quiet"
      ? "#10b981"
      : space.status === "moderate"
      ? "#f59e0b"
      : "#ef4444";

  // Comparison spaces
  const comparisonSpaces = MOCK_SPACES.filter((s) => compareIds.includes(s.id));

  function toggleCompareSpace(spaceId: string) {
    if (compareIds.includes(spaceId)) {
      if (compareIds.length > 1) {
        setCompareIds(compareIds.filter((id) => id !== spaceId));
      }
    } else {
      if (compareIds.length < 3) {
        setCompareIds([...compareIds, spaceId]);
      } else {
        // Replace second item
        setCompareIds([compareIds[0], compareIds[1], spaceId]);
      }
    }
  }

  function computeRecommendationScore(s: CampusSpace) {
    let score = 100 - s.occupancyPercent * 0.4;
    if (s.distanceMinutes <= 4) score += 15;
    if (s.noiseLevel === "silent" || s.noiseLevel === "quiet") score += 15;
    if (s.availableSeats > 25) score += 10;
    return Math.min(99, Math.max(30, Math.round(score)));
  }

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role || "student"} userName={userName} />

      <main className="app-main" id="main-content">
        <TopNav
          title={space.name}
          breadcrumb={["CampusPulse", "Spaces", space.name]}
          userName={userName}
          role={user?.role || "student"}
        />

        <div className="page-content">
          <PageTransition>
            {/* Back link */}
            <div className="mb-4">
              <Link
                href="/spaces"
                className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ChevronLeft size={14} /> Back to Directory
              </Link>
            </div>

            {/* ── 1. Hero Section: Radial Occupancy Meter & Overview ── */}
            <div className="card p-6 mb-6 border border-[var(--color-border-subtle)] bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      {SPACE_TYPE_LABELS[space.type]}
                    </span>
                    <StatusBadge status={space.status} />
                    <DemoDataBadge />
                  </div>

                  <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-snug">
                    {space.name}
                  </h1>

                  <div className="flex items-center gap-4 mt-2 flex-wrap text-[13px] text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[var(--color-cyan-600)]" />
                      {space.building}, {space.floor}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[var(--color-cyan-600)]" />
                      {space.distanceMinutes} min walk from Hostel Gate
                    </span>
                    {space.accessible && (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] text-[11px] font-medium">
                        <Accessibility size={12} /> Accessible
                      </span>
                    )}
                  </div>

                  <p className="text-[14px] text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-2xl">
                    {space.description}
                  </p>
                </div>

                {/* Right: Occupancy Summary */}
                <div className="flex items-center gap-6 shrink-0 bg-[var(--color-surface-base)] p-4 rounded-[6px] border border-[var(--color-border-subtle)]">
                  <div className="relative w-28 border border-[var(--color-border-subtle)] bg-white px-3 py-4 flex items-center justify-center">
                    <svg className="hidden" viewBox="0 0 110 110">
                      <circle
                        cx="55"
                        cy="55"
                        r={radius}
                        stroke="var(--color-surface-muted)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="55"
                        cy="55"
                        r={radius}
                        stroke={radialColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className=""
                      />
                    </svg>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[24px] font-black text-[var(--color-text-primary)] leading-none">
                        {space.occupancyPercent}%
                      </span>
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">
                        Density
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[12px]">
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Available</span>
                      <strong className="text-[18px] font-bold text-emerald-600">
                        {space.availableSeats} seats
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Total Headroom</span>
                      <strong className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {space.occupied} / {space.capacity}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Split: Left (Details & Forecast) + Right (Seat Map & Compare) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* ── 2. Occupancy Story Panel ── */}
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-[var(--color-cyan-600)]" />
                    <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                      Occupancy Story & Velocity
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
                    <div className="p-3 bg-[var(--color-surface-base)] rounded-[6px] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Current Load
                      </span>
                      <span className="text-[20px] font-black text-[var(--color-text-primary)]">
                        {space.occupied}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] block">people counted</span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface-base)] rounded-[6px] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Remaining
                      </span>
                      <span className="text-[20px] font-black text-emerald-600">
                        {space.availableSeats}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] block">open chairs</span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface-base)] rounded-[6px] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Demand Trend
                      </span>
                      <span className="text-[14px] font-bold flex items-center justify-center gap-1 mt-1 capitalize text-[var(--color-text-primary)]">
                        {demandDirection === "rising" ? (
                          <>
                            <TrendingUp size={14} className="text-red-500" /> Rising
                          </>
                        ) : demandDirection === "easing" ? (
                          <>
                            <TrendingDown size={14} className="text-emerald-500" /> Easing
                          </>
                        ) : (
                          <>
                            <Minus size={14} className="text-slate-400" /> Steady
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] block">last 30m</span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface-base)] rounded-[6px] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Next Peak
                      </span>
                      <span className="text-[14px] font-bold text-[var(--color-text-primary)] block mt-1">
                        {peakForecast.label}
                      </span>
                      <span className="text-[11px] text-amber-600 font-semibold block">
                        {peakForecast.predicted}% peak
                      </span>
                    </div>
                  </div>

                  {/* Story narrative text */}
                  <div className="bg-cyan-50/60 border border-cyan-200 rounded-[6px] p-3 text-[12px] text-cyan-950 leading-relaxed">
                    <p>
                      <strong>Live Intelligence:</strong> {space.name} is currently operating at{" "}
                      {space.occupancyPercent}% capacity. Based on recent campus foot-traffic flow, demand is{" "}
                      {demandDirection}. The highest expected crowd pressure today is predicted around{" "}
                      <strong>{peakForecast.label} ({peakForecast.predicted}% load)</strong>.
                    </p>
                  </div>
                </div>

                {/* ── 3. Forecast Timeline ── */}
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-[var(--color-cyan-600)]" />
                      <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                        Today Forecast Timeline
                      </h2>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)]">7:00 AM to 10:00 PM</span>
                  </div>
                  <ForecastChart data={space.hourlyForecast} />
                </div>

                {/* ── 4. Facility Readiness ── */}
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                  <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
                    Facility Readiness & Environment
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div className="p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Zap size={16} className="text-amber-500" />
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">Power Outlets</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Dedicated strips at each carrel</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px]">
                        Available
                      </span>
                    </div>

                    <div className="p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Wifi size={16} className="text-cyan-500" />
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">High-Speed Wi-Fi</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">5GHz eduroam coverage</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px]">
                        Optimal
                      </span>
                    </div>

                    <div className="p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Volume2 size={16} className="text-[var(--color-cyan-600)]" />
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">Acoustic Condition</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Verified {space.noiseLevel} acoustic</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-[5px] capitalize">
                        {space.noiseLevel}
                      </span>
                    </div>

                    <div className="p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Accessibility size={16} className="text-emerald-500" />
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">Wheelchair Access</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Ramp & elevator direct access</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px]">
                        Certified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Seat Availability Grid + Location Comparison */}
              <div className="lg:col-span-5 space-y-6">
                {/* ── 5. Seat Availability Grid ── */}
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                        Seat Availability Matrix
                      </h2>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Select an open desk to simulate instant booking
                      </p>
                    </div>
                    {selectedSeat && (
                      <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-[5px]">
                        Seat {selectedSeat}
                      </span>
                    )}
                  </div>

                  {/* Seat Grid Legend */}
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-secondary)] mb-3 pb-2 border-b border-[var(--color-border-subtle)] flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500" /> Available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[3px] bg-amber-500" /> Held
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[3px] bg-red-400" /> Occupied
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[3px] bg-cyan-600" /> Selected
                    </span>
                  </div>

                  {/* Seat matrix buttons (Rectangular micro-desks) */}
                  <div className="grid grid-cols-8 gap-1.5 p-3 bg-[var(--color-surface-base)] rounded-[6px] border border-[var(--color-border-subtle)]">
                    {seatGrid.map((seat) => {
                      const isSelected = selectedSeat === seat.id;
                      const isAvailable = seat.status === "available";

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedSeat(isSelected ? null : seat.id);
                            setBookingConfirmed(false);
                          }}
                          className={`h-8 rounded-[5px] text-[10px] font-bold flex items-center justify-center border ${
                            isSelected
                              ? "bg-cyan-600 text-white border-cyan-700"
                              : seat.status === "available"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                              : seat.status === "held"
                              ? "bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed opacity-80"
                              : "bg-red-100 text-red-700 border-red-200 cursor-not-allowed opacity-60"
                          }`}
                          title={`Seat ${seat.id} (${seat.status})`}
                          aria-label={`Seat ${seat.id} ${seat.status}`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                  </div>

                  {/* Seat Booking Action */}
                  <div className="mt-3.5 space-y-2">
                    {bookingConfirmed ? (
                      <div className="p-2.5 rounded-[8px] bg-emerald-100 border border-emerald-300 text-emerald-900 text-[12px] font-semibold text-center">
                        Seat {selectedSeat} held successfully for 15 minutes!
                      </div>
                    ) : selectedSeat ? (
                      <button
                        type="button"
                        onClick={() => setBookingConfirmed(true)}
                        className="btn btn-primary w-full justify-center text-[12px] py-2 font-semibold"
                      >
                        <BookMarked size={13} /> Confirm Hold for Seat {selectedSeat}
                      </button>
                    ) : (
                      <p className="text-[11px] text-[var(--color-text-muted)] text-center">
                        Click any green desk above to select a seat.
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)] text-[11px]">
                      <button
                        type="button"
                        onClick={() => setIsNotified(!isNotified)}
                        className="text-[var(--color-cyan-700)] hover:underline flex items-center gap-1 font-medium"
                      >
                        {isNotified ? (
                          <>
                            <BellRing size={12} className="text-cyan-600" /> Alert set when seats open
                          </>
                        ) : (
                          <>
                            <Bell size={12} /> Notify me if this space fills up
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-[var(--color-text-muted)] italic pt-1 text-center">
                      Prototype spatial representation - not sensor-confirmed exact seating coordinates.
                    </p>
                  </div>
                </div>

                {/* ── 6. Compare Locations Panel ── */}
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
                      Compare Locations
                    </h2>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {compareIds.length} of 3 selected
                    </span>
                  </div>

                  {/* Location Selector Chips (Rectangular, non-pill) */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {MOCK_SPACES.map((s) => {
                      const isSelected = compareIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleCompareSpace(s.id)}
                          className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-colors border ${
                            isSelected
                              ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)]"
                              : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <span>{s.name.split(" ")[0]}</span>
                            {isSelected && <Check size={11} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Comparison Side-by-Side Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                          <th className="text-left py-1.5 text-[var(--color-text-muted)] font-semibold text-[11px]">
                            Metric
                          </th>
                          {comparisonSpaces.map((s) => (
                            <th
                              key={s.id}
                              className="text-left py-1.5 font-bold text-[var(--color-text-primary)] text-[11px]"
                            >
                              {s.name.split(" ")[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        <tr>
                          <td className="py-2 text-[var(--color-text-muted)] font-medium">Available</td>
                          {comparisonSpaces.map((s) => (
                            <td key={s.id} className="py-2 font-bold text-emerald-600">
                              {s.availableSeats} seats
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 text-[var(--color-text-muted)] font-medium">Occupancy</td>
                          {comparisonSpaces.map((s) => (
                            <td key={s.id} className="py-2 font-semibold text-[var(--color-text-primary)]">
                              {s.occupancyPercent}%
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 text-[var(--color-text-muted)] font-medium">Walk Time</td>
                          {comparisonSpaces.map((s) => (
                            <td key={s.id} className="py-2 text-[var(--color-text-secondary)]">
                              {s.distanceMinutes} min
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 text-[var(--color-text-muted)] font-medium">Acoustics</td>
                          {comparisonSpaces.map((s) => (
                            <td key={s.id} className="py-2 capitalize text-[var(--color-text-secondary)]">
                              {s.noiseLevel}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 text-[var(--color-text-muted)] font-medium">Pulse Score</td>
                          {comparisonSpaces.map((s) => (
                            <td key={s.id} className="py-2 font-black text-[var(--color-cyan-700)]">
                              {computeRecommendationScore(s)} / 100
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

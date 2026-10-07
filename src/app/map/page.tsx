"use client";

import { useState, useMemo } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge } from "@/components/ui/Primitives";
import { useSpaces, useCurrentUser } from "@/hooks";
import type { CampusSpace, SpaceType, OccupancyStatus } from "@/lib/types";
import {
  Compass,
  Footprints,
  SlidersHorizontal,
  Clock,
  Layers,
  MapPin,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { CampusDigitalTwin } from "@/components/map/CampusDigitalTwin";
import { SpaceDetailDrawer } from "@/components/map/SpaceDetailDrawer";

export default function CampusMapPage() {
  const { spaces, loading } = useSpaces();
  const { user } = useCurrentUser();
  const userName = user?.name || "Abhay";

  // Filter states
  const [selectedType, setSelectedType] = useState<SpaceType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<OccupancyStatus | "all">("all");
  const [requiredFacilities, setRequiredFacilities] = useState<string[]>([]);

  // Map mode and projection controls
  const [projectionMode, setProjectionMode] = useState<"live" | "30m" | "1h" | "6h">("live");
  const [sliderOffset, setSliderOffset] = useState<number>(0); // in hours: 0 to 6

  // Digital Twin features
  const [showStudentLocation, setShowStudentLocation] = useState<boolean>(true);
  const [showBestRoute, setShowBestRoute] = useState<boolean>(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>("study-room-c");

  // Effective time offset in hours
  const effectiveTimeOffset =
    sliderOffset > 0
      ? sliderOffset
      : projectionMode === "30m"
      ? 0.5
      : projectionMode === "1h"
      ? 1
      : projectionMode === "6h"
      ? 6
      : 0;

  // Filtered spaces based on user controls
  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (selectedType !== "all" && space.type !== selectedType) return false;
      if (selectedStatus !== "all" && space.status !== selectedStatus) return false;
      if (requiredFacilities.length > 0) {
        const hasAll = requiredFacilities.every((fac) =>
          space.facilities.some((f) => f.toLowerCase().includes(fac.toLowerCase()))
        );
        if (!hasAll) return false;
      }
      return true;
    });
  }, [spaces, selectedType, selectedStatus, requiredFacilities]);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || null;

  function toggleFacility(f: string) {
    setRequiredFacilities((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
    );
  }

  function resetFilters() {
    setSelectedType("all");
    setSelectedStatus("all");
    setRequiredFacilities([]);
    setProjectionMode("live");
    setSliderOffset(0);
  }

  return (
    <div className="app-layout">
      {/* Background campus grid */}
      <div className="campus-grid-bg" aria-hidden />

      {/* Main sidebar */}
      <Sidebar role={user?.role || "student"} userName={userName} />

      {/* App main viewport */}
      <main className="app-main" id="main-content">
        <TopNav
          title="Campus Intelligence Map"
          breadcrumb={["CampusPulse", "Spatial Twin"]}
          userName={userName}
          role={user?.role || "student"}
        />

        <div className="page-content">
          <PageTransition>
            {/* Top Header & Map Mode Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                    Campus Digital Twin
                  </h1>
                  <DemoDataBadge />
                </div>
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  Live spatial resource tracking and predictive crowd density visualization.
                </p>
              </div>

              {/* Mode Controls & Route Toggles (Rectangular, non-pill) */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 4 Mode Segmented Controls */}
                <div className="flex items-center bg-[var(--color-surface-muted)] p-1 rounded-[8px] border border-[var(--color-border-subtle)] text-[12px]">
                  {(
                    [
                      { id: "live", label: "Live occupancy", offset: 0 },
                      { id: "30m", label: "30-min forecast", offset: 0.5 },
                      { id: "1h", label: "1-hour outlook", offset: 1 },
                      { id: "6h", label: "6-hour projection", offset: 6 },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setProjectionMode(m.id);
                        setSliderOffset(m.offset);
                      }}
                      className={`px-3 py-1.5 rounded-[6px] font-medium transition-all ${
                        projectionMode === m.id && sliderOffset === m.offset
                          ? "bg-white text-[var(--color-navy-950)] shadow-xs font-semibold"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      }`}
                      aria-pressed={projectionMode === m.id}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Demo location button */}
                <button
                  type="button"
                  onClick={() => setShowStudentLocation(!showStudentLocation)}
                  className={`btn text-[12px] py-1.5 px-3 border transition-colors ${
                    showStudentLocation
                      ? "bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold"
                      : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                  aria-pressed={showStudentLocation}
                >
                  <MapPin size={13} className="text-cyan-600" />
                  Student location
                </button>

                {/* Best route button */}
                <button
                  type="button"
                  onClick={() => setShowBestRoute(!showBestRoute)}
                  className={`btn text-[12px] py-1.5 px-3 border transition-colors ${
                    showBestRoute
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                  aria-pressed={showBestRoute}
                >
                  <Footprints size={13} className="text-emerald-600" />
                  Find my best route
                </button>
              </div>
            </div>

            {/* Real-time Slider Control Bar */}
            <div className="card p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] border border-[var(--color-border-subtle)] bg-white">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Clock size={15} className="text-[var(--color-cyan-600)] shrink-0" />
                <span className="font-semibold text-[var(--color-text-primary)]">
                  Time Projection Slider:
                </span>
                <span className="text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-[5px] border border-cyan-200">
                  {sliderOffset === 0
                    ? "Live Real-Time Feed (12:00 PM)"
                    : `+${sliderOffset} Hours Projected (${(12 + sliderOffset) % 12 || 12}:00 ${
                        12 + sliderOffset >= 12 ? "PM" : "AM"
                      })`}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-72">
                <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Now</span>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={sliderOffset}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSliderOffset(val);
                    if (val === 0) setProjectionMode("live");
                    else if (val === 0.5) setProjectionMode("30m");
                    else if (val === 1) setProjectionMode("1h");
                    else if (val === 6) setProjectionMode("6h");
                  }}
                  className="w-full accent-[var(--color-cyan-500)] cursor-pointer"
                  aria-label="Time forecast projection slider"
                />
                <span className="text-[11px] text-[var(--color-text-muted)] font-medium">+6h</span>
              </div>
            </div>

            {/* Main Map + Left Filters Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (3 cols): Filters Panel */}
              <div className="lg:col-span-3 space-y-4">
                <div className="card p-4 border border-[var(--color-border-subtle)] bg-white">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border-subtle)]">
                    <h2 className="font-bold text-[14px] text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-[var(--color-cyan-600)]" />
                      Map Filters
                    </h2>
                    {(selectedType !== "all" ||
                      selectedStatus !== "all" ||
                      requiredFacilities.length > 0) && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-[11px] font-semibold text-cyan-700 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    )}
                  </div>

                  {/* 1. Resource Type */}
                  <div className="mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                      Resource Type
                    </p>
                    <div className="space-y-1">
                      {(
                        [
                          { id: "all", label: "All Facilities" },
                          { id: "study_space", label: "Study Spaces" },
                          { id: "computer_lab", label: "Computer Labs" },
                          { id: "canteen", label: "Dining & Canteen" },
                          { id: "collaboration", label: "Innovation Hub" },
                          { id: "event_space", label: "Seminar Halls" },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedType(t.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors flex items-center justify-between ${
                            selectedType === t.id
                              ? "bg-[var(--color-navy-900)] text-white"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                          }`}
                        >
                          <span>{t.label}</span>
                          {selectedType === t.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Availability / Status */}
                  <div className="mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                      Live Availability
                    </p>
                    <div className="space-y-1">
                      {(
                        [
                          { id: "all", label: "All Statuses", color: "#64748b" },
                          { id: "quiet", label: "Available (<40%)", color: "#10b981" },
                          { id: "moderate", label: "Moderate (40-75%)", color: "#f59e0b" },
                          { id: "crowded", label: "Crowded (>75%)", color: "#ef4444" },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStatus(s.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors flex items-center justify-between ${
                            selectedStatus === s.id
                              ? "bg-[var(--color-surface-muted)] text-[var(--color-navy-950)] font-semibold border border-[var(--color-border)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.label}
                          </span>
                          {selectedStatus === s.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Facilities Checkboxes */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                      Required Amenities
                    </p>
                    <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                      {[
                        { id: "power", label: "Power Outlets" },
                        { id: "computer", label: "Desktop Computers" },
                        { id: "accessible", label: "Wheelchair Accessible" },
                        { id: "wi-fi", label: "High-speed Wi-Fi" },
                      ].map((fac) => (
                        <label
                          key={fac.id}
                          className="flex items-center gap-2 px-1 py-1 rounded-[5px] hover:bg-[var(--color-surface-muted)] cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={requiredFacilities.includes(fac.id)}
                            onChange={() => toggleFacility(fac.id)}
                            className="rounded border-[var(--color-border)] text-[var(--color-cyan-500)] focus:ring-[var(--color-cyan-500)]"
                          />
                          <span>{fac.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Best Spot Quick Callout Card */}
                <div className="card p-4 bg-cyan-50 border border-cyan-200">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-cyan-900 mb-1">
                    <Sparkles size={14} className="text-cyan-600" />
                    Recommended Spot
                  </div>
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)]">
                    Study Room C (18 seats)
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    3 min walk from Hostel Gate. Silent condition.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpaceId("study-room-c");
                      setShowBestRoute(true);
                    }}
                    className="mt-2.5 w-full btn btn-primary text-[11px] py-1.5 justify-center font-semibold"
                  >
                    Focus on Map & Route
                  </button>
                </div>
              </div>

              {/* Center / Right Column (9 cols): Digital Twin Canvas + Drawer */}
              <div className="lg:col-span-9 relative flex">
                {/* SVG Digital Twin Map Viewport */}
                <div className="flex-1 min-w-0">
                  <CampusDigitalTwin
                    spaces={filteredSpaces}
                    selectedSpaceId={selectedSpaceId}
                    onSelectSpace={(id) => setSelectedSpaceId(id)}
                    showStudentLocation={showStudentLocation}
                    showBestRoute={showBestRoute}
                    targetSpaceId={selectedSpaceId || "study-room-c"}
                    timeOffsetHours={effectiveTimeOffset}
                  />
                </div>

                {/* Space Detail Drawer Floating Overlay */}
                {selectedSpace && (
                  <div className="fixed inset-y-0 right-0 z-50 sm:absolute sm:inset-y-0 sm:right-0 sm:z-20">
                    <SpaceDetailDrawer
                      space={selectedSpace}
                      onClose={() => setSelectedSpaceId(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

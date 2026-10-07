"use client";

import { useState, useMemo } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, SectionHeader, DemoDataBadge, EmptyState } from "@/components/ui/Primitives";
import { ResourceCard } from "@/components/spaces/ResourceCard";
import { useSpaces, useCurrentUser } from "@/hooks";
import type { SpaceType, OccupancyStatus } from "@/lib/types";
import { SPACE_TYPE_LABELS } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Building2,
  Accessibility,
  ArrowUpDown,
  X,
  Volume2,
} from "lucide-react";
import Link from "next/link";

const TYPE_OPTIONS: { label: string; value: SpaceType | "all" }[] = [
  { label: "All Spaces", value: "all" },
  { label: "Study Spaces", value: "study_space" },
  { label: "Computer Labs", value: "computer_lab" },
  { label: "Quiet Rooms", value: "quiet_room" },
  { label: "Collaboration", value: "collaboration" },
  { label: "Canteens & Dining", value: "canteen" },
];

const STATUS_OPTIONS: { label: string; value: OccupancyStatus | "all" }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Available (<40%)", value: "quiet" },
  { label: "Moderate (40-75%)", value: "moderate" },
  { label: "Crowded (>75%)", value: "crowded" },
];

export default function SpacesBrowsePage() {
  const { spaces, loading } = useSpaces();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<SpaceType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<OccupancyStatus | "all">("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"occupancy_asc" | "occupancy_desc" | "walk" | "capacity" | "name">("occupancy_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Unique buildings
  const buildings = useMemo(() => {
    return Array.from(new Set(spaces.map((s) => s.building))).sort();
  }, [spaces]);

  const filteredSpaces = useMemo(() => {
    return spaces.filter((s) => {
      if (search) {
        const query = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesBuilding = s.building.toLowerCase().includes(query);
        const matchesFacilities = s.facilities.some((f) => f.toLowerCase().includes(query));
        if (!matchesName && !matchesBuilding && !matchesFacilities) return false;
      }
      if (selectedType !== "all" && s.type !== selectedType) return false;
      if (selectedStatus !== "all" && s.status !== selectedStatus) return false;
      if (buildingFilter !== "all" && s.building !== buildingFilter) return false;
      if (accessibleOnly && !s.accessible) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "occupancy_asc") return a.occupancyPercent - b.occupancyPercent;
      if (sortBy === "occupancy_desc") return b.occupancyPercent - a.occupancyPercent;
      if (sortBy === "walk") return a.distanceMinutes - b.distanceMinutes;
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return a.name.localeCompare(b.name);
    });
  }, [spaces, search, selectedType, selectedStatus, buildingFilter, accessibleOnly, sortBy]);

  const activeFilterCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (buildingFilter !== "all" ? 1 : 0) +
    (accessibleOnly ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setSelectedType("all");
    setSelectedStatus("all");
    setBuildingFilter("all");
    setAccessibleOnly(false);
    setSortBy("occupancy_asc");
  }

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role || "student"} userName={user?.name || "Student"} />

      <main className="app-main" id="main-content">
        <TopNav
          title="All Spaces"
          breadcrumb={["CampusPulse", "Directory"]}
          userName={user?.name || "Student"}
          role={user?.role || "student"}
        />

        <div className="page-content">
          <PageTransition>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                    Campus Resource Directory
                  </h1>
                  <DemoDataBadge />
                </div>
                <p className="text-[14px] text-[var(--color-text-secondary)]">
                  Explore real-time occupancy across {spaces.length} campus study areas, computing facilities, and dining spots.
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-2 bg-[var(--color-surface-muted)] p-1 rounded-[9px] border border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-[7px] text-[13px] transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-[var(--color-navy-950)] font-medium"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`p-1.5 rounded-[7px] text-[13px] transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-[var(--color-navy-950)] font-medium"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="card mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Search input */}
                <div className="md:col-span-4 relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search space name, building, equipment..."
                    className="input pl-9 pr-3 py-2 text-[13px] w-full"
                    aria-label="Search campus spaces"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Building dropdown */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <Building2
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                    />
                    <select
                      value={buildingFilter}
                      onChange={(e) => setBuildingFilter(e.target.value)}
                      className="input pl-8 pr-7 py-2 text-[13px] w-full bg-white appearance-none cursor-pointer"
                      aria-label="Filter by building"
                    >
                      <option value="all">All Buildings</option>
                      {buildings.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <ArrowUpDown
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="input pl-8 pr-7 py-2 text-[13px] w-full bg-white appearance-none cursor-pointer"
                      aria-label="Sort spaces"
                    >
                      <option value="occupancy_asc">Lowest Occupancy First</option>
                      <option value="occupancy_desc">Highest Occupancy First</option>
                      <option value="walk">Shortest Walk Distance</option>
                      <option value="capacity">Largest Total Capacity</option>
                      <option value="name">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Reset / Status summary */}
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={accessibleOnly}
                      onChange={(e) => setAccessibleOnly(e.target.checked)}
                      className="rounded border-[var(--color-border)] text-[var(--color-cyan-500)] focus:ring-[var(--color-cyan-500)]"
                    />
                    <Accessibility size={13} className="text-[var(--color-text-muted)]" />
                    <span>Accessible</span>
                  </label>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11px] text-[var(--color-cyan-600)] hover:underline flex items-center gap-1 ml-2 font-medium"
                    >
                      Reset ({activeFilterCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Type pills / status row */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)] overflow-x-auto pb-1 text-[12px]">
                <span className="text-[var(--color-text-muted)] text-[11px] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
                  <SlidersHorizontal size={12} /> Type:
                </span>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedType(t.value)}
                    className={`px-3 py-1 rounded-[7px] text-[12px] font-medium transition-colors shrink-0 ${
                      selectedType === t.value
                        ? "bg-[var(--color-navy-900)] text-white"
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count & active tags */}
            <div className="flex items-center justify-between text-[13px] text-[var(--color-text-muted)] mb-4">
              <p>
                Showing <strong className="text-[var(--color-text-primary)]">{filteredSpaces.length}</strong> of {spaces.length} campus spaces
              </p>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Moderate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Crowded
                </span>
              </div>
            </div>

            {/* Space Grid or List */}
            {filteredSpaces.length === 0 ? (
              <EmptyState
                icon={<Building2 size={24} />}
                title="No campus spaces match your filters"
                body="Try loosening your search query, building filter, or occupancy preference to find more available spots."
                action={
                  <button type="button" onClick={resetFilters} className="btn btn-secondary btn-sm">
                    Clear all filters
                  </button>
                }
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSpaces.map((space) => (
                  <ResourceCard key={space.id} space={space} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[var(--color-cyan-500)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          href={`/spaces/${space.id}`}
                          className="text-[15px] font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-cyan-600)] transition-colors"
                        >
                          {space.name}
                        </Link>
                        <span className="badge badge-default text-[11px]">
                          {SPACE_TYPE_LABELS[space.type]}
                        </span>
                        {space.accessible && (
                          <span className="badge badge-default text-[11px] flex items-center gap-1">
                            <Accessibility size={11} /> Accessible
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        {space.building}, {space.floor} • {space.distanceMinutes} min walk • Capacity {space.capacity}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[var(--color-text-primary)]">
                          {space.occupancyPercent}% full
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {space.availableSeats} seats open
                        </p>
                      </div>

                      <div className="w-24 shrink-0">
                        <div className="h-2 w-full bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              space.status === "quiet"
                                ? "bg-emerald-500"
                                : space.status === "moderate"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${space.occupancyPercent}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/spaces/${space.id}`}
                        className="btn btn-secondary text-[12px] py-1.5 px-3 shrink-0"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

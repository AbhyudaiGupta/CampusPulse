"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge } from "@/components/ui/Primitives";
import { useSpaces, useCurrentUser } from "@/hooks";
import { useApp } from "@/context/AppContext";
import type { CampusSpace, SpaceType } from "@/lib/types";
import {
  Sparkles,
  BookOpen,
  Code,
  Users,
  Coffee,
  Calendar,
  Volume2,
  VolumeX,
  Volume1,
  Zap,
  Monitor,
  Accessibility,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingDown,
  BookMarked,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ForecastChart } from "@/components/charts/ForecastChart";

type Purpose = "study" | "coding" | "group_meeting" | "eat" | "attend_event";
type NoiseChoice = "quiet" | "moderate" | "no_preference";

interface FormState {
  purpose: Purpose;
  noise: NoiseChoice;
  needPower: boolean;
  needComputer: boolean;
  requireAccessible: boolean;
  maxWalkMinutes: number;
  durationHours: number;
}

const PURPOSES: { id: Purpose; title: string; desc: string; icon: typeof BookOpen }[] = [
  { id: "study", title: "Solo Study & Reading", desc: "Silent desks & carrels", icon: BookOpen },
  { id: "coding", title: "Software & Computing", desc: "Dual monitors & power strips", icon: Code },
  { id: "group_meeting", title: "Group Collaboration", desc: "Whiteboards & display pods", icon: Users },
  { id: "eat", title: "Dining & Coffee", desc: "Canteen tables & casual seating", icon: Coffee },
  { id: "attend_event", title: "Lecture / Event", desc: "Tiered halls & large venues", icon: Calendar },
];

export default function RecommendationPage() {
  const { spaces } = useSpaces();
  const { user } = useCurrentUser();
  const { preferences, createSeatReservation, activeHold } = useApp();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [currentHour, setCurrentHour] = useState(0);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState(false);

  const [form, setForm] = useState<FormState>({
    purpose: "study",
    noise: preferences.quietLevel === "silent" || preferences.quietLevel === "quiet" ? "quiet" : "no_preference",
    needPower: true,
    needComputer: false,
    requireAccessible: preferences.accessibilityRequired,
    maxWalkMinutes: preferences.maxWalkMinutes || 10,
    durationHours: 2,
  });

  useEffect(() => {
    setCurrentHour(new Date().getHours());
  }, []);

  // Transparent Scoring Engine
  const scoredSpaces = useMemo(() => {
    return spaces
      .filter((space) => {
        const purposeTypes: Record<Purpose, SpaceType[]> = {
          study: ["study_space", "quiet_room"], coding: ["computer_lab"],
          group_meeting: ["collaboration"], eat: ["canteen"], attend_event: ["event_space"],
        };
        return space.status !== "closed" && space.availableSeats > 0
          && purposeTypes[form.purpose].includes(space.type)
          && (!form.requireAccessible || space.accessible)
          && (!form.needComputer || space.type === "computer_lab")
          && (!form.needPower || space.facilities.some((facility) => /power/i.test(facility)))
          && space.distanceMinutes <= form.maxWalkMinutes;
      })
      .map((space) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Current Availability (35%)
      const availabilityScore = Math.max(0, 100 - space.occupancyPercent) * 0.35;
      score += availabilityScore;
      if (space.occupancyPercent < 45) {
        reasons.push(`${space.availableSeats} currently open seats (low density)`);
      }

      // 2. Illustrative session outlook (25%)
      const forecastHours = Array.from(
        { length: Math.max(1, Math.ceil(form.durationHours)) },
        (_, offset) => space.hourlyForecast.find((point) => point.hour === (currentHour + offset) % 24)?.predicted
      ).filter((value): value is number => typeof value === "number");
      const avgSessionOccupancy = forecastHours.length
        ? forecastHours.reduce((sum, value) => sum + value, 0) / forecastHours.length
        : space.occupancyPercent;
      const predictedScore = Math.max(0, 100 - avgSessionOccupancy) * 0.25;
      score += predictedScore;
      if (avgSessionOccupancy < 55) {
        reasons.push(`Illustrative crowd outlook is low for your ${form.durationHours} hr session`);
      }

      // 3. Facility & Purpose Match (20%)
      let facilityPoints = 0;
      const purposeMatch =
        (form.purpose === "study" && space.type === "study_space") ||
        (form.purpose === "coding" && space.type === "computer_lab") ||
        (form.purpose === "group_meeting" && space.type === "collaboration") ||
        (form.purpose === "eat" && space.type === "canteen") ||
        (form.purpose === "attend_event" && space.type === "event_space");

      if (purposeMatch) facilityPoints += 12;
      if (form.needPower && space.facilities.some((f) => f.toLowerCase().includes("power"))) {
        facilityPoints += 4;
        reasons.push("Dedicated power charging stations available");
      }
      if (form.needComputer && space.type === "computer_lab") facilityPoints += 4;
      score += Math.min(20, facilityPoints);

      // 4. Walking Distance (10%)
      if (space.distanceMinutes <= form.maxWalkMinutes) {
        const walkPoints = Math.max(0, (form.maxWalkMinutes - space.distanceMinutes) / form.maxWalkMinutes) * 10;
        score += walkPoints;
        if (space.distanceMinutes <= 4) reasons.push(`Only ${space.distanceMinutes} min walk from Hostel Gate`);
      } else {
        score -= 10;
      }

      // 5. Noise & Accessibility Match (10%)
      let noisePoints = 5;
      if (form.noise === "quiet" && (space.noiseLevel === "silent" || space.noiseLevel === "quiet")) {
        noisePoints = 10;
        reasons.push(`Verified ${space.noiseLevel} acoustic environment`);
      } else if (form.noise === "moderate" && space.noiseLevel === "moderate") {
        noisePoints = 10;
      }
      if (form.requireAccessible && !space.accessible) {
        score -= 40;
      } else if (form.requireAccessible && space.accessible) {
        reasons.push("Step-free wheelchair accessibility certified");
      }
      score += noisePoints;

      return {
        space,
        score: Math.min(99, Math.max(25, Math.round(score))),
        reasons: reasons.slice(0, 3),
      };
    }).sort((a, b) => b.score - a.score);
  }, [form, spaces, currentHour]);

  const topMatch = scoredSpaces[0] ?? null;
  const alternatives = scoredSpaces.slice(1, 3);

  function handleQuickHold(space: CampusSpace) {
    if (activeHold && (activeHold.status === "holding" || activeHold.status === "confirmed")) return;

    createSeatReservation({
      spaceId: space.id,
      spaceName: space.name,
      building: space.building,
      spaceType: space.type,
      seatId: "A2",
      durationHours: form.durationHours,
    });
  }

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role ?? "student"} userName={user?.name ?? "Student Demo"} />

      <main className="app-main" id="main-content">
        <TopNav
          title="Best Spot Finder"
          breadcrumb={["CampusPulse", "Recommendation"]}
          userName={user?.name ?? "Student Demo"}
          role={user?.role ?? "student"}
        />

        <div className="page-content max-w-[960px]">
          <PageTransition>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={20} className="text-[var(--color-cyan-600)]" />
                  <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                    Smart Spot Recommendation
                  </h1>
                  <DemoDataBadge />
                </div>
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  Personalized matches use current occupancy and an illustrative session outlook.
                </p>
              </div>

              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5"
                >
                  <RotateCcw size={12} /> Start Over
                </button>
              )}
            </div>

            {/* Multi-Step Progress Indicator (Rectangular, strictly non-pill) */}
            <div className="card p-4 mb-6 bg-white border border-[var(--color-border-subtle)]">
              <div className="grid grid-cols-3 gap-2 text-[12px]">
                {[
                  { step: 1, title: "1. Session Purpose" },
                  { step: 2, title: "2. Study Preferences" },
                  { step: 3, title: "3. Optimal Matches" },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-[8px] border text-center ${
                      currentStep === s.step
                        ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] font-bold"
                        : currentStep > s.step
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-muted)] border-[var(--color-border-subtle)]"
                    }`}
                  >
                    <span>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── STEP 1: Purpose ────────────────────────────────────────── */}
            {currentStep === 1 && (
              <motion.div
                className="space-y-4"
              >
                <div className="card p-6 border border-[var(--color-border-subtle)] bg-white">
                  <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] mb-1">
                    What are you looking to do right now?
                  </h2>
                  <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
                    Select your primary activity so we can prioritize suitable facilities and acoustics.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
                    {PURPOSES.map((p) => {
                      const Icon = p.icon;
                      const isSelected = form.purpose === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, purpose: p.id, needPower: p.id === "study" || p.id === "group_meeting", needComputer: p.id === "coding" }))}
                          className={`p-4 rounded-[6px] border text-left ${
                            isSelected
                              ? "bg-cyan-50/70 border-[var(--color-cyan-500)]"
                              : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-3 ${
                              isSelected
                                ? "bg-[var(--color-navy-900)] text-cyan-400"
                                : "bg-white text-[var(--color-text-secondary)]"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <p className="font-bold text-[14px] text-[var(--color-text-primary)]">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            {p.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-primary text-[13px] py-2 px-5 font-semibold inline-flex items-center gap-2"
                    >
                      Next: Study Preferences <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Preferences ────────────────────────────────────── */}
            {currentStep === 2 && (
              <motion.div
                className="space-y-4"
              >
                <div className="card p-6 border border-[var(--color-border-subtle)] bg-white space-y-6">
                  <div>
                    <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] mb-1">
                      Configure your session requirements
                    </h2>
                    <p className="text-[13px] text-[var(--color-text-muted)]">
                      Refine walking tolerances, electrical needs, and acoustic boundaries.
                    </p>
                  </div>

                  {/* Noise Tolerance */}
                  <div>
                    <label className="text-[13px] font-semibold text-[var(--color-text-primary)] block mb-2">
                      Acoustic Comfort:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { id: "quiet", label: "Quiet & Silent", icon: VolumeX },
                          { id: "moderate", label: "Moderate / Collab", icon: Volume1 },
                          { id: "no_preference", label: "Any Noise Level", icon: Volume2 },
                        ] as const
                      ).map((n) => {
                        const Icon = n.icon;
                        const isSelected = form.noise === n.id;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, noise: n.id }))}
                            className={`p-3 rounded-[6px] border text-center ${
                              isSelected
                                ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] font-bold"
                                : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]"
                            }`}
                          >
                            <Icon size={16} className="mx-auto mb-1.5 opacity-80" />
                            <span className="text-[12px]">{n.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hardware & Amenities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <label className="flex items-center gap-3 p-3 rounded-[9px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.needPower}
                        onChange={(e) => setForm((prev) => ({ ...prev, needPower: e.target.checked }))}
                        className="rounded border-[var(--color-border)] text-[var(--color-cyan-600)]"
                      />
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-500" />
                          Need AC Power Outlets
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] block">
                          Filter for individual laptop charging carrels
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-[9px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.needComputer}
                        onChange={(e) => setForm((prev) => ({ ...prev, needComputer: e.target.checked }))}
                        className="rounded border-[var(--color-border)] text-[var(--color-cyan-600)]"
                      />
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <Monitor size={14} className="text-cyan-600" />
                          Need Desktop Workstation
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] block">
                          Filter for Dual-display / GPU lab stations
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Walk Distance & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[var(--color-border-subtle)]">
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--color-text-primary)] flex items-center justify-between mb-2">
                        <span>Max Walk Distance:</span>
                        <strong className="text-cyan-700">{form.maxWalkMinutes} minutes</strong>
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="15"
                        step="1"
                        value={form.maxWalkMinutes}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, maxWalkMinutes: parseInt(e.target.value) }))
                        }
                        className="w-full accent-[var(--color-cyan-500)] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-[var(--color-text-primary)] flex items-center justify-between mb-2">
                        <span>Planned Session Duration:</span>
                        <strong className="text-cyan-700">{form.durationHours} hours</strong>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                        {[1, 2, 3, 4].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, durationHours: hrs }))}
                            className={`py-1.5 rounded-[6px] border font-bold ${
                              form.durationHours === hrs
                                ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)]"
                                : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"
                            }`}
                          >
                            {hrs}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn btn-secondary text-[12px] py-2 px-4 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft size={13} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="btn btn-primary text-[13px] py-2 px-5 font-semibold inline-flex items-center gap-2"
                    >
                      Calculate Best Spots <Sparkles size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Results Screen ─────────────────────────────────── */}
            {currentStep === 3 && (
              <motion.div
                className="space-y-6"
              >
                {/* Method Disclaimer Banner */}
                <div className="bg-cyan-50/70 border border-cyan-200 rounded-[6px] p-3 text-[12px] text-cyan-950 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Info size={15} className="text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-cyan-900">
                        CampusPulse recommendation engine, prototype scoring model.
                      </p>
                      <p className="text-[11px] text-cyan-800 mt-0.5">
                        Weighted formula: 35% live availability + 25% predicted flow + 20% facility match + 10% distance + 10% acoustics.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
                    className="text-[11px] font-bold text-cyan-700 hover:underline shrink-0"
                  >
                    {showFormulaExplanation ? "Hide Breakdown" : "View Breakdown"}
                  </button>
                </div>

                {/* Expandable Formula Explanation */}
                <AnimatePresence>
                  {showFormulaExplanation && (
                    <motion.div className="overflow-hidden">
                      <div className="card p-4 text-[12px] bg-white border border-[var(--color-border-subtle)] space-y-2">
                        <h4 className="font-bold text-[var(--color-text-primary)]">
                          How the Ranking is Calculated:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-center">
                          <div className="p-2 bg-[var(--color-surface-base)] rounded-[7px] border">
                            <span className="font-bold block text-cyan-700">35%</span>
                            <span className="text-[var(--color-text-muted)]">Live Availability</span>
                          </div>
                          <div className="p-2 bg-[var(--color-surface-base)] rounded-[7px] border">
                            <span className="font-bold block text-cyan-700">25%</span>
                            <span className="text-[var(--color-text-muted)]">Forecast Velocity</span>
                          </div>
                          <div className="p-2 bg-[var(--color-surface-base)] rounded-[7px] border">
                            <span className="font-bold block text-cyan-700">20%</span>
                            <span className="text-[var(--color-text-muted)]">Amenities Match</span>
                          </div>
                          <div className="p-2 bg-[var(--color-surface-base)] rounded-[7px] border">
                            <span className="font-bold block text-cyan-700">10%</span>
                            <span className="text-[var(--color-text-muted)]">Walking Distance</span>
                          </div>
                          <div className="p-2 bg-[var(--color-surface-base)] rounded-[7px] border">
                            <span className="font-bold block text-cyan-700">10%</span>
                            <span className="text-[var(--color-text-muted)]">Acoustic Fit</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── TOP RESULT HERO CARD ── */}
                {topMatch ? (
                <div className="card p-6 border border-[var(--color-cyan-500)] bg-white relative overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px] bg-[var(--color-navy-950)] text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles size={13} className="text-cyan-400" />
                      Top Recommended Space
                    </span>
                    <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-[6px]">
                      {topMatch.space.availableSeats} currently open seats
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-5">
                    <div className="flex-1">
                      <h3 className="text-[22px] font-black text-[var(--color-text-primary)]">
                        {topMatch.space.name}
                      </h3>
                      <p className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
                        <MapPin size={13} /> {topMatch.space.building}, {topMatch.space.floor}
                        <span>•</span>
                        <Clock size={13} /> {topMatch.space.distanceMinutes} min walk from Hostel Gate
                      </p>

                      {/* Why it won reasons */}
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          Why this spot ranked #1:
                        </p>
                        {topMatch.reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-[13px]">
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                            <span className="text-[var(--color-text-primary)] font-medium">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score Ring Display */}
                    <div className="bg-[var(--color-surface-base)] p-4 rounded-[6px] border border-[var(--color-border-subtle)] text-center shrink-0 w-36">
                      <span className="text-[34px] font-black text-[var(--color-cyan-700)] leading-none block">
                        {topMatch.score}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1 block">
                        Pulse Match Score
                      </span>
                      <div className="mt-2 text-[11px] font-semibold text-emerald-600">
                        {topMatch.space.occupancyPercent}% load right now
                      </div>
                    </div>
                  </div>

                  {/* Actions for Top Match */}
                  <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-3 flex-wrap">
                    {activeHold && (activeHold.status === "holding" || activeHold.status === "confirmed") ? (
                      <div className="p-2.5 rounded-[8px] bg-emerald-50 text-emerald-900 text-[12px] border border-emerald-200 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {activeHold.status === "holding" ? "Desk held" : "Checked in"} at {activeHold.spaceName}
                        </span>
                        <Link href="/reservations" className="font-bold underline underline-offset-2">
                          Manage reservation
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickHold(topMatch.space)}
                        className="btn btn-primary text-[13px] py-2 px-5 font-semibold inline-flex items-center gap-2"
                      >
                        <BookMarked size={14} /> Reserve a Seat
                      </button>
                    )}

                    <Link
                      href={`/spaces/${topMatch.space.id}`}
                      className="btn btn-secondary text-[12px] py-2 px-4 font-medium"
                    >
                      View Full Details
                    </Link>

                    <Link
                      href="/map"
                      className="btn btn-outline text-[12px] py-2 px-4 font-medium"
                    >
                      View on Map
                    </Link>
                  </div>
                </div>
                ) : (
                  <div className="card p-6 border border-[var(--color-border-subtle)] bg-white">
                    <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">
                      No open spaces match right now
                    </h3>
                    <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                      Try another activity or check the campus map for current availability.
                    </p>
                    <Link href="/map" className="btn btn-secondary mt-4 text-[12px] py-2 px-4 inline-flex items-center gap-2">
                      Explore the live map <ArrowRight size={13} />
                    </Link>
                  </div>
                )}

                {/* ── TWO ALTERNATIVE SPOTS COMPARISON ── */}
                {alternatives.length > 0 && (
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
                    Top Alternative Options
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alternatives.map((alt) => (
                      <div
                        key={alt.space.id}
                        className="card p-5 border border-[var(--color-border-subtle)] bg-white hover:border-[var(--color-cyan-500)] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-[15px] text-[var(--color-text-primary)]">
                              {alt.space.name}
                            </h4>
                            <span className="text-[12px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-[5px] border border-cyan-200">
                              Score: {alt.score}
                            </span>
                          </div>

                          <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5 mb-3">
                            <MapPin size={12} /> {alt.space.building} • {alt.space.distanceMinutes} min walk
                          </p>

                          <div className="space-y-1.5 mb-4 text-[12px]">
                            {alt.reasons.map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                          <span className="text-[12px] font-bold text-emerald-600">
                            {alt.space.availableSeats} seats open
                          </span>
                          <Link
                            href={`/spaces/${alt.space.id}`}
                            className="btn btn-secondary text-[11px] py-1.5 px-3"
                          >
                            Details & Hold <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </motion.div>
            )}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

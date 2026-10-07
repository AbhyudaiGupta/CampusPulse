"use client";

import { useState, useEffect } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge, StatusBadge, OccupancyBar, LiveUpdateIndicator } from "@/components/ui/Primitives";
import { useSpaces, useSimulator, useCurrentUser } from "@/hooks";
import { useApp } from "@/context/AppContext";
import {
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Activity,
  Flame,
  Sparkles,
  Bell,
  Check,
  RotateCcw,
  Clock,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  MapPin,
  CheckCircle2,
  Users,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface StepConfig {
  number: number;
  title: string;
  tagline: string;
  speakerCues: string[];
  actionLabel: string;
  actionSublabel: string;
  expectedResult: string;
}

const DEMO_STEPS: StepConfig[] = [
  {
    number: 1,
    title: "See the campus now",
    tagline: "Live anonymous spatial twin and baseline occupancy distribution",
    speakerCues: [
      "Welcome judges: CampusPulse solves unpredictable campus crowding using privacy-first, anonymous occupancy data.",
      "Notice our live digital twin showing 6 monitored campus spaces in nominal status.",
      "Every metric comes from simulated anonymous door and desk counters with zero cameras or individual tracking."
    ],
    actionLabel: "Verify Live Telemetry Baseline",
    actionSublabel: "Loads nominal campus baseline and checks sensor heartbeat",
    expectedResult: "The six demo spaces show their current occupancy, status, and simulated sensor heartbeat."
  },
  {
    number: 2,
    title: "Create a real operational problem",
    tagline: "Simulate a peak Lunch Rush surge across dining and quad corridors",
    speakerCues: [
      "Now watch what happens at peak hours: I will trigger a sudden Lunch Rush surge.",
      "Within seconds, anonymous door sensors report heavy influx to the Main Canteen.",
      "Watch the simulated occupancy and queue estimate rise as the canteen approaches its crowded threshold."
    ],
    actionLabel: "Simulate Lunch Rush Spike",
    actionSublabel: "Advances the simulated lunch rush and refreshes the occupancy cards",
    expectedResult: "Main Canteen occupancy and its queue estimate update from the simulator."
  },
  {
    number: 3,
    title: "Recommend a better student choice",
    tagline: "Personalized recommendation dynamically diverts student flow away from bottlenecks",
    speakerCues: [
      "Students can compare the canteen with quieter campus study spaces after a rush.",
      "The rank uses current occupancy, noise preference, walking time, and open seats.",
      "The recommendation updates from the six spaces in the demo data; no extra cafe is assumed."
    ],
    actionLabel: "Calculate Dynamic Alternative",
    actionSublabel: "Recalculates the top study-space match from the current simulated occupancy",
    expectedResult: "The top match shows its current load, open seats, noise level, and walking time."
  },
  {
    number: 4,
    title: "Close the feedback loop",
    tagline: "In-session crowd alert and a 10-minute demo seat hold",
    speakerCues: [
      "CampusPulse closes the loop between facility operations and student behavior.",
      "A student subscribes to an occupancy threshold alert. The open app watches for the space to cross that threshold.",
      "A separate demo action creates a 10-minute hold in the current session."
    ],
    actionLabel: "Execute Student Feedback Loop",
    actionSublabel: "Sets a threshold alert and creates a local 10-minute demo hold",
    expectedResult: "The alert and hold appear in the in-app demo state; they are not a hardware check-in."
  },
  {
    number: 5,
    title: "Help administrators act early",
    tagline: "Administrative What-If Planner estimates possible capacity interventions",
    speakerCues: [
      "The What-If planner compares an example overflow scenario before an administrator makes a real facilities decision.",
      "Its before-and-after figures are prototype estimates based on a scenario, not measured outcomes.",
      "This demo prepares an advisory preview; it does not change facility capacity or deploy a campus policy."
    ],
    actionLabel: "Prepare Seminar Hall Advisory",
    actionSublabel: "Prepares an advisory preview alongside the scenario estimate",
    expectedResult: "An advisory preview is prepared; the displayed before-and-after values remain estimates."
  }
];

export default function GuidedDemoPage() {
  const { user } = useCurrentUser();
  const { spaces, refetch: refetchSpaces } = useSpaces();
  const {
    status,
    setScenario,
    tick,
    reset,
    applyInsight,
  } = useSimulator(() => {
    refetchSpaces();
  });

  const {
    subscribeCrowdAlert,
    createSeatReservation,
    notifications,
    activeHold,
  } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Rehearsal stopwatch timer (0:00 to 2:00)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev < 120 ? prev + 1 : 120));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const activeStep = DEMO_STEPS[currentStepIndex];

  // Step specific handlers
  const handleExecuteStepAction = async () => {
    setIsExecutingAction(true);
    setActionFeedback(null);

    try {
      if (currentStepIndex === 0) {
        // Step 1: Normal Baseline
        await setScenario("normal");
        await tick();
        refetchSpaces();
        setActionFeedback("Baseline campus telemetry verified. 6 spaces operating within nominal limits.");
      } else if (currentStepIndex === 1) {
        // Step 2: Trigger Lunch Rush
        await setScenario("lunch_rush");
        await tick();
        refetchSpaces();
        setActionFeedback("Lunch Rush simulation advanced. Check the Main Canteen card for its updated occupancy and queue estimate.");
      } else if (currentStepIndex === 2) {
        await tick();
        refetchSpaces();
        const recommendationResponse = await fetch("/api/recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceTypes: ["study_space"],
            maxWalkMinutes: 15,
            preferredNoise: ["quiet"],
            maxOccupancy: 100,
          }),
        });
        const recommendationJson = await recommendationResponse.json();
        const topRecommendation = recommendationJson.recommendations?.[0];
        if (!recommendationResponse.ok || !topRecommendation) {
          setActionFeedback("No study space currently matches these filters. Try the full space directory.");
        } else {
          setActionFeedback(
            `Current top match: ${topRecommendation.space.name} — ${topRecommendation.space.occupancyPercent}% occupied, ${topRecommendation.space.availableSeats} seats open, ${topRecommendation.space.distanceMinutes} min walk.`
          );
        }
      } else if (currentStepIndex === 3) {
        // Step 4: Close the feedback loop (Subscribe, free space, notify, hold seat)
        subscribeCrowdAlert("central-library", "Central Library", 70);
        // Simulate seat freeing in library
        await tick();
        refetchSpaces();
        createSeatReservation({
          spaceId: "central-library",
          spaceName: "Central Library",
          building: "Library Complex",
          spaceType: "study_space",
          seatId: "DESK-A14",
        });
        setActionFeedback("Alert threshold set and a 10-minute demo hold created. Occupancy alerts continue while this app session is open.");
      } else if (currentStepIndex === 4) {
        // Step 5: What-if Capacity Planner Action
        await applyInsight({
          id: `demo-seminar-${Date.now()}`,
          spaceId: "seminar-hall-a",
          spaceName: "Seminar Hall A",
          signal: "Capacity Intervention Applied",
          signalType: "high_capacity",
          rationale: "Opened Seminar Hall A as temporary quiet study venue to absorb library overflow.",
          suggestedAction: "Open Seminar Hall A as Temporary Study Space",
          estimatedPrototypeEffect: "Example estimate: shifts some study demand to Seminar Hall A",
          severity: "warning",
        }, { previewOnly: true });
        setActionFeedback("Advisory preview prepared. Capacity changes in the planner are estimates; no facility policy was deployed.");
      }
    } catch (error) {
      setActionFeedback(
        error instanceof Error
          ? `Action could not be completed: ${error.message}`
          : "Action could not be completed. Check the connection and try again."
      );
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleResetDemo = async () => {
    setIsExecutingAction(true);
    try {
      await reset();
      await setScenario("normal");
      setCurrentStepIndex(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setActionFeedback("Demo reset to Step 1 baseline.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Find spaces for visualization
  const canteen = spaces.find((s) => s.id.includes("canteen")) || spaces[0];
  const library = spaces.find((s) => s.id.includes("library")) || spaces[1];
  const cafe = spaces.find((s) => s.id.includes("cafe")) || spaces[2];

  // Total summary metrics
  const totalCapacity = spaces.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = spaces.reduce((acc, s) => acc + s.occupied, 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 58;
  const crowdedCount = spaces.filter((s) => s.occupancyPercent >= 80).length;

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role="admin" userName="Presenter Demo" />
      <main className="app-main" id="main-content">
        <TopNav
          title="2-Minute Guided Judge Presentation"
          breadcrumb={["CampusPulse", "Guided Demo"]}
          userName="Presenter Demo"
          role="admin"
        />

        <div className="page-content space-y-6">
          <PageTransition>
            {/* ── Top Presentation Header Bar ────────────────────────────── */}
            <div className="card p-5 border border-[var(--color-border-subtle)] bg-white">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PlayCircle size={22} className="text-cyan-600" />
                    <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] tracking-tight">
                      CampusPulse 2-Minute Judge Walkthrough
                    </h1>
                    <DemoDataBadge />
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">
                    Curated five-step interactive narrative showcasing real-time occupancy, automated rerouting, and operational interventions.
                  </p>
                </div>

                {/* Presentation Controls: Stopwatch + Reset + Quick Nav */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Rehearsal Pitch Stopwatch */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <Clock size={14} className={timerSeconds > 105 ? "text-red-500" : "text-cyan-600"} />
                    <span className="font-mono text-[13px] font-bold text-[var(--color-text-primary)]">
                      {formatTimer(timerSeconds)} <span className="text-[11px] text-[var(--color-text-muted)] font-normal">/ 2:00</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 underline ml-1 cursor-pointer"
                    >
                      {isTimerRunning ? "Pause" : "Start"}
                    </button>
                  </div>

                  {/* Reset Presentation Button */}
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={isExecutingAction}
                    className="btn btn-secondary text-[12px] py-1.5 px-3 rounded-[8px] flex items-center gap-1.5"
                    title="Reset to Step 1 and Normal campus baseline"
                  >
                    <RotateCcw size={13} />
                    Reset Presentation
                  </button>

                  {/* External links to Full Student View and Admin View */}
                  <Link
                    href="/"
                    target="_blank"
                    className="btn btn-outline text-[12px] py-1.5 px-3 rounded-[8px] flex items-center gap-1.5"
                  >
                    Student View <ExternalLink size={12} />
                  </Link>
                  <Link
                    href="/admin"
                    target="_blank"
                    className="btn btn-primary text-[12px] py-1.5 px-3 rounded-[8px] flex items-center gap-1.5"
                  >
                    Command Centre <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              {/* 5-Step Stepper Tabs (Medium-radius rectangles, no pills) */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
                {DEMO_STEPS.map((s, idx) => {
                  const isActive = currentStepIndex === idx;
                  const isCompleted = idx < currentStepIndex;
                  return (
                    <button
                      key={s.number}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setActionFeedback(null);
                      }}
                      className={`p-2.5 rounded-[8px] border text-left ${
                        isActive
                          ? "bg-[var(--color-navy-950)] text-white border-[var(--color-navy-950)] ring-1 ring-cyan-400/20"
                          : isCompleted
                          ? "bg-cyan-50/50 text-[var(--color-text-primary)] border-cyan-200 hover:bg-cyan-50"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? "text-cyan-300" : isCompleted ? "text-cyan-700" : "text-[var(--color-text-muted)]"
                        }`}>
                          Step {s.number} of 5
                        </span>
                        {isCompleted && (
                          <Check size={12} className={isActive ? "text-cyan-300" : "text-cyan-600"} />
                        )}
                      </div>
                      <div className="text-[12px] font-bold truncate leading-tight">
                        {s.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Main Split Stage: Speaker Cues & Controls (Left) + Interactive Visual Stage (Right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 cols): Presenter Cues & Direct Action Button */}
              <div className="lg:col-span-5 space-y-4">
                <div className="card p-5 border border-[var(--color-border-subtle)] bg-white space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-[6px] bg-cyan-600 text-white font-bold text-[12px] flex items-center justify-center">
                        {activeStep.number}
                      </span>
                      <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
                        {activeStep.title}
                      </h2>
                    </div>
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {activeStep.tagline}
                    </p>
                  </div>

                  {/* Speaker Cue Text Card */}
                  <div className="p-3.5 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-800">
                      <Activity size={12} />
                      <span>Speaker Cue (Say this to judges in ~20s)</span>
                    </div>
                    <ul className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                      {activeStep.speakerCues.map((cue, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-600 font-bold mt-0.5">&bull;</span>
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Direct Action Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleExecuteStepAction}
                      disabled={isExecutingAction}
                      className="btn btn-primary w-full py-3 px-4 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2"
                    >
                      {isExecutingAction ? (
                        <>
                          <Activity size={15} className="animate-spin text-cyan-300" />
                          Simulating Action...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={15} className="text-cyan-400" />
                          {activeStep.actionLabel}
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-1.5">
                      {activeStep.actionSublabel}
                    </p>
                  </div>

                  {/* Action Feedback Banner */}
                  {actionFeedback && (
                    <div className="p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                      <div>{actionFeedback}</div>
                    </div>
                  )}

                  {/* Expected Visual Result Notice */}
                  <div className="p-3 rounded-[8px] bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-blue-950">
                      <Sparkles size={12} /> Expected Result for Judges:
                    </div>
                    <p className="leading-relaxed">{activeStep.expectedResult}</p>
                  </div>

                  {/* Stepper Navigation Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                    <button
                      type="button"
                      disabled={currentStepIndex === 0}
                      onClick={() => {
                        setCurrentStepIndex(currentStepIndex - 1);
                        setActionFeedback(null);
                      }}
                      className="btn btn-secondary text-[12px] py-1.5 px-3 rounded-[8px] flex items-center gap-1 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    <button
                      type="button"
                      disabled={currentStepIndex === DEMO_STEPS.length - 1}
                      onClick={() => {
                        setCurrentStepIndex(currentStepIndex + 1);
                        setActionFeedback(null);
                      }}
                      className="btn btn-primary text-[12px] py-1.5 px-4 rounded-[8px] flex items-center gap-1 font-semibold disabled:opacity-40"
                    >
                      Next Step <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Interactive Live Visual Stage */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {/* ── STEP 1 VISUAL STAGE: See the campus now ──────────────── */}
                  {currentStepIndex === 0 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Metric summary strip */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="card p-3 border border-[var(--color-border-subtle)] bg-white">
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Monitored Spaces</p>
                          <p className="text-[20px] font-bold text-[var(--color-text-primary)]">{spaces.length}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">100% telemetry online</p>
                        </div>
                        <div className="card p-3 border border-[var(--color-border-subtle)] bg-white">
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Current Campus Load</p>
                          <p className="text-[20px] font-bold text-[var(--color-text-primary)]">{avgOccupancy}%</p>
                          <p className="text-[10px] text-cyan-600 font-semibold">{totalOccupied} of {totalCapacity} students</p>
                        </div>
                        <div className="card p-3 border border-[var(--color-border-subtle)] bg-white">
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Available Seats</p>
                          <p className="text-[20px] font-bold text-emerald-600">{Math.max(0, totalCapacity - totalOccupied)}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">Across 6 facilities</p>
                        </div>
                      </div>

                      {/* Visual Map Digital Twin */}
                      <div className="card p-4 border border-[var(--color-border-subtle)] bg-white space-y-3">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <Compass size={14} className="text-cyan-600" />
                            Live Campus Digital Twin Snapshot
                          </span>
                          <LiveUpdateIndicator state="live" label="Live Stream" />
                        </div>

                        {/* Interactive Vector Space Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {spaces.map((s) => (
                            <div
                              key={s.id}
                              className="p-3 rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold text-[var(--color-text-primary)] truncate">
                                  {s.name}
                                </span>
                                <StatusBadge status={s.status} />
                              </div>
                              <OccupancyBar percent={s.occupancyPercent} status={s.status} height={6} />
                              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                                <span>{s.occupied} / {s.capacity} occupied</span>
                                <span className="font-semibold text-emerald-700">{s.availableSeats} free</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-[6px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
                          <span>Simulated anonymous sensor feed &bull; Hardware privacy-safe</span>
                          <span className="text-cyan-700 font-semibold">Zero Biometric Tracking</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 2 VISUAL STAGE: Create an operational problem ──── */}
                  {currentStepIndex === 1 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Operational Surge Alert Card */}
                      <div className="card p-4 border border-red-200 bg-red-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <Flame size={12} className="text-red-600" />
                            Live Operational Pressure
                          </span>
                          <span className="text-[11px] font-bold text-red-700">
                            Scenario: {status.scenarioTitle}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-red-950">
                          Main Dining Hall Approaching Critical Capacity
                        </h3>
                        <p className="text-[12px] text-red-800 leading-relaxed">
                          Anonymous optical door counters report a continuous inward surge at Main Canteen. Projected queue delay is escalating rapidly.
                        </p>
                      </div>

                      {/* Focused Dining Hall Telemetry Card */}
                      <div className="card p-5 border border-[var(--color-border-subtle)] bg-white space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-[16px] font-bold text-[var(--color-text-primary)]">
                              {canteen.name}
                            </h4>
                            <p className="text-[12px] text-[var(--color-text-muted)]">
                              {canteen.building} &bull; Food Services Sector
                            </p>
                          </div>
                          <StatusBadge status={canteen.status} />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[12px] font-semibold">
                            <span className="text-[var(--color-text-muted)]">Live Occupancy Density</span>
                            <span className="text-red-600 font-bold">{canteen.occupancyPercent}%</span>
                          </div>
                          <OccupancyBar percent={canteen.occupancyPercent} status={canteen.status} height={10} />
                          <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
                            <span>{canteen.occupied} of {canteen.capacity} seats taken</span>
                            <span className="text-red-600 font-bold">{canteen.availableSeats} seats remaining</span>
                          </div>
                        </div>

                        {/* Queue Pressure Metrics */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                            <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Est. Checkout Queue</p>
                            <p className="text-[18px] font-bold text-red-600">{canteen.estimatedWaitMinutes} min wait</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">+8 min vs 30m ago</p>
                          </div>
                          <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                            <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Ambient Noise Level</p>
                            <p className="text-[18px] font-bold text-amber-600 capitalize">{canteen.noiseLevel}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">Acoustic pressure peak</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-[6px] bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between">
                          <span>Transit Vector: Academic Block &rarr; Main Canteen</span>
                          <span className="text-amber-400 font-bold">High Inflow Rate</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 3 VISUAL STAGE: Recommend a better student choice ─ */}
                  {currentStepIndex === 2 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div className="card p-4 border border-[var(--color-border-subtle)] bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                            <Sparkles size={12} className="text-cyan-600" />
                            Dynamic Student Routing Engine
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">Query: Quick Lunch &amp; Study</span>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-secondary)]">
                          Instead of sending students to the congested dining hall, CampusPulse evaluates availability, proximity, and queue delays to recommend optimal alternatives.
                        </p>
                      </div>

                      {/* Comparison: Bottleneck vs Recommended Alternative */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Avoid Bottleneck Card */}
                        <div className="card p-4 border border-red-200 bg-red-50/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-red-100 text-red-800">
                              Overcrowded Bottleneck
                            </span>
                            <span className="text-[11px] text-red-700 font-bold">Rank #6</span>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-[var(--color-text-primary)]">{canteen.name}</h4>
                            <p className="text-[11px] text-[var(--color-text-muted)]">Central Quad</p>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Occupancy</span>
                              <span className="text-red-600 font-bold">{canteen.occupancyPercent}% (Crowded)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Queue Delay</span>
                              <span className="text-red-600 font-bold">14 min wait</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Noise</span>
                              <span className="text-amber-600 font-bold">Loud</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-[6px] bg-white border border-red-200 text-[10px] text-red-700">
                            Warning: Peak capacity reached. High wait times expected.
                          </div>
                        </div>

                        {/* Recommended Alternative Card */}
                        <div className="card p-4 border border-emerald-300 bg-emerald-50/40 space-y-3 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Check size={11} />
                              Recommended Choice
                            </span>
                            <span className="text-[11px] text-emerald-800 font-bold">Rank #1 (Score: 94)</span>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-[var(--color-text-primary)]">{cafe.name}</h4>
                            <p className="text-[11px] text-[var(--color-text-muted)]">{cafe.building}</p>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Occupancy</span>
                              <span className="text-emerald-700 font-bold">{cafe.occupancyPercent}% (Comfortable)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Queue Delay</span>
                              <span className="text-emerald-700 font-bold">0 min wait</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-muted)]">Walk Time</span>
                              <span className="text-slate-700 font-bold">4 min walk</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-[6px] bg-white border border-emerald-200 text-[10px] text-emerald-800 font-medium">
                            Rationale: 34 seats free &bull; Zero queue &bull; Terrace seating available
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 4 VISUAL STAGE: Close the feedback loop ─────────── */}
                  {currentStepIndex === 3 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Active In-App Notification Banner */}
                      <div className="card p-4 border border-cyan-300 bg-cyan-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-cyan-100 text-cyan-900 border border-cyan-200 flex items-center gap-1">
                            <Bell size={11} className="text-cyan-700" />
                            Live In-App Alert
                          </span>
                          <span className="text-[10px] text-cyan-700 font-semibold">Just Now</span>
                        </div>
                        <h4 className="text-[14px] font-bold text-cyan-950">
                          Seat Free in Central Library
                        </h4>
                        <p className="text-[12px] text-cyan-900 leading-relaxed">
                          Occupancy dropped below 70%! 18 desks are currently open on Level 2. Your subscribed alert triggered this notification.
                        </p>
                      </div>

                      {/* Active 10-Minute Hold Pass Ticket */}
                      <div className="card p-5 border border-[var(--color-border-subtle)] bg-white space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Active Hold Confirmed
                            </span>
                            <h4 className="text-[16px] font-bold text-[var(--color-text-primary)] mt-1.5">
                              {activeHold ? activeHold.spaceName : library.name}
                            </h4>
                            <p className="text-[12px] text-[var(--color-text-muted)]">
                              Desk {activeHold ? activeHold.seatId : "DESK-A14"} &bull; Silent Workstation Wing
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[var(--color-text-muted)] block">Hold Time Window</span>
                            <span className="font-mono text-[14px] font-bold text-cyan-700">10:00 min pass</span>
                          </div>
                        </div>

                        {/* Space load indicator */}
                        <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--color-text-muted)]">Post-Drop Capacity</span>
                            <span className="font-bold text-emerald-700">68% Load (Available)</span>
                          </div>
                          <OccupancyBar percent={68} status="quiet" height={6} />
                          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
                            <span>120 / 180 occupied</span>
                            <span className="font-semibold text-emerald-600">60 seats free</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-[8px] border border-dashed border-cyan-300 bg-cyan-50/30 flex items-center justify-between text-[11px] text-cyan-950">
                          <div>
                            <span className="font-bold block">Digital Student Check-In Pass</span>
                            <span className="text-[10px] text-cyan-800">Scan at entrance terminal to release hold</span>
                          </div>
                          <span className="font-mono text-[12px] font-bold px-2 py-1 bg-white rounded-[6px] border border-cyan-200">
                            PASS-8841
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 5 VISUAL STAGE: Help administrators act early ───── */}
                  {currentStepIndex === 4 && (
                    <motion.div
                      key="step-5"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* What-If Capacity Comparison Card */}
                      <div className="card p-5 border border-[var(--color-border-subtle)] bg-white space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                          <div>
                            <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                              What-If Capacity Scenario
                            </h3>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              Example estimate: Open Seminar Hall A as overflow study space
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-cyan-50 text-cyan-800 border border-cyan-200">
                            Illustrative Estimate
                          </span>
                        </div>

                        {/* Before vs After Metric Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                            <span className="text-[10px] text-[var(--color-text-muted)] block">Crowded Zones</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-[16px] font-bold text-red-600 line-through">2</span>
                              <span className="text-[20px] font-bold text-emerald-600">1</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold">-50% congestion</span>
                          </div>

                          <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                            <span className="text-[10px] text-[var(--color-text-muted)] block">Available Seats</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-[16px] font-bold text-slate-500">140</span>
                              <span className="text-[20px] font-bold text-emerald-600">230</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold">+90 quiet seats</span>
                          </div>

                          <div className="p-3 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                            <span className="text-[10px] text-[var(--color-text-muted)] block">Example Queue Wait</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-[16px] font-bold text-red-600 line-through">11m</span>
                              <span className="text-[20px] font-bold text-emerald-600">7m</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold">Illustrative change</span>
                          </div>
                        </div>

                        {/* Rebalanced spatial distribution */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-bold text-[var(--color-text-primary)] block">
                            Example Occupancy Distribution
                          </span>
                          <div className="p-2.5 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-secondary)]">Seminar Hall A (New Overflow)</span>
                              <span className="font-bold text-cyan-700">65% estimated load (example)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-secondary)]">Central Library</span>
                              <span className="font-bold text-emerald-700">94% &rarr; 72% example</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-text-secondary)]">Study Room C</span>
                              <span className="font-bold text-amber-700">88% &rarr; 68% example</span>
                            </div>
                          </div>
                        </div>

                        {/* Broadcast notice */}
                        <div className="p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                          <span>Advisory preview prepared. No campus policy or occupancy setting changed.</span>
                          <span className="font-bold text-emerald-800">Preview Only</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

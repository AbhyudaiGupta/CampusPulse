"use client";

import { useState, useEffect } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge, EmptyState } from "@/components/ui/Primitives";
import { useApp } from "@/context/AppContext";
import {
  BookMarked,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { SPACE_TYPE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

function formatReservationTime(time: string) {
  const [hourValue, minuteValue] = time.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;

  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReservationsPage() {
  const { user, reservations, activeHold, confirmCheckIn, cancelHold } = useApp();
  const [tab, setTab] = useState<"active" | "history">("active");
  const visibleReservations = reservations.filter((reservation) =>
    tab === "active"
      ? reservation.status === "upcoming" || reservation.status === "active"
      : reservation.status === "completed" || reservation.status === "cancelled" || reservation.status === "expired"
  );
  const activeReservationCount = reservations.filter(
    (reservation) => reservation.status === "upcoming" || reservation.status === "active"
  ).length;
  const historyReservationCount = reservations.length - activeReservationCount;

  // Live timer for 10-minute hold
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!activeHold || activeHold.status !== "holding") {
      setSecondsRemaining(0);
      return;
    }

    function updateTimer() {
      const remainingMs = Math.max(0, (activeHold?.expiresAt ?? 0) - Date.now());
      setSecondsRemaining(Math.floor(remainingMs / 1000));
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeHold]);

  const minutesLeft = Math.floor(secondsRemaining / 60);
  const secondsLeft = secondsRemaining % 60;
  const timerPercentage = Math.min(100, (secondsRemaining / 600) * 100);

  const exactExpiryTime = activeHold
    ? new Date(activeHold.expiresAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role ?? "student"} userName={user?.name ?? "Student Demo"} />

      <main className="app-main" id="main-content">
        <TopNav
          title="Reservations & Holds"
          breadcrumb={["CampusPulse", "Reservations"]}
          userName={user?.name ?? "Student Demo"}
          role={user?.role ?? "student"}
        />

        <div className="page-content max-w-[900px]">
          <PageTransition>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                  My Space Holds & Bookings
                </h1>
                <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                  10-minute check-in reservations, confirmed desk holds, and session history.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DemoDataBadge />
                <Link
                  href="/recommendation"
                  className="btn btn-primary text-[12px] py-1.5 px-3 font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles size={13} /> Find & Hold Spot
                </Link>
              </div>
            </div>

            {/* ── ACTIVE 10-MINUTE HOLD HIGHLIGHT CARD ── */}
            {activeHold && activeHold.status !== "cancelled" && activeHold.status !== "expired" && activeHold.status !== "completed" && (
              <div className="card p-6 mb-7 border border-[var(--color-cyan-500)] bg-cyan-50/40">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-[6px] bg-cyan-500/20 text-cyan-600">
                      <Clock size={16} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-cyan-700)]">
                      {activeHold.status === "confirmed"
                        ? "Check-In Verified (Active Booking)"
                        : "Active 10-Minute Desk Hold"}
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-cyan-900 bg-cyan-100 px-2.5 py-0.5 rounded-[6px]">
                    Seat: {activeHold.seatId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left Info */}
                  <div className="md:col-span-8">
                    <h2 className="text-[20px] font-extrabold text-[var(--color-text-primary)]">
                      {activeHold.spaceName}
                    </h2>
                    <p className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
                      <MapPin size={13} /> {activeHold.building}
                    </p>

                    {/* Expiry guidance */}
                    {activeHold.status === "holding" ? (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-[8px] p-2.5 text-[12px] text-amber-900">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertCircle size={13} /> Check in before {exactExpiryTime}
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Your desk is locked for 10 minutes. Tap Check-in once you reach the carrel to avoid releasing the seat.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-[8px] p-2.5 text-[12px] text-emerald-900">
                        <p className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> Session Checked In & Active
                        </p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Your reservation is active for {activeHold.sessionDurationHours} {activeHold.sessionDurationHours === 1 ? "hour" : "hours"}. Enjoy your focus session!
                        </p>
                      </div>
                    )}

                    {/* Directions hint */}
                    <Link href="/map" className="flex items-center gap-2 mt-3 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-cyan-700)]">
                      <Footprints size={14} className="text-[var(--color-cyan-600)]" />
                      <span>Open the campus map for directions.</span>
                    </Link>
                  </div>

                  {/* Right Animated Countdown Timer */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-[12px] border border-[var(--color-border-subtle)] text-center">
                    {activeHold.status === "holding" ? (
                      <>
                        <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="var(--color-surface-muted)"
                              strokeWidth="7"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={secondsRemaining < 120 ? "#ef4444" : "#06b6d4"}
                              strokeWidth="7"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - timerPercentage / 100)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-linear"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[20px] font-black text-[var(--color-text-primary)] leading-none">
                              {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">
                              Hold Left
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full mt-1">
                          <button
                            type="button"
                            onClick={() => confirmCheckIn(activeHold.id)}
                            className="btn btn-primary flex-1 justify-center text-[12px] py-2 font-bold"
                          >
                            Check In
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelHold(activeHold.id)}
                            className="btn btn-secondary text-[12px] py-2 px-3 text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center">
                        <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                        <span className="font-bold text-[14px] text-[var(--color-text-primary)] block">
                          Desk Confirmed
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          Session ends at {activeHold.sessionEndsAt
                            ? new Date(activeHold.sessionEndsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                            : exactExpiryTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => cancelHold(activeHold.id)}
                          className="btn btn-secondary mt-3 text-[12px] py-1.5 px-3 text-red-600 hover:bg-red-50"
                        >
                          Release this seat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab navigation (Rectangular, non-pill) */}
            <div className="flex gap-2 p-1 bg-[var(--color-surface-muted)] rounded-[9px] mb-5 w-fit border border-[var(--color-border-subtle)] text-[12px]">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`px-3 py-1.5 rounded-[7px] font-semibold transition-all ${
                  tab === "active"
                    ? "bg-white text-[var(--color-navy-950)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-pressed={tab === "active"}
              >
                Upcoming & Holds ({activeReservationCount})
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={`px-3 py-1.5 rounded-[7px] font-semibold transition-all ${
                  tab === "history"
                    ? "bg-white text-[var(--color-navy-950)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-pressed={tab === "history"}
              >
                Previous History ({historyReservationCount})
              </button>
            </div>

            {/* Reservations List */}
            {visibleReservations.length === 0 ? (
              <EmptyState
                icon={<BookMarked size={24} />}
                title={tab === "active" ? "No upcoming reservations" : "No reservation history yet"}
                body={tab === "active"
                  ? "Explore open study spaces, labs, and quiet carrels to hold a desk for 10 minutes."
                  : "Completed, cancelled, and expired reservations will appear here."}
                action={tab === "active" ? (
                  <Link href="/recommendation" className="btn btn-primary text-[12px]">
                    Find an Open Desk
                  </Link>
                ) : undefined}
              />
            ) : (
              <div className="space-y-3">
                {visibleReservations.map((res, i) => (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card p-4.5 border border-[var(--color-border-subtle)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                            {res.spaceName}
                          </h3>
                          <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                            {SPACE_TYPE_LABELS[res.spaceType]}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] border ${
                              res.status === "upcoming"
                                ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                                : res.status === "active"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : res.status === "completed"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : res.status === "expired"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {res.building}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {formatDate(res.date)} ({formatReservationTime(res.startTime)} – {formatReservationTime(res.endTime)})
                          </span>
                        </p>
                        {res.notes && (
                          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 font-medium">
                            {res.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/spaces/${res.spaceId}`}
                          className="btn btn-secondary text-[12px] py-1.5 px-3 font-medium"
                        >
                          Space Details <ArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

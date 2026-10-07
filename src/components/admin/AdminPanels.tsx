"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronDown, ChevronUp, RefreshCw, ShieldCheck, Wifi, WifiOff, Database, Clock } from "lucide-react";
import { useConnectionState, useRelativeTime } from "@/hooks/useRealtime";
import { useApp } from "@/context/AppContext";
import type { CampusSpace } from "@/lib/types";

// ── Admin Live Event Feed ────────────────────────────────────────────────────

export interface LiveEvent {
  id: string;
  timestamp: string;
  spaceName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
}

interface AdminEventFeedProps {
  spaces: CampusSpace[];
}

/**
 * Refined event stream for admin: shows occupancy/queue changes.
 * Retains last 10 events and animates new insertions.
 */
export function AdminEventFeed({ spaces }: AdminEventFeedProps) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const connState = useConnectionState();

  // Generate simulated events in demo mode
  useEffect(() => {
    if (connState === "live") return; // Real events come from realtime subscriptions

    const interval = setInterval(() => {
      const space = spaces[Math.floor(Math.random() * spaces.length)];
      if (!space) return;

      const isQueue = Math.random() > 0.6;
      const field = isQueue ? "queue" : "occupancy";
      const delta = Math.floor(Math.random() * 8) - 3;
      const oldVal = isQueue ? Math.max(0, space.estimatedWaitMinutes) : space.occupied;
      const newVal = Math.max(0, oldVal + delta);

      const event: LiveEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
        spaceName: space.name,
        field,
        oldValue: oldVal,
        newValue: newVal,
      };

      setEvents((prev) => [event, ...prev].slice(0, 10));
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [connState, spaces]);

  // For live mode, listen via realtime hook effects
  const addEvent = useCallback((event: LiveEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 10));
  }, []);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={15} className="text-[var(--color-cyan-500)]" />
        <h2 className="section-title mb-0">Live Event Feed</h2>
        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">Last {events.length} events</span>
      </div>

      <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-muted)] py-6 text-center">Waiting for events...</p>
          ) : (
            events.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-3 text-[12px] px-3 py-2 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]"
              >
                <span className="text-[var(--color-text-muted)] font-mono text-[11px] shrink-0 w-[70px]">{evt.timestamp}</span>
                <span className="w-px h-3 bg-[var(--color-border)] shrink-0" aria-hidden />
                <span className="font-medium text-[var(--color-text-primary)] truncate flex-1">{evt.spaceName}</span>
                <span className="w-px h-3 bg-[var(--color-border)] shrink-0" aria-hidden />
                <span className="text-[var(--color-text-muted)] shrink-0">
                  {evt.field} {evt.oldValue} to {evt.newValue}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Admin Diagnostics Panel ──────────────────────────────────────────────────

/**
 * Collapsed developer diagnostics panel, visible only to authenticated admin.
 * Shows auth role, app mode, realtime state, last update, no secrets.
 */
export function AdminDiagnostics() {
  const [expanded, setExpanded] = useState(false);
  const { user, isSupabaseConnected } = useApp();
  const connState = useConnectionState();
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const relativeTime = useRelativeTime(lastUpdate);

  // Only show for admin
  if (user?.role !== "admin") return null;

  const mode = isSupabaseConnected ? "Live (Supabase)" : "Demo (Mock Data)";
  const connLabel = connState === "live" ? "Connected" : connState === "reconnecting" ? "Reconnecting..." : "Demo channel";
  const connColor = connState === "live" ? "text-emerald-600" : connState === "reconnecting" ? "text-amber-600" : "text-slate-500";

  return (
    <div className="card border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[var(--color-text-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">Developer Diagnostics</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={14} className="text-[var(--color-text-muted)]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">Auth role:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{user?.role || "none"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database size={12} className="text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">App mode:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{mode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {connState === "live" ? <Wifi size={12} className="text-emerald-600" /> : <WifiOff size={12} className="text-slate-400" />}
                  <span className="text-[var(--color-text-muted)]">Realtime:</span>
                  <span className={`font-semibold ${connColor}`}>{connLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">Last data:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{relativeTime}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setLastUpdate(new Date().toISOString());
                  window.location.reload();
                }}
                className="btn btn-secondary text-[11px] py-1.5 px-3 mt-3 w-full flex items-center gap-1.5 justify-center"
              >
                <RefreshCw size={11} />
                Force refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

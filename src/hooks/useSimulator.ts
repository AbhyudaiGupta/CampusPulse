"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { SimulatorScenario, SimulatorStatus, OperationalInsight } from "@/lib/types";

const INITIAL_STATUS: SimulatorStatus = {
  isRunning: false,
  scenario: "normal",
  scenarioTitle: "Normal Campus Day",
  frequencySeconds: 3,
  lastTickAt: null,
  totalTicks: 0,
  serverIntervalActive: false,
  recentEvents: [],
};

export function useSimulator(onTelemetryTick?: () => void) {
  const { addToast } = useToast();
  const telemetryCallback = useRef(onTelemetryTick);
  useEffect(() => { telemetryCallback.current = onTelemetryTick; }, [onTelemetryTick]);
  const [status, setStatus] = useState<SimulatorStatus>(INITIAL_STATUS);
  const [insights, setInsights] = useState<OperationalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [applyingInsightId, setApplyingInsightId] = useState<string | null>(null);

  const prevTicksRef = useRef(0);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPulse = useCallback(() => {
    setIsPulsing(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 1200);
  }, []);

  // Surface failed actions instead of displaying a false success.
  const readAction = useCallback(async (response: Response) => {
    const json = await response.json();
    if (!response.ok || !json.success) {
      const message = json.error || "Simulation action failed. Please try again.";
      addToast({ title: "Action failed", body: message, variant: "error" });
      throw new Error(message);
    }
    return json;
  }, [addToast]);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/simulator/status");
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
        if (json.status.totalTicks !== prevTicksRef.current) {
          prevTicksRef.current = json.status.totalTicks;
          triggerPulse();
          telemetryCallback.current?.();
        }
      }
    } catch {
      // Ignore in background
    }
  }, [triggerPulse]);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/simulator/insights");
      const json = await res.json();
      if (json.success && Array.isArray(json.insights)) {
        setInsights(json.insights);
      }
    } catch {
      // Ignore in background
    }
  }, []);

  // Poll status & insights
  useEffect(() => {
    fetchStatus();
    fetchInsights();

    const interval = setInterval(() => {
      fetchStatus();
      fetchInsights();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchInsights]);

  // Start
  const start = useCallback(async (scenario?: SimulatorScenario, freq?: number) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, frequencySeconds: freq }),
      });
      const json = await readAction(res);
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        telemetryCallback.current?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, fetchInsights, readAction]);

  // Stop
  const stop = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/stop", { method: "POST" });
      const json = await readAction(res);
      if (json.success && json.status) {
        setStatus(json.status);
      }
    } finally {
      setIsLoading(false);
    }
  }, [readAction]);

  // Switch scenario
  const setScenario = useCallback(async (scenario: SimulatorScenario) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await readAction(res);
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        telemetryCallback.current?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, fetchInsights, readAction]);

  // Reset
  const reset = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/reset", { method: "POST" });
      const json = await readAction(res);
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        telemetryCallback.current?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, fetchInsights, readAction]);

  // Execute 1 tick manually
  const tick = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/tick", { method: "POST" });
      const json = await readAction(res);
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        telemetryCallback.current?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, fetchInsights, readAction]);

  // Serverless hosts stop work after a response. The open admin page drives
  // sequential ticks; status and occupancy persist in browser-scoped cookies.
  useEffect(() => {
    if (!status.isRunning || isLoading) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function advance() {
      try {
        const response = await fetch("/api/simulator/tick", { method: "POST" });
        const json = await response.json();
        if (!cancelled && response.ok && json.success) {
          setStatus(json.status);
          telemetryCallback.current?.();
          void fetchInsights();
        }
      } catch {
        // Keep the last result; the next scheduled request retries.
      } finally {
        if (!cancelled) timer = setTimeout(advance, status.frequencySeconds * 1000);
      }
    }
    timer = setTimeout(advance, status.frequencySeconds * 1000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [status.isRunning, status.frequencySeconds, isLoading, fetchInsights]);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
  }, []);

  // Apply insight recommendation
  const applyInsight = useCallback(async (
    insight: OperationalInsight,
    options?: { previewOnly?: boolean }
  ) => {
    try {
      setApplyingInsightId(insight.id);
      const response = await fetch("/api/simulator/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insightId: insight.id,
          spaceId: insight.spaceId,
          spaceName: insight.spaceName,
          suggestedAction: insight.suggestedAction,
          noticeTitle: `Campus Advisory: ${insight.spaceName}`,
          noticeBody: `Suggested campus response: ${insight.suggestedAction}`,
          previewOnly: options?.previewOnly ?? false,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Could not prepare the advisory.");
      }
      // Re-fetch insights
      await fetchInsights();
    } finally {
      setApplyingInsightId(null);
    }
  }, [fetchInsights]);

  return {
    status,
    insights,
    isLoading,
    isPulsing,
    applyingInsightId,
    start,
    stop,
    setScenario,
    reset,
    tick,
    applyInsight,
    refetch: fetchStatus,
  };
}

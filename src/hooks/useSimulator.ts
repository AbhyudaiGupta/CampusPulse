"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
          onTelemetryTick?.();
        }
      }
    } catch {
      // Ignore in background
    }
  }, [triggerPulse, onTelemetryTick]);

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
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        onTelemetryTick?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, onTelemetryTick, fetchInsights]);

  // Stop
  const stop = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/stop", { method: "POST" });
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch scenario
  const setScenario = useCallback(async (scenario: SimulatorScenario) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        onTelemetryTick?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, onTelemetryTick, fetchInsights]);

  // Reset
  const reset = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/reset", { method: "POST" });
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        onTelemetryTick?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, onTelemetryTick, fetchInsights]);

  // Execute 1 tick manually
  const tick = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/simulator/tick", { method: "POST" });
      const json = await res.json();
      if (json.success && json.status) {
        setStatus(json.status);
        triggerPulse();
        onTelemetryTick?.();
      }
    } finally {
      setIsLoading(false);
      fetchInsights();
    }
  }, [triggerPulse, onTelemetryTick, fetchInsights]);

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

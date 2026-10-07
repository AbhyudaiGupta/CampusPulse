"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MOCK_SPACES } from "@/lib/mockData";
import { useRealtimeChannel } from "./useRealtime";
import type { OccupancyStatus, NoiseLevel } from "@/lib/types";

export interface SpaceOccupancyLive {
  spaceId: string;
  occupied: number;
  capacity: number;
  availableSeats: number;
  occupancyPercent: number;
  status: OccupancyStatus;
  noiseLevel: NoiseLevel;
  queueCount: number;
  updatedAt: string;
}

interface UseLiveOccupancyResult {
  occupancy: SpaceOccupancyLive | null;
  allOccupancies: Record<string, SpaceOccupancyLive>;
  isPulsing: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

export function useLiveOccupancy(spaceId?: string): UseLiveOccupancyResult {
  const [allOccupancies, setAllOccupancies] = useState<Record<string, SpaceOccupancyLive>>(() => {
    const initial: Record<string, SpaceOccupancyLive> = {};
    for (const s of MOCK_SPACES) {
      initial[s.id] = {
        spaceId: s.id,
        occupied: s.occupied,
        capacity: s.capacity,
        availableSeats: s.availableSeats,
        occupancyPercent: s.occupancyPercent,
        status: s.status,
        noiseLevel: s.noiseLevel,
        queueCount: s.estimatedWaitMinutes ? Math.round(s.estimatedWaitMinutes / 1.5) : 0,
        updatedAt: s.lastUpdated,
      };
    }
    return initial;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(new Date().toISOString());
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPulse = useCallback(() => {
    setIsPulsing(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 1500);
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/spaces");
      const json = await res.json();
      if (json.success && json.data) {
        const next: Record<string, SpaceOccupancyLive> = {};
        for (const item of json.data) {
          const id = item.id;
          const occ = item.live_occupancy
            ? Array.isArray(item.live_occupancy)
              ? item.live_occupancy[0]
              : item.live_occupancy
            : null;

          const capacity = item.capacity || 100;
          const occupied = occ?.occupied ?? item.occupied ?? 0;
          const availableSeats = Math.max(0, capacity - occupied);
          const occupancyPercent = Math.round((occupied / capacity) * 100);

          next[id] = {
            spaceId: id,
            occupied,
            capacity,
            availableSeats,
            occupancyPercent,
            status: occ?.status || (occupancyPercent > 80 ? "crowded" : occupancyPercent > 40 ? "moderate" : "quiet"),
            noiseLevel: occ?.noise_level || item.noiseLevel || "moderate",
            queueCount: occ?.queue_count || 0,
            updatedAt: occ?.updated_at || item.lastUpdated || new Date().toISOString(),
          };
        }
        setAllOccupancies(next);
        setLastUpdated(new Date().toISOString());
        setError(null);
      }
    } catch {
      setError("Failed to fetch live occupancy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const pollInterval = setInterval(fetchLive, 2500);
    return () => clearInterval(pollInterval);
  }, [fetchLive]);

  // Subscribe to live_occupancy Postgres changes
  useRealtimeChannel("live-occupancy-global", (channel) =>
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "live_occupancy" },
      (payload: any) => {
        const row = payload.new;
        if (!row || !row.space_id) return;

        setAllOccupancies((prev) => {
          const current = prev[row.space_id];
          const capacity = current?.capacity || 100;
          const occupied = Number(row.occupied) || 0;
          const availableSeats = Math.max(0, capacity - occupied);
          const occupancyPercent = Math.round((occupied / capacity) * 100);

          return {
            ...prev,
            [row.space_id]: {
              spaceId: row.space_id,
              occupied,
              capacity,
              availableSeats,
              occupancyPercent,
              status: row.status || (occupancyPercent > 80 ? "crowded" : occupancyPercent > 40 ? "moderate" : "quiet"),
              noiseLevel: row.noise_level || current?.noiseLevel || "moderate",
              queueCount: row.queue_count || 0,
              updatedAt: row.updated_at || new Date().toISOString(),
            },
          };
        });

        setLastUpdated(new Date().toISOString());
        triggerPulse();
      }
    )
  );

  return {
    occupancy: spaceId ? allOccupancies[spaceId] || null : null,
    allOccupancies,
    isPulsing,
    loading,
    error,
    lastUpdated,
    refetch: fetchLive,
  };
}

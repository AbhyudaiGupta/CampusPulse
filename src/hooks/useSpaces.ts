"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MOCK_SPACES } from "@/lib/mockData";
import { useRealtimeChannel } from "./useRealtime";
import type { CampusSpace } from "@/lib/types";

interface UseSpacesResult {
  spaces: CampusSpace[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

/**
 * Fetches all campus spaces with live occupancy from /api/spaces,
 * then subscribes to live_occupancy realtime changes.
 */
export function useSpaces(): UseSpacesResult {
  const [spaces, setSpaces] = useState<CampusSpace[]>(MOCK_SPACES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(new Date().toISOString());

  const fetchSpaces = useCallback(async () => {
    try {
      const res = await fetch("/api/spaces");
      const json = await res.json();
      if (json.success && json.data) {
        // If source is supabase, map to CampusSpace
        if (json.source === "supabase_postgresql") {
          const mapped: CampusSpace[] = json.data.map((s: any) => {
            const occ = Array.isArray(s.live_occupancy) ? s.live_occupancy[0] : s.live_occupancy || {};
            const occupied = occ.occupied || 0;
            const capacity = s.capacity || 100;
            const availableSeats = Math.max(0, capacity - occupied);
            const occupancyPercent = Math.round((occupied / capacity) * 100);
            const mockMatch = MOCK_SPACES.find((m) => m.name === s.name);

            return {
              id: s.id,
              name: s.name,
              type: s.type,
              building: s.building,
              floor: s.floor,
              capacity,
              occupied,
              availableSeats,
              occupancyPercent,
              status: occ.status || (occupancyPercent > 80 ? "crowded" : occupancyPercent > 40 ? "moderate" : "quiet"),
              noiseLevel: occ.noise_level || "moderate",
              estimatedWaitMinutes: occ.queue_count ? Math.round(occ.queue_count * 1.5) : 0,
              distanceMinutes: mockMatch?.distanceMinutes ?? 5,
              facilities: [
                s.has_wifi ? "High-speed Wi-Fi" : "",
                s.has_power ? "Power Outlets" : "",
                s.has_computers ? "Workstations" : "",
                s.is_accessible ? "Wheelchair Access" : "",
              ].filter(Boolean),
              accessible: s.is_accessible ?? true,
              coordinates: {
                lat: Number(s.latitude) || 28.6139,
                lng: Number(s.longitude) || 77.209,
                mapX: Number(s.map_x) || 50,
                mapY: Number(s.map_y) || 50,
              },
              lastUpdated: occ.updated_at || new Date().toISOString(),
              hourlyForecast: mockMatch?.hourlyForecast ?? [],
              description: mockMatch?.description ?? `${s.name} located in ${s.building}`,
              imageTag: mockMatch?.imageTag ?? "campus",
            } as CampusSpace;
          });
          setSpaces(mapped);
        } else {
          setSpaces(json.data);
        }
        setLastUpdated(new Date().toISOString());
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch spaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
    // Seamless real-time sync across separate browser windows in all environments
    const pollInterval = setInterval(fetchSpaces, 2500);
    return () => clearInterval(pollInterval);
  }, [fetchSpaces]);

  // Subscribe to live_occupancy realtime changes
  useRealtimeChannel("spaces-occupancy", (channel) =>
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "live_occupancy" },
      (payload: any) => {
        const row = payload.new;
        if (!row) return;

        setSpaces((prev) =>
          prev.map((s) => {
            if (s.id !== row.space_id) return s;
            const occupied = row.occupied ?? s.occupied;
            const available = Math.max(0, s.capacity - occupied);
            const pct = Math.round((occupied / s.capacity) * 100);
            return {
              ...s,
              occupied,
              availableSeats: available,
              occupancyPercent: pct,
              status: pct > 80 ? "crowded" : pct > 40 ? "moderate" : "quiet",
              noiseLevel: row.noise_level ?? s.noiseLevel,
              estimatedWaitMinutes: row.queue_count ? Math.round(row.queue_count * 1.5) : s.estimatedWaitMinutes,
              lastUpdated: row.updated_at || new Date().toISOString(),
            } as CampusSpace;
          })
        );
        setLastUpdated(new Date().toISOString());
      }
    )
  );

  return { spaces, loading, error, lastUpdated, refetch: fetchSpaces };
}

/**
 * Returns a single space by ID from the spaces list.
 */
export function useSpaceDetails(id: string | null): {
  space: CampusSpace | null;
  loading: boolean;
} {
  const { spaces, loading } = useSpaces();
  const space = id ? spaces.find((s) => s.id === id) || null : null;
  return { space, loading };
}

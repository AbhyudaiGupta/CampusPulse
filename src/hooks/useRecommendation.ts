"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CampusSpace, Recommendation, RecommendationFilter } from "@/lib/types";
import { MOCK_SPACES } from "@/lib/mockData";
import { useRealtimeChannel } from "./useRealtime";

const DEFAULT_FILTERS: RecommendationFilter = {
  spaceTypes: [],
  maxOccupancy: 85,
  maxWalkMinutes: 15,
  requireAccessible: false,
  noisePreference: ["silent", "quiet"],
  facilitiesNeeded: [],
};

interface UseRecommendationResult {
  recommendations: Recommendation[];
  topPick: Recommendation | null;
  alternatives: Recommendation[];
  loading: boolean;
  error: string | null;
  filters: RecommendationFilter;
  setFilters: React.Dispatch<React.SetStateAction<RecommendationFilter>>;
  updateFilter: <K extends keyof RecommendationFilter>(key: K, value: RecommendationFilter[K]) => void;
  refetch: () => void;
}

export function useRecommendation(
  initialFilters?: Partial<RecommendationFilter>
): UseRecommendationResult {
  const [filters, setFilters] = useState<RecommendationFilter>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackScore = useCallback((spaces: CampusSpace[]) => {
    const candidates = spaces.filter((space) => {
      if (space.status === "closed") return false;
      if (space.occupancyPercent > filters.maxOccupancy) return false;
      if (filters.requireAccessible && !space.accessible) return false;
      return filters.spaceTypes.length === 0 || filters.spaceTypes.includes(space.type);
    });

    const scored: Recommendation[] = candidates.map((space) => {
      let score = Math.round(50 + Math.max(0, 1 - space.occupancyPercent / 100) * 35);
      const reasons: string[] = [];

      if (space.occupancyPercent <= 40) {
        reasons.push(`${space.availableSeats} open seats with low crowd pressure`);
      } else {
        reasons.push(`${space.occupancyPercent}% occupied`);
      }

      if (space.distanceMinutes <= filters.maxWalkMinutes) {
        score += Math.round(
          Math.max(0, (filters.maxWalkMinutes - space.distanceMinutes) / filters.maxWalkMinutes) * 20
        );
        reasons.push(`Within walking range (${space.distanceMinutes} min)`);
      } else {
        score -= 15;
        reasons.push(`Beyond walking limit (${space.distanceMinutes} min)`);
      }

      if (filters.noisePreference.length > 0) {
        if (filters.noisePreference.includes(space.noiseLevel)) {
          score += 20;
          reasons.push(`Matches ${space.noiseLevel} noise preference`);
        } else if (
          filters.noisePreference.some((level) =>
            (level === "quiet" && space.noiseLevel === "silent") ||
            (level === "silent" && space.noiseLevel === "quiet")
          )
        ) {
          score += 12;
          reasons.push(`Quiet environment (${space.noiseLevel})`);
        } else {
          score -= 10;
        }
      }

      const matches = filters.facilitiesNeeded.filter((facility) =>
        space.facilities.some((spaceFacility) =>
          spaceFacility.toLowerCase().includes(facility.toLowerCase())
        )
      );
      if (matches.length > 0) {
        score += matches.length * 5;
        reasons.push(`Has ${matches.join(", ")}`);
      }

      return { space, score: Math.max(1, Math.min(99, score)), reasons: reasons.slice(0, 4) };
    });

    scored.sort((a, b) => b.score - a.score);
    setRecommendations(scored);
  }, [filters]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceTypes: filters.spaceTypes,
          maxWalkMinutes: filters.maxWalkMinutes,
          requireAccessible: filters.requireAccessible,
          preferredNoise: filters.noisePreference,
          facilities: filters.facilitiesNeeded,
          maxOccupancy: filters.maxOccupancy,
        }),
      });
      const json = await response.json();

      if (response.ok && json.success && Array.isArray(json.recommendations)) {
        setRecommendations(json.recommendations);
        return;
      }

      const spacesResponse = await fetch("/api/spaces");
      const spacesJson = await spacesResponse.json();
      fallbackScore(
        spacesResponse.ok && spacesJson.success && Array.isArray(spacesJson.data)
          ? spacesJson.data
          : MOCK_SPACES
      );
    } catch {
      try {
        const spacesResponse = await fetch("/api/spaces");
        const spacesJson = await spacesResponse.json();
        fallbackScore(
          spacesResponse.ok && spacesJson.success && Array.isArray(spacesJson.data)
            ? spacesJson.data
            : MOCK_SPACES
        );
      } catch {
        fallbackScore(MOCK_SPACES);
        setError("Live recommendations are unavailable. Showing the saved demo spaces.");
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackScore, filters]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  useRealtimeChannel("rec-occupancy-updates", (channel) =>
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "live_occupancy" },
      () => {
        void fetchRecommendations();
      }
    )
  );

  const updateFilter = useCallback(
    <K extends keyof RecommendationFilter>(key: K, value: RecommendationFilter[K]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  const topPick = useMemo(() => recommendations[0] || null, [recommendations]);
  const alternatives = useMemo(() => recommendations.slice(1), [recommendations]);

  return {
    recommendations,
    topPick,
    alternatives,
    loading,
    error,
    filters,
    setFilters,
    updateFilter,
    refetch: fetchRecommendations,
  };
}

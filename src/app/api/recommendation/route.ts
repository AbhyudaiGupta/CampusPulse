import { NextResponse } from "next/server";
import { getLiveSpaces } from "@/lib/occupancyStore";
import { createSafeErrorResponse } from "@/lib/authServer";
import { z } from "zod";
import type { CampusSpace } from "@/lib/types";

const RecommendationRequestSchema = z.object({
  spaceTypes: z.array(z.string()).optional().default([]),
  maxWalkMinutes: z.number().int().min(1).max(60).optional().default(15),
  requireAccessible: z.boolean().optional().default(false),
  preferredNoise: z
    .array(z.enum(["silent", "quiet", "moderate", "loud"]))
    .optional()
    .default([]),
  facilities: z.array(z.string()).optional().default([]),
  maxOccupancy: z.number().int().min(10).max(100).optional().default(90),
});

interface ScoredSpace {
  space: CampusSpace;
  score: number;
  reasons: string[];
}

/**
 * POST /api/recommendation
 * Ranks the current campus spaces using live occupancy and the student's filters.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const criteria = RecommendationRequestSchema.parse(body);
    const spaces = await getLiveSpaces();

    const eligibleSpaces = spaces.filter((space) => {
      if (space.status === "closed" || space.availableSeats < 1) return false;
      if (space.distanceMinutes > criteria.maxWalkMinutes) return false;
      if (!criteria.facilities.every((facility) => space.facilities.some((item) => item.toLowerCase().includes(facility.toLowerCase())))) return false;
      if (criteria.requireAccessible && !space.accessible) return false;
      if (space.occupancyPercent > criteria.maxOccupancy) return false;
      return criteria.spaceTypes.length === 0 || criteria.spaceTypes.includes(space.type);
    });

    const scoredList: ScoredSpace[] = eligibleSpaces.map((space) => {
      let score = 50;
      const reasons: string[] = [];

      if (criteria.spaceTypes.length > 0) {
        score += 15;
        reasons.push(`Matches preferred space category (${space.type.replace(/_/g, " ")})`);
      }

      const availabilityPoints = Math.round((1 - space.occupancyPercent / 100) * 35);
      score += availabilityPoints;
      if (space.occupancyPercent <= 40) {
        reasons.push(`${space.availableSeats} open seats with low crowd pressure`);
      } else {
        reasons.push(`${space.occupancyPercent}% occupied`);
      }

      if (space.distanceMinutes <= criteria.maxWalkMinutes) {
        const walkPoints = Math.round(
          Math.max(0, (criteria.maxWalkMinutes - space.distanceMinutes) / criteria.maxWalkMinutes) * 20
        );
        score += walkPoints;
        reasons.push(`Within walking range (${space.distanceMinutes} min)`);
      } else {
        score -= 15;
        reasons.push(`Beyond walking limit (${space.distanceMinutes} min)`);
      }

      if (criteria.preferredNoise.length > 0) {
        if (criteria.preferredNoise.includes(space.noiseLevel)) {
          score += 20;
          reasons.push(`Matches ${space.noiseLevel} noise preference`);
        } else if (
          criteria.preferredNoise.some((level) =>
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

      const matches = criteria.facilities.filter((facility) =>
        space.facilities.some((spaceFacility) =>
          spaceFacility.toLowerCase().includes(facility.toLowerCase())
        )
      );
      if (matches.length > 0) {
        score += matches.length * 5;
        reasons.push(`Has ${matches.join(", ")}`);
      }

      return {
        space,
        score: Math.max(1, Math.min(99, score)),
        reasons: reasons.slice(0, 4),
      };
    });

    scoredList.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      count: scoredList.length,
      recommendations: scoredList,
    });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}

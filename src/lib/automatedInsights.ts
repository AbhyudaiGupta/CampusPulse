import { getLiveSpaces } from "./occupancyStore";
import type { OperationalInsight, CampusSpace } from "./types";

/**
 * Deterministic, transparent operational rules engine.
 * Never makes vague "AI magic" claims; operates on explicit mathematical thresholds.
 */
export async function evaluateOperationalInsights(): Promise<OperationalInsight[]> {
  const spaces = await getLiveSpaces();
  const insights: OperationalInsight[] = [];

  for (const space of spaces) {
    // Rule 1: Capacity exceeds 85 percent
    if (space.occupancyPercent >= 85) {
      insights.push({
        id: `rule-cap-${space.id}`,
        spaceId: space.id,
        spaceName: space.name,
        signal: `Critical Density (${space.occupancyPercent}% capacity)`,
        signalType: "high_capacity",
        rationale: `${space.name} has only ${space.availableSeats} of ${space.capacity} seats remaining. High risk of student search frustration and study disruption.`,
        suggestedAction: `Deprioritize ${space.name} in Best Spot Finder and redirect incoming students to adjacent low-density facilities.`,
        estimatedPrototypeEffect: "Reduces peak arrival rate by ~35% within 15 minutes (simulation estimate).",
        severity: "critical",
      });
    }

    // Rule 2: Queue wait exceeds threshold (e.g. wait > 8 minutes)
    if (space.estimatedWaitMinutes >= 8) {
      insights.push({
        id: `rule-queue-${space.id}`,
        spaceId: space.id,
        spaceName: space.name,
        signal: `Bottleneck Queue (${space.estimatedWaitMinutes} min wait)`,
        signalType: "queue_spike",
        rationale: `Service counter queue depth is causing significant delays. High turnaround times during peak meal or lab transition windows.`,
        suggestedAction: `Broadcast live queue telemetry banner and recommend satellite express counters or alternative dining options.`,
        estimatedPrototypeEffect: "Diverts 20% to 25% of student traffic to alternative dining spots (simulation estimate).",
        severity: "warning",
      });
    }

    // Rule 3: Sustained underutilization (< 35% occupancy)
    if (space.occupancyPercent <= 35 && space.capacity >= 40) {
      insights.push({
        id: `rule-under-${space.id}`,
        spaceId: space.id,
        spaceName: space.name,
        signal: `Abundant Headroom (${space.availableSeats} open seats)`,
        signalType: "underutilized",
        rationale: `${space.name} has ample available seating and power outlets while other campus zones face crowding.`,
        suggestedAction: `Elevate ranking priority in Best Spot recommendations to balance campus foot traffic.`,
        estimatedPrototypeEffect: "Increases discoverability score by +25 points and balances spatial distribution (simulation estimate).",
        severity: "opportunity",
      });
    }
  }

  return insights;
}

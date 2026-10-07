import { z } from "zod";
import { readDemoState, writeDemoState } from "./demoState";
import { getStatusFromPercent } from "./utils";
import { MOCK_SPACES } from "./mockData";
import { createServerSupabaseClient, getServiceRoleClient } from "./supabaseServer";
import type {
  CampusSpace,
  NoiseLevel,
  OccupancyStatus,
  SensorSourceType,
  SimulatedSensorEvent,
} from "./types";

const DemoOccupancySchema = z.record(z.string(), z.object({
  occupied: z.number().int().min(0).max(10000),
  queueCount: z.number().int().min(0).max(10000),
  noiseLevel: z.enum(["silent", "quiet", "moderate", "loud"]),
  lastUpdated: z.string(),
}));
const EventSchema = z.array(z.object({
  id: z.string(), spaceId: z.string(), spaceName: z.string(),
  source: z.enum(["door_counter", "desk_sensor", "lab_aggregate", "queue_counter"]),
  sourceLabel: z.string(), eventType: z.string(), delta: z.number(),
  newOccupancy: z.number(), capacity: z.number(), occupancyPercent: z.number(),
  noiseLevel: z.enum(["silent", "quiet", "moderate", "loud"]),
  queueCount: z.number(), timestamp: z.string(),
})).max(4);

const SOURCE_LABELS: Record<SensorSourceType, string> = {
  door_counter: "Door Counter (Optical Break-Beam)",
  desk_sensor: "Desk Sensor (Anonymous PIR/Ultra)",
  lab_aggregate: "Lab System Aggregate",
  queue_counter: "Queue Line Counter",
};

export interface UpdateOccupancyParams {
  spaceId: string;
  occupied: number;
  queueCount?: number;
  noiseLevel?: NoiseLevel;
  source?: SensorSourceType;
  eventType?: string;
  delta?: number;
}

/**
 * Returns browser-scoped simulated occupancy or configured Supabase data.
 */
export async function getLiveSpaces(): Promise<CampusSpace[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("spaces")
      .select("*, live_occupancy (*)")
      .order("name", { ascending: true });

    if (error) throw new Error("Unable to load campus occupancy");
    if (data) {
      return data.map((s: any) => {
        const occ = Array.isArray(s.live_occupancy) ? s.live_occupancy[0] ?? {} : s.live_occupancy || {};
        const capacity = s.capacity || 100;
        const occupied = occ.occupied || 0;
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
          status: occ.status === "closed" ? "closed" : getStatusFromPercent(occupancyPercent),
          noiseLevel: occ.noise_level || "moderate",
          estimatedWaitMinutes: occ.queue_count ? Math.round(occ.queue_count * 1.5) : 0,
          distanceMinutes: mockMatch?.distanceMinutes ?? 5,
          facilities: mockMatch?.facilities ?? [],
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
    }
  }

  const snapshot = await readDemoState("occupancy", DemoOccupancySchema, {});
  return MOCK_SPACES.map((space) => {
    const saved = snapshot[space.id];
    if (!saved) return { ...space, status: getStatusFromPercent(space.occupancyPercent) };
    const occupied = Math.min(space.capacity, saved.occupied);
    const occupancyPercent = Math.round(occupied / space.capacity * 100);
    return { ...space, occupied, occupancyPercent, availableSeats: space.capacity - occupied,
      status: getStatusFromPercent(occupancyPercent), noiseLevel: saved.noiseLevel,
      estimatedWaitMinutes: Math.round(saved.queueCount * 1.5), lastUpdated: saved.lastUpdated };
  });
}

/**
 * Validated core service to update space occupancy and append normalized anonymous sensor event.
 * All simulator events and manual admin updates pass through this single pipeline.
 */
export async function updateSpaceOccupancy(
  params: UpdateOccupancyParams
): Promise<{ success: boolean; space: CampusSpace; event: SimulatedSensorEvent }> {
  const spaces = await getLiveSpaces();
  const targetIndex = spaces.findIndex((s) => s.id === params.spaceId);

  if (targetIndex === -1) {
    throw new Error(`Space not found: ${params.spaceId}`);
  }

  const currentSpace = spaces[targetIndex];
  const capacity = currentSpace.capacity;
  // Bounded & realistic clamping
  const boundedOccupied = Math.max(0, Math.min(capacity, Math.round(params.occupied)));
  const availableSeats = Math.max(0, capacity - boundedOccupied);
  const occupancyPercent = Math.round((boundedOccupied / capacity) * 100);
  const status: OccupancyStatus =
    getStatusFromPercent(occupancyPercent);
  const noiseLevel: NoiseLevel =
    params.noiseLevel ??
    (occupancyPercent > 85 ? "loud" : occupancyPercent > 50 ? "moderate" : "quiet");
  const queueCount = params.queueCount ?? (occupancyPercent > 80 ? Math.round((occupancyPercent - 75) / 2) : 0);
  const estimatedWaitMinutes = queueCount ? Math.round(queueCount * 1.5) : 0;
  const nowIso = new Date().toISOString();

  const prevOccupied = currentSpace.occupied;
  const delta = params.delta ?? boundedOccupied - prevOccupied;

  // Derive the updated record.
  const updatedSpace: CampusSpace = {
    ...currentSpace,
    occupied: boundedOccupied,
    availableSeats,
    occupancyPercent,
    status,
    noiseLevel,
    estimatedWaitMinutes,
    lastUpdated: nowIso,
  };


  // Create normalized simulated sensor event
  const sourceType = params.source || "door_counter";
  const sensorEvent: SimulatedSensorEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    spaceId: updatedSpace.id,
    spaceName: updatedSpace.name,
    source: sourceType,
    sourceLabel: SOURCE_LABELS[sourceType],
    eventType: params.eventType || (delta >= 0 ? "entry_increment" : "exit_decrement"),
    delta,
    newOccupancy: boundedOccupied,
    capacity,
    occupancyPercent,
    noiseLevel,
    queueCount,
    timestamp: nowIso,
  };

  const recentEvents = await getRecentSensorEvents();
  await writeDemoState("events", [sensorEvent, ...recentEvents].slice(0, 4));

  // If Supabase is connected, persist to live_occupancy & sensor_events
  try {
    const serviceClient = getServiceRoleClient();
    const serverClient = await createServerSupabaseClient();
    const clientToUse = serviceClient || serverClient;

    if (clientToUse) {
      const { error: occupancyError } = await clientToUse.from("live_occupancy").upsert({
        space_id: updatedSpace.id,
        occupied: boundedOccupied,
        available: availableSeats,
        queue_count: queueCount,
        noise_level: noiseLevel,
        status,
        updated_at: nowIso,
      });

      if (occupancyError) throw new Error("Could not save occupancy");
      const { error: eventError } = await clientToUse.from("sensor_events").insert({
        space_id: updatedSpace.id,
        source: `simulated_${sourceType}`,
        event_type: sensorEvent.eventType,
        occupancy_count: boundedOccupied,
        recorded_at: nowIso,
      });
      if (eventError) throw new Error("Could not save sensor event");
    } else {
      const snapshot = await readDemoState("occupancy", DemoOccupancySchema, {});
      snapshot[updatedSpace.id] = { occupied: boundedOccupied, queueCount, noiseLevel, lastUpdated: nowIso };
      await writeDemoState("occupancy", snapshot);
    }
  } catch (err) {
    throw err;
  }

  return { success: true, space: updatedSpace, event: sensorEvent };
}

/**
 * Resets the current demo or configured database to the sample baseline.
 */
export async function resetAllSpacesToBaseline(): Promise<CampusSpace[]> {
  const current = await getLiveSpaces();
  for (const space of current) {
    const baseline = MOCK_SPACES.find((item) => item.name === space.name);
    if (baseline) await updateSpaceOccupancy({
      spaceId: space.id, occupied: baseline.occupied,
      queueCount: Math.round(baseline.estimatedWaitMinutes / 1.5),
      noiseLevel: baseline.noiseLevel, eventType: "baseline_reset",
    });
  }
  await writeDemoState("events", []);
  return getLiveSpaces();
}

export async function getRecentSensorEvents(): Promise<SimulatedSensorEvent[]> {
  return readDemoState("events", EventSchema, []);
}

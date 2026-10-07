import { MOCK_SPACES } from "./mockData";
import { createServerSupabaseClient, getServiceRoleClient } from "./supabaseServer";
import type {
  CampusSpace,
  NoiseLevel,
  OccupancyStatus,
  SensorSourceType,
  SimulatedSensorEvent,
} from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __liveCampusSpaces: CampusSpace[] | undefined;
  // eslint-disable-next-line no-var
  var __sensorEventsStream: SimulatedSensorEvent[] | undefined;
}

// Initialize server memory singleton
if (!globalThis.__liveCampusSpaces) {
  globalThis.__liveCampusSpaces = JSON.parse(JSON.stringify(MOCK_SPACES));
}
if (!globalThis.__sensorEventsStream) {
  globalThis.__sensorEventsStream = [];
}

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
 * Returns current campus spaces from server memory (or Supabase if connected).
 */
export async function getLiveSpaces(): Promise<CampusSpace[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("spaces")
      .select("*, live_occupancy (*)")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((s: any) => {
        const occ = Array.isArray(s.live_occupancy) ? s.live_occupancy[0] : s.live_occupancy || {};
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
          status: occ.status || (occupancyPercent > 80 ? "crowded" : occupancyPercent > 40 ? "moderate" : "quiet"),
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

  // Fallback to server in-memory store
  return globalThis.__liveCampusSpaces ?? MOCK_SPACES;
}

/**
 * Validated core service to update space occupancy and append normalized anonymous sensor event.
 * All simulator events and manual admin updates pass through this single pipeline.
 */
export async function updateSpaceOccupancy(
  params: UpdateOccupancyParams
): Promise<{ success: boolean; space: CampusSpace; event: SimulatedSensorEvent }> {
  const spaces = globalThis.__liveCampusSpaces ?? MOCK_SPACES;
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
    occupancyPercent > 80 ? "crowded" : occupancyPercent > 40 ? "moderate" : "quiet";
  const noiseLevel: NoiseLevel =
    params.noiseLevel ??
    (occupancyPercent > 85 ? "loud" : occupancyPercent > 50 ? "moderate" : "quiet");
  const queueCount = params.queueCount ?? (occupancyPercent > 80 ? Math.round((occupancyPercent - 75) / 2) : 0);
  const estimatedWaitMinutes = queueCount ? Math.round(queueCount * 1.5) : 0;
  const nowIso = new Date().toISOString();

  const prevOccupied = currentSpace.occupied;
  const delta = params.delta ?? boundedOccupied - prevOccupied;

  // Update in-memory record
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
  spaces[targetIndex] = updatedSpace;
  globalThis.__liveCampusSpaces = spaces;

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

  // Push to recent events stream (max 40)
  if (!globalThis.__sensorEventsStream) globalThis.__sensorEventsStream = [];
  globalThis.__sensorEventsStream.unshift(sensorEvent);
  if (globalThis.__sensorEventsStream.length > 40) {
    globalThis.__sensorEventsStream = globalThis.__sensorEventsStream.slice(0, 40);
  }

  // If Supabase is connected, persist to live_occupancy & sensor_events
  try {
    const serviceClient = getServiceRoleClient();
    const serverClient = await createServerSupabaseClient();
    const clientToUse = serviceClient || serverClient;

    if (clientToUse) {
      await clientToUse.from("live_occupancy").upsert({
        space_id: updatedSpace.id,
        occupied: boundedOccupied,
        available: availableSeats,
        queue_count: queueCount,
        noise_level: noiseLevel,
        status,
        updated_at: nowIso,
      });

      await clientToUse.from("sensor_events").insert({
        space_id: updatedSpace.id,
        source: `simulated_${sourceType}`,
        event_type: sensorEvent.eventType,
        occupancy_count: boundedOccupied,
        recorded_at: nowIso,
      });
    }
  } catch (err) {
    // Non-fatal if Supabase is unavailable in mock demo
  }

  return { success: true, space: updatedSpace, event: sensorEvent };
}

/**
 * Resets all spaces in server memory to initial default baseline.
 */
export async function resetAllSpacesToBaseline(): Promise<CampusSpace[]> {
  const fresh = JSON.parse(JSON.stringify(MOCK_SPACES));
  globalThis.__liveCampusSpaces = fresh;

  // Log a reset sensor event
  const resetEvent: SimulatedSensorEvent = {
    id: `ev-${Date.now()}-reset`,
    spaceId: "campus-wide",
    spaceName: "Campus Wide Baseline",
    source: "door_counter",
    sourceLabel: "System Baseline Calibrator",
    eventType: "baseline_reset",
    delta: 0,
    newOccupancy: 0,
    capacity: 0,
    occupancyPercent: 0,
    noiseLevel: "quiet",
    queueCount: 0,
    timestamp: new Date().toISOString(),
  };

  if (!globalThis.__sensorEventsStream) globalThis.__sensorEventsStream = [];
  globalThis.__sensorEventsStream.unshift(resetEvent);

  // If Supabase is connected, update all live_occupancy rows
  try {
    const serviceClient = getServiceRoleClient();
    const serverClient = await createServerSupabaseClient();
    const clientToUse = serviceClient || serverClient;

    if (clientToUse) {
      for (const space of fresh) {
        await clientToUse.from("live_occupancy").upsert({
          space_id: space.id,
          occupied: space.occupied,
          available: space.availableSeats,
          queue_count: 0,
          noise_level: space.noiseLevel,
          status: space.status,
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Ignore in demo
  }

  return fresh;
}

/**
 * Returns latest simulated sensor events from the in-memory stream.
 */
export function getRecentSensorEvents(): SimulatedSensorEvent[] {
  return globalThis.__sensorEventsStream || [];
}

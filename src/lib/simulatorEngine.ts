import { z } from "zod";
import { readDemoState, writeDemoState } from "./demoState";
import { updateSpaceOccupancy, resetAllSpacesToBaseline, getRecentSensorEvents, getLiveSpaces } from "./occupancyStore";
import type { SimulatorScenario, SimulatorStatus, SensorSourceType } from "./types";


const SCENARIO_TITLES: Record<SimulatorScenario, string> = {
  normal: "Normal Campus Day",
  lunch_rush: "Lunch Rush Surge",
  exam_surge: "Exam Week Library Surge",
  lab_release: "Lab Session Release",
  event_exit: "Seminar Event Exit",
  reset: "Reset Campus Baseline",
};

const StatusSchema = z.object({
  isRunning: z.boolean(),
  scenario: z.enum(["normal", "lunch_rush", "exam_surge", "lab_release", "event_exit", "reset"]),
  scenarioTitle: z.string(),
  frequencySeconds: z.number().int().min(2).max(10),
  lastTickAt: z.string().nullable(),
  totalTicks: z.number().int().min(0),
  serverIntervalActive: z.boolean(),
});
const INITIAL_STATUS = {
  isRunning: false, scenario: "normal" as const, scenarioTitle: SCENARIO_TITLES.normal,
  frequencySeconds: 3, lastTickAt: null, totalTicks: 0, serverIntervalActive: false,
};

async function saveStatus(status: SimulatorStatus) {
  const { recentEvents: _events, ...snapshot } = status;
  await writeDemoState("simulator", snapshot);
}

export async function getSimulatorStatus(): Promise<SimulatorStatus> {
  const current = await readDemoState("simulator", StatusSchema, INITIAL_STATUS);
  return { ...current, serverIntervalActive: false, recentEvents: await getRecentSensorEvents() };
}

export async function executeSimulationTick(): Promise<{
  success: boolean;
  status: SimulatorStatus;
  eventsCount: number;
}> {
  const status = await getSimulatorStatus();
  const scenario = status.scenario;
  const spaces = await getLiveSpaces();

  let generatedCount = 0;

  switch (scenario) {
    case "lunch_rush": {
      // 1. Canteen surges toward 90-95%
      const canteen = spaces.find((s) => s.type === "canteen" || s.id.includes("canteen"));
      if (canteen) {
        const targetOcc = Math.round(canteen.capacity * 0.94);
        const diff = targetOcc - canteen.occupied;
        const delta = Math.min(6, Math.max(1, Math.round(diff * 0.35) || 2));
        const newOcc = Math.min(canteen.capacity - 2, canteen.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: canteen.id,
          occupied: newOcc,
          delta,
          queueCount: Math.min(18, Math.max(6, Math.round((newOcc / canteen.capacity) * 16))),
          noiseLevel: "loud",
          source: "door_counter",
          eventType: "group_entry_burst",
        });
        generatedCount++;
      }

      // 2. Library drops slightly as students leave for food
      const library = spaces.find((s) => (s.id.includes("library") || s.name === "Central Library"));
      if (library && library.occupied > Math.round(library.capacity * 0.35)) {
        const delta = -Math.floor(Math.random() * 3 + 1);
        const newOcc = Math.max(Math.round(library.capacity * 0.35), library.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: library.id,
          occupied: newOcc,
          delta,
          noiseLevel: "quiet",
          source: "desk_sensor",
          eventType: "lunch_vacation_release",
        });
        generatedCount++;
      }
      break;
    }

    case "exam_surge": {
      // 1. Library surges toward 96%
      const library = spaces.find((s) => (s.id.includes("library") || s.name === "Central Library"));
      if (library) {
        const targetOcc = Math.round(library.capacity * 0.96);
        const diff = targetOcc - library.occupied;
        const delta = Math.min(4, Math.max(1, Math.round(diff * 0.4) || 1));
        const newOcc = Math.min(library.capacity - 1, library.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: library.id,
          occupied: newOcc,
          delta,
          queueCount: newOcc >= library.capacity - 5 ? 4 : 0,
          noiseLevel: "silent",
          source: "desk_sensor",
          eventType: "carrel_occupied_continuous",
        });
        generatedCount++;
      }

      // 2. Study Rooms also fill up
      const studyRoom = spaces.find((s) => s.id.includes("study-room") || s.type === "quiet_room");
      if (studyRoom) {
        const delta = Math.floor(Math.random() * 3 + 1);
        const newOcc = Math.min(studyRoom.capacity - 1, studyRoom.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: studyRoom.id,
          occupied: newOcc,
          delta,
          noiseLevel: "quiet",
          source: "door_counter",
          eventType: "study_group_entry",
        });
        generatedCount++;
      }
      break;
    }

    case "lab_release": {
      // 1. Computer Labs drop sharply as lecture ends
      const lab = spaces.find((s) => s.type === "computer_lab" || s.id.includes("lab"));
      if (lab && lab.occupied > Math.round(lab.capacity * 0.22)) {
        const delta = -Math.min(9, Math.max(3, Math.floor(lab.occupied * 0.28)));
        const newOcc = Math.max(Math.round(lab.capacity * 0.18), lab.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: lab.id,
          occupied: newOcc,
          delta,
          noiseLevel: "quiet",
          source: "lab_aggregate",
          eventType: "class_dismissal_logout_batch",
        });
        generatedCount++;
      }

      // 2. Nearby cafe/hallway gets a brief bump
      const cafe = spaces.find((s) => s.type === "canteen" || s.id.includes("canteen"));
      if (cafe) {
        const delta = Math.floor(Math.random() * 3 + 2);
        const newOcc = Math.min(cafe.capacity, cafe.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: cafe.id,
          occupied: newOcc,
          delta,
          source: "door_counter",
          eventType: "post_lab_transit_entry",
        });
        generatedCount++;
      }
      break;
    }

    case "event_exit": {
      // 1. Seminar Hall / Event space empties out quickly
      const seminar = spaces.find((s) => s.type === "event_space" || s.id.includes("seminar"));
      if (seminar && seminar.occupied > Math.round(seminar.capacity * 0.15)) {
        const delta = -Math.min(14, Math.max(4, Math.floor(seminar.occupied * 0.35)));
        const newOcc = Math.max(Math.round(seminar.capacity * 0.1), seminar.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: seminar.id,
          occupied: newOcc,
          delta,
          source: "door_counter",
          eventType: "auditorium_exit_wave",
        });
        generatedCount++;
      }

      // 2. Hostel Gate / Walkway sees surge
      const hub = spaces.find((s) => s.type === "collaboration" || s.id.includes("innovation"));
      if (hub) {
        const delta = Math.floor(Math.random() * 4 + 1);
        const newOcc = Math.min(hub.capacity, hub.occupied + delta);
        await updateSpaceOccupancy({
          spaceId: hub.id,
          occupied: newOcc,
          delta,
          source: "queue_counter",
          eventType: "corridor_transit_wave",
        });
        generatedCount++;
      }
      break;
    }

    case "normal":
    default: {
      // Small realistic Gaussian micro-adjustments around comfortable baseline
      const randomSpace = spaces[Math.floor(Math.random() * spaces.length)];
      if (randomSpace) {
        const isEntry = Math.random() > 0.45;
        const delta = isEntry ? Math.floor(Math.random() * 3 + 1) : -Math.floor(Math.random() * 3 + 1);
        const newOcc = Math.max(5, Math.min(randomSpace.capacity - 5, randomSpace.occupied + delta));
        const sources: SensorSourceType[] = ["door_counter", "desk_sensor", "lab_aggregate", "queue_counter"];
        const chosenSource = sources[Math.floor(Math.random() * sources.length)];

        await updateSpaceOccupancy({
          spaceId: randomSpace.id,
          occupied: newOcc,
          delta,
          source: chosenSource,
          eventType: isEntry ? "routine_arrival" : "routine_departure",
        });
        generatedCount++;
      }
      break;
    }
  }

  status.lastTickAt = new Date().toISOString();
  status.totalTicks += 1;
  status.recentEvents = await getRecentSensorEvents();
  await saveStatus(status);

  return {
    success: true,
    status: await getSimulatorStatus(),
    eventsCount: generatedCount,
  };
}


/** Simulation ticks are requested by the open admin page, never a server timer. */
export async function startSimulator(scenario?: SimulatorScenario, frequencySeconds = 3): Promise<SimulatorStatus> {
  const status = await getSimulatorStatus();
  status.isRunning = true;
  if (scenario) {
    status.scenario = scenario;
    status.scenarioTitle = SCENARIO_TITLES[scenario];
  }
  status.frequencySeconds = Math.max(2, Math.min(10, frequencySeconds));
  await saveStatus(status);
  return status;
}

export async function stopSimulator(): Promise<SimulatorStatus> {
  const status = await getSimulatorStatus();
  status.isRunning = false;
  await saveStatus(status);
  return status;
}

export async function setSimulatorScenario(scenario: SimulatorScenario): Promise<SimulatorStatus> {
  const status = await getSimulatorStatus();
  status.scenario = scenario;
  status.scenarioTitle = SCENARIO_TITLES[scenario];
  await saveStatus(status);
  if (scenario === "reset") await resetAllSpacesToBaseline();
  else await executeSimulationTick();
  return getSimulatorStatus();
}

export async function resetSimulator(): Promise<SimulatorStatus> {
  await resetAllSpacesToBaseline();
  const status: SimulatorStatus = { ...INITIAL_STATUS, lastTickAt: new Date().toISOString(), recentEvents: [] };
  await saveStatus(status);
  return status;
}

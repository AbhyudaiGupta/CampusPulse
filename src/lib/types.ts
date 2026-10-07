// ─── Space & Occupancy ────────────────────────────────────────────────────────

export type SpaceType =
  | "study_space"
  | "computer_lab"
  | "canteen"
  | "collaboration"
  | "event_space"
  | "quiet_room";

export type OccupancyStatus = "quiet" | "moderate" | "crowded" | "closed";

export type NoiseLevel = "silent" | "quiet" | "moderate" | "loud";

export interface HourlyForecast {
  hour: number; // 0-23
  predicted: number; // occupancy %
  label: string; // e.g. "9 AM"
}

export interface SpaceCoordinates {
  lat: number;
  lng: number;
  mapX: number; // SVG map x %
  mapY: number; // SVG map y %
}

export interface CampusSpace {
  id: string;
  name: string;
  type: SpaceType;
  building: string;
  floor: string;
  capacity: number;
  occupied: number;
  availableSeats: number;
  occupancyPercent: number;
  status: OccupancyStatus;
  noiseLevel: NoiseLevel;
  estimatedWaitMinutes: number;
  distanceMinutes: number;
  facilities: string[];
  accessible: boolean;
  coordinates: SpaceCoordinates;
  lastUpdated: string; // ISO string
  hourlyForecast: HourlyForecast[];
  description: string;
  imageTag: string; // short label for the space image/icon context
}

// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "student" | "admin";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus = "upcoming" | "active" | "completed" | "cancelled" | "expired";

export interface Reservation {
  id: string;
  userId: string;
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  building: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  seats: number;
  status: ReservationStatus;
  createdAt: string;
  notes?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "space_available"
  | "crowd_alert"
  | "reservation_reminder"
  | "reservation_confirmed"
  | "reservation_cancelled"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  spaceId?: string;
  actionLabel?: string;
  actionHref?: string;
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface RecommendationFilter {
  spaceTypes: SpaceType[];
  maxOccupancy: number; // %
  maxWalkMinutes: number;
  requireAccessible: boolean;
  noisePreference: NoiseLevel[];
  facilitiesNeeded: string[];
}

export interface Recommendation {
  space: CampusSpace;
  score: number; // 0-100
  reasons: string[];
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface OccupancySnapshot {
  spaceId: string;
  spaceName: string;
  occupied: number;
  capacity: number;
  occupancyPercent: number;
  status: OccupancyStatus;
  timestamp: string;
}

export interface AdminMetrics {
  totalSpaces: number;
  openSpaces: number;
  crowdedSpaces: number;
  totalCapacity: number;
  totalOccupied: number;
  campusOccupancyPercent: number;
  activeReservations: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  adminOnly?: boolean;
  badge?: number;
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  title: string;
  body?: string;
  variant: "success" | "error" | "warning" | "info";
  duration?: number;
}

// ─── Simulator & Sensor Stream ───────────────────────────────────────────────

export type SensorSourceType =
  | "door_counter"
  | "desk_sensor"
  | "lab_aggregate"
  | "queue_counter";

export type SimulatorScenario =
  | "normal"
  | "lunch_rush"
  | "exam_surge"
  | "lab_release"
  | "event_exit"
  | "reset";

export interface SimulatedSensorEvent {
  id: string;
  spaceId: string;
  spaceName: string;
  source: SensorSourceType;
  sourceLabel: string;
  eventType: string;
  delta: number;
  newOccupancy: number;
  capacity: number;
  occupancyPercent: number;
  noiseLevel: NoiseLevel;
  queueCount: number;
  timestamp: string; // ISO
}

export interface SimulatorStatus {
  isRunning: boolean;
  scenario: SimulatorScenario;
  scenarioTitle: string;
  frequencySeconds: number;
  lastTickAt: string | null;
  totalTicks: number;
  serverIntervalActive: boolean;
  recentEvents: SimulatedSensorEvent[];
}

export interface OperationalInsight {
  id: string;
  spaceId: string;
  spaceName: string;
  signal: string;
  signalType: "high_capacity" | "queue_spike" | "underutilized";
  rationale: string;
  suggestedAction: string;
  estimatedPrototypeEffect: string; // labeled as "simulation estimate"
  severity: "critical" | "warning" | "opportunity";
  applied?: boolean;
}

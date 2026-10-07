import type {
  CampusSpace,
  HourlyForecast,
  Reservation,
  AppNotification,
  UserProfile,
  AdminMetrics,
} from "./types";

// ─── Forecast generator ───────────────────────────────────────────────────────

function buildForecast(
  peakHour: number,
  peakPercent: number,
  basePercent: number
): HourlyForecast[] {
  const labels = [
    "12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM",
    "10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM",
    "8 PM","9 PM","10 PM","11 PM",
  ];
  return Array.from({ length: 24 }, (_, h) => {
    const dist = Math.abs(h - peakHour);
    const decay = Math.exp(-0.18 * dist * dist);
    const predicted = Math.round(basePercent + (peakPercent - basePercent) * decay);
    return { hour: h, predicted: Math.max(0, Math.min(100, predicted)), label: labels[h] };
  });
}

// ─── Spaces ───────────────────────────────────────────────────────────────────

export const MOCK_SPACES: CampusSpace[] = [
  {
    id: "central-library",
    name: "Central Library",
    type: "study_space",
    building: "Academic Block A",
    floor: "Ground",
    capacity: 100,
    occupied: 62,
    availableSeats: 38,
    occupancyPercent: 62,
    status: "moderate",
    noiseLevel: "quiet",
    estimatedWaitMinutes: 0,
    distanceMinutes: 4,
    facilities: ["Power Outlets", "Wi-Fi", "Accessible"],
    accessible: true,
    coordinates: { lat: 28.6139, lng: 77.2090, mapX: 35, mapY: 28 },
    lastUpdated: new Date(Date.now() - 3 * 60000).toISOString(),
    description: "The main campus library with dedicated silent and group zones across two floors.",
    imageTag: "library",
    hourlyForecast: buildForecast(14, 88, 12),
  },
  {
    id: "computer-lab-2",
    name: "Computer Lab 2",
    type: "computer_lab",
    building: "Tech Block B",
    floor: "Level 1",
    capacity: 40,
    occupied: 29,
    availableSeats: 11,
    occupancyPercent: 73,
    status: "moderate",
    noiseLevel: "moderate",
    estimatedWaitMinutes: 0,
    distanceMinutes: 7,
    facilities: ["Desktop Computers", "Printing", "Accessible"],
    accessible: true,
    coordinates: { lat: 28.6145, lng: 77.2102, mapX: 58, mapY: 42 },
    lastUpdated: new Date(Date.now() - 1 * 60000).toISOString(),
    description: "Equipped with 40 high-performance workstations and dedicated lab software.",
    imageTag: "lab",
    hourlyForecast: buildForecast(11, 95, 5),
  },
  {
    id: "main-canteen",
    name: "Main Canteen",
    type: "canteen",
    building: "Student Centre",
    floor: "Ground",
    capacity: 120,
    occupied: 86,
    availableSeats: 34,
    occupancyPercent: 72,
    status: "moderate",
    noiseLevel: "loud",
    estimatedWaitMinutes: 8,
    distanceMinutes: 5,
    facilities: ["Food Service", "Accessible", "Wi-Fi"],
    accessible: true,
    coordinates: { lat: 28.6130, lng: 77.2085, mapX: 22, mapY: 55 },
    lastUpdated: new Date(Date.now() - 2 * 60000).toISOString(),
    description: "Central dining hall serving hot meals, snacks, and beverages. Service rate: approx. 3 people per minute.",
    imageTag: "canteen",
    hourlyForecast: buildForecast(13, 98, 10),
  },
  {
    id: "study-room-c",
    name: "Study Room C",
    type: "study_space",
    building: "Academic Block A",
    floor: "Level 2",
    capacity: 30,
    occupied: 12,
    availableSeats: 18,
    occupancyPercent: 40,
    status: "moderate",
    noiseLevel: "silent",
    estimatedWaitMinutes: 0,
    distanceMinutes: 3,
    facilities: ["Power Outlets", "Whiteboard", "Accessible"],
    accessible: true,
    coordinates: { lat: 28.6141, lng: 77.2094, mapX: 40, mapY: 22 },
    lastUpdated: new Date(Date.now() - 5 * 60000).toISOString(),
    description: "Dedicated silent study room with individual desks and whiteboard panels.",
    imageTag: "study_room",
    hourlyForecast: buildForecast(15, 70, 8),
  },
  {
    id: "innovation-hub",
    name: "Innovation Hub",
    type: "collaboration",
    building: "Tech Block B",
    floor: "Level 2",
    capacity: 50,
    occupied: 33,
    availableSeats: 17,
    occupancyPercent: 66,
    status: "moderate",
    noiseLevel: "moderate",
    estimatedWaitMinutes: 0,
    distanceMinutes: 9,
    facilities: ["Wi-Fi", "Power Outlets", "Projector", "Accessible"],
    accessible: true,
    coordinates: { lat: 28.6148, lng: 77.2108, mapX: 65, mapY: 35 },
    lastUpdated: new Date(Date.now() - 4 * 60000).toISOString(),
    description: "Open collaboration space with project tables, display screens, and maker resources.",
    imageTag: "hub",
    hourlyForecast: buildForecast(16, 80, 6),
  },
  {
    id: "seminar-hall-a",
    name: "Seminar Hall A",
    type: "event_space",
    building: "Academic Block C",
    floor: "Ground",
    capacity: 150,
    occupied: 18,
    availableSeats: 132,
    occupancyPercent: 12,
    status: "quiet",
    noiseLevel: "quiet",
    estimatedWaitMinutes: 0,
    distanceMinutes: 6,
    facilities: ["Projector", "Stage", "Accessible", "Wi-Fi"],
    accessible: true,
    coordinates: { lat: 28.6125, lng: 77.2095, mapX: 48, mapY: 70 },
    lastUpdated: new Date(Date.now() - 7 * 60000).toISOString(),
    description: "Large lecture and event hall with tiered seating and full AV setup.",
    imageTag: "hall",
    hourlyForecast: buildForecast(10, 60, 5),
  },
];

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const MOCK_PROFILES: Record<string, UserProfile> = {
  "demo-student": {
    id: "demo-student",
    fullName: "Alex Sharma",
    email: "alex.sharma@campus.edu",
    role: "student",
    avatarUrl: null,
    createdAt: "2025-08-01T00:00:00Z",
  },
  "demo-admin": {
    id: "demo-admin",
    fullName: "Dr. Priya Menon",
    email: "priya.menon@campus.edu",
    role: "admin",
    avatarUrl: null,
    createdAt: "2025-07-15T00:00:00Z",
  },
};

// ─── Reservations ─────────────────────────────────────────────────────────────

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: "res-001",
    userId: "demo-student",
    spaceId: "study-room-c",
    spaceName: "Study Room C",
    spaceType: "study_space",
    building: "Academic Block A",
    date: "2026-10-07",
    startTime: "14:00",
    endTime: "16:00",
    seats: 1,
    status: "upcoming",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    notes: "Group project session",
  },
  {
    id: "res-002",
    userId: "demo-student",
    spaceId: "innovation-hub",
    spaceName: "Innovation Hub",
    spaceType: "collaboration",
    building: "Tech Block B",
    date: "2026-10-06",
    startTime: "10:00",
    endTime: "11:30",
    seats: 4,
    status: "completed",
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "res-003",
    userId: "demo-student",
    spaceId: "computer-lab-2",
    spaceName: "Computer Lab 2",
    spaceType: "computer_lab",
    building: "Tech Block B",
    date: "2026-10-08",
    startTime: "09:00",
    endTime: "10:00",
    seats: 1,
    status: "upcoming",
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-001",
    userId: "demo-student",
    type: "space_available",
    title: "Study Room C now available",
    body: "Occupancy dropped to 40%. Your reserved slot starts in 2 hours.",
    read: false,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    spaceId: "study-room-c",
    actionLabel: "View Space",
    actionHref: "/spaces/study-room-c",
  },
  {
    id: "notif-002",
    userId: "demo-student",
    type: "crowd_alert",
    title: "Main Canteen getting busy",
    body: "Occupancy is at 72%. Peak expected between 1 PM and 2 PM. Consider visiting at 3 PM.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    spaceId: "main-canteen",
    actionLabel: "See Forecast",
    actionHref: "/spaces/main-canteen",
  },
  {
    id: "notif-003",
    userId: "demo-student",
    type: "reservation_confirmed",
    title: "Reservation confirmed",
    body: "Study Room C, 7 Oct 2026, 2:00 PM to 4:00 PM.",
    read: true,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    spaceId: "study-room-c",
    actionLabel: "View Reservation",
    actionHref: "/reservations",
  },
  {
    id: "notif-004",
    userId: "demo-student",
    type: "reservation_reminder",
    title: "Reminder: Reservation in 1 hour",
    body: "Computer Lab 2, 8 Oct 2026, 9:00 AM to 10:00 AM.",
    read: true,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    spaceId: "computer-lab-2",
    actionLabel: "View Reservation",
    actionHref: "/reservations",
  },
];

// ─── Admin Metrics ────────────────────────────────────────────────────────────

export function computeAdminMetrics(spaces: CampusSpace[]): AdminMetrics {
  const open = spaces.filter((s) => s.status !== "closed");
  const crowded = spaces.filter((s) => s.status === "crowded");
  const totalOccupied = open.reduce((sum, s) => sum + s.occupied, 0);
  const totalCapacity = open.reduce((sum, s) => sum + s.capacity, 0);
  return {
    totalSpaces: spaces.length,
    openSpaces: open.length,
    crowdedSpaces: crowded.length,
    totalCapacity,
    totalOccupied,
    campusOccupancyPercent: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
    activeReservations: MOCK_RESERVATIONS.filter((r) => r.status === "upcoming" || r.status === "active").length,
  };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function getStatusFromPercent(pct: number): CampusSpace["status"] {
  if (pct < 40) return "quiet";
  if (pct < 75) return "moderate";
  return "crowded";
}

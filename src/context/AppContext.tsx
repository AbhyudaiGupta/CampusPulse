"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { Reservation, AppNotification, SpaceType } from "@/lib/types";
import { MOCK_RESERVATIONS, MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  studentId?: string;
  department?: string;
}

export interface StudentPreferences {
  quietLevel: "silent" | "quiet" | "moderate" | "no_preference";
  accessibilityRequired: boolean;
  maxWalkMinutes: number;
  crowdAlerts: boolean;
  reservationReminders: boolean;
  seatDrops: boolean;
}

export interface ActiveHold {
  id: string;
  reservationId: string;
  spaceId: string;
  spaceName: string;
  building: string;
  seatId: string;
  sessionDurationHours: number;
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (10 min hold)
  sessionEndsAt: number | null;
  status: "holding" | "confirmed" | "cancelled" | "expired" | "completed";
}

interface AppContextType {
  user: UserSession | null;
  isSupabaseConnected: boolean;
  loginAsDemo: (role: "student" | "admin") => void;
  signOut: () => Promise<void>;
  preferences: StudentPreferences;
  updatePreferences: (newPrefs: Partial<StudentPreferences>) => void;
  reservations: Reservation[];
  activeHold: ActiveHold | null;
  createSeatReservation: (params: {
    spaceId: string;
    spaceName: string;
    building: string;
    spaceType: SpaceType;
    seatId: string;
    durationHours?: number;
  }) => ActiveHold | null;
  confirmCheckIn: (holdId: string) => void;
  cancelHold: (holdId: string) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  subscribeCrowdAlert: (spaceId: string, spaceName: string, threshold?: number) => void;
  subscribedAlertSpaceIds: string[];
}

const DEFAULT_PREFERENCES: StudentPreferences = {
  quietLevel: "quiet",
  accessibilityRequired: false,
  maxWalkMinutes: 10,
  crowdAlerts: true,
  reservationReminders: true,
  seatDrops: true,
};

interface PersistedDemoState {
  preferences: StudentPreferences;
  reservations: Reservation[];
  activeHold: ActiveHold | null;
  notifications: AppNotification[];
  subscribedAlertSpaceIds: string[];
  alertThresholds: Record<string, number>;
}

const DEMO_STORAGE_PREFIX = "campuspulse-demo-v1";

function formatClockTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLocalDate(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const STUDENT_DEMO_USER: UserSession = {
  id: "demo-student",
  name: "Abhay",
  email: "abhay.student@campus.edu",
  role: "student",
  studentId: "STU-2024-8841",
  department: "Computer Science & Engineering",
};

const ADMIN_DEMO_USER: UserSession = {
  id: "demo-admin",
  name: "Dr. Priya Menon",
  email: "priya.menon@campus.edu",
  role: "admin",
  studentId: "FAC-1002",
  department: "Campus Operations & Facilities",
};

const AppContext = createContext<AppContextType | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  // 1. User session state
  const [user, setUser] = useState<UserSession | null>(STUDENT_DEMO_USER);
  const [isSupabaseConnected] = useState<boolean>(isSupabaseConfigured);

  // 2. Preferences state
  const [preferences, setPreferences] = useState<StudentPreferences>(DEFAULT_PREFERENCES);

  // 3. Reservations state
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  // 4. Active 10-minute hold state. A hold appears here only after the student creates one.
  const [activeHold, setActiveHold] = useState<ActiveHold | null>(null);

  // 5. Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // 6. Subscribed crowd alerts
  const [subscribedAlertSpaceIds, setSubscribedAlertSpaceIds] = useState<string[]>([
    "computer-lab-2",
  ]);
  const [alertThresholds, setAlertThresholds] = useState<Record<string, number>>({
    "computer-lab-2": 70,
  });
  const previousOccupancyRef = useRef<Record<string, number>>({});
  const [hydratedDemoStorageKey, setHydratedDemoStorageKey] = useState<string | null>(null);
  const demoStorageKey = user?.id.startsWith("demo-")
    ? `${DEMO_STORAGE_PREFIX}:${user.id}`
    : null;

  // Keep the demo useful across reloads without pretending it is a server-backed account.
  useEffect(() => {
    if (!demoStorageKey) {
      setHydratedDemoStorageKey(null);
      return;
    }

    const isStudentDemo = demoStorageKey.endsWith(":demo-student");
    const defaultReservations = isStudentDemo ? MOCK_RESERVATIONS : [];
    const defaultNotifications = isStudentDemo ? MOCK_NOTIFICATIONS : [];
    let state: Partial<PersistedDemoState> | null = null;
    try {
      const saved = window.localStorage.getItem(demoStorageKey);
      if (saved) {
        state = JSON.parse(saved) as Partial<PersistedDemoState>;
      }
    } catch {
      // A malformed or unavailable local demo snapshot should not block the app.
    }

    setPreferences(
      state?.preferences && typeof state.preferences === "object"
        ? { ...DEFAULT_PREFERENCES, ...state.preferences }
        : DEFAULT_PREFERENCES
    );
    setReservations(Array.isArray(state?.reservations) ? state.reservations : defaultReservations);
    const restoredHold = state?.activeHold;
    setActiveHold(restoredHold && typeof restoredHold.id === "string" ? restoredHold : null);
    setNotifications(Array.isArray(state?.notifications) ? state.notifications : defaultNotifications);
    setSubscribedAlertSpaceIds(
      Array.isArray(state?.subscribedAlertSpaceIds)
        ? state.subscribedAlertSpaceIds
        : isStudentDemo ? ["computer-lab-2"] : []
    );
    setAlertThresholds(
      state?.alertThresholds && typeof state.alertThresholds === "object"
        ? state.alertThresholds
        : isStudentDemo ? { "computer-lab-2": 70 } : {}
    );
    setHydratedDemoStorageKey(demoStorageKey);
  }, [demoStorageKey]);

  useEffect(() => {
    if (!demoStorageKey || hydratedDemoStorageKey !== demoStorageKey) return;

    const snapshot: PersistedDemoState = {
      preferences,
      reservations,
      activeHold,
      notifications,
      subscribedAlertSpaceIds,
      alertThresholds,
    };

    try {
      const serialized = JSON.stringify(snapshot);
      if (window.localStorage.getItem(demoStorageKey) !== serialized) {
        window.localStorage.setItem(demoStorageKey, serialized);
      }
    } catch {
      // Storage can be disabled or full; the in-memory experience still works.
    }
  }, [
    demoStorageKey,
    hydratedDemoStorageKey,
    preferences,
    reservations,
    activeHold,
    notifications,
    subscribedAlertSpaceIds,
    alertThresholds,
  ]);

  // Keep separate demo windows in step (for example, the student and admin walkthrough tabs).
  useEffect(() => {
    if (!demoStorageKey) return;

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== demoStorageKey || !event.newValue) return;

      try {
        const state = JSON.parse(event.newValue) as Partial<PersistedDemoState>;
        if (state.preferences && typeof state.preferences === "object") {
          setPreferences({ ...DEFAULT_PREFERENCES, ...state.preferences });
        }
        if (Array.isArray(state.reservations)) setReservations(state.reservations);
        const restoredHold = state.activeHold;
        if (restoredHold === null || (restoredHold && typeof restoredHold.id === "string")) {
          setActiveHold(restoredHold ?? null);
        }
        if (Array.isArray(state.notifications)) setNotifications(state.notifications);
        if (Array.isArray(state.subscribedAlertSpaceIds)) {
          setSubscribedAlertSpaceIds(state.subscribedAlertSpaceIds);
        }
        if (state.alertThresholds && typeof state.alertThresholds === "object") {
          setAlertThresholds(state.alertThresholds);
        }
      } catch {
        // Ignore a partial or malformed update from another tab.
      }
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, [demoStorageKey]);

  // Holds expire automatically; checked-in sessions close at the duration selected by the student.
  useEffect(() => {
    if (!activeHold || (activeHold.status !== "holding" && activeHold.status !== "confirmed")) return;

    const isHold = activeHold.status === "holding";
    const deadline = isHold ? activeHold.expiresAt : activeHold.sessionEndsAt;
    if (typeof deadline !== "number" || !Number.isFinite(deadline)) return;

    const expire = () => {
      const nextStatus = isHold ? "expired" : "completed";
      setActiveHold((current) =>
        current?.id === activeHold.id ? { ...current, status: nextStatus } : current
      );
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === activeHold.reservationId
            ? { ...reservation, status: nextStatus }
            : reservation
        )
      );
      setNotifications((current) => [
        {
          id: `notif-${nextStatus}-${activeHold.id}`,
          userId: user?.id || "demo-student",
          type: "system",
          title: isHold ? "Desk hold expired" : "Study session complete",
          body: isHold
            ? `The 10-minute hold on ${activeHold.spaceName} was released. You can choose another open desk at any time.`
            : `Your ${activeHold.sessionDurationHours}-hour session at ${activeHold.spaceName} has ended.`,
          read: false,
          createdAt: new Date().toISOString(),
          spaceId: activeHold.spaceId,
          actionLabel: isHold ? "Find a desk" : "View reservations",
          actionHref: isHold ? "/recommendation" : "/reservations",
        },
        ...current,
      ]);
    };

    const timeout = window.setTimeout(expire, Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [activeHold, user?.id]);

  // Real Supabase session synchronization & persistence
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let mounted = true;

    async function checkCurrentSession() {
      if (!client) return;
      const { data: { session } } = await client.auth.getSession();
      if (session?.user && mounted) {
        // Fetch profile
        const { data: profile } = await client
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || "Campus User",
          email: session.user.email || "",
          role: (profile?.role as "student" | "admin") || "student",
          studentId: session.user.id.substring(0, 8).toUpperCase(),
          department: "Enrolled Student",
        });
      }
    }

    checkCurrentSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (!client) return;
      if (session?.user && mounted) {
        const { data: profile } = await client
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || "Campus User",
          email: session.user.email || "",
          role: (profile?.role as "student" | "admin") || "student",
          studentId: session.user.id.substring(0, 8).toUpperCase(),
          department: "Enrolled Student",
        });
      } else if (event === "SIGNED_OUT" && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Watch live aggregate occupancy while this app session is open. This keeps
  // demo alerts useful without collecting or storing individual movement data.
  useEffect(() => {
    let active = true;
    let isFetching = false;

    async function checkCrowdAlerts() {
      if (isFetching) return;
      isFetching = true;

      try {
        const response = await fetch("/api/spaces");
        const json = await response.json();
        if (!active || !response.ok || !json.success || !Array.isArray(json.data)) return;

        const currentOccupancy: Record<string, number> = {};
        const spaceNames: Record<string, string> = {};
        for (const space of json.data) {
          currentOccupancy[space.id] = Number(space.occupancyPercent) || 0;
          spaceNames[space.id] = space.name;
        }

        const newlyAvailable = Object.entries(alertThresholds).filter(([spaceId, threshold]) => {
          const previous = previousOccupancyRef.current[spaceId];
          const current = currentOccupancy[spaceId];
          return previous !== undefined && current !== undefined && previous > threshold && current <= threshold;
        });

        previousOccupancyRef.current = currentOccupancy;

        if (newlyAvailable.length > 0) {
          const createdAt = new Date().toISOString();
          const notices: AppNotification[] = newlyAvailable.map(([spaceId, threshold]) => ({
            id: `notif-seat-drop-${spaceId}-${Date.now()}`,
            userId: user?.id || "demo-student",
            type: "space_available",
            title: `${spaceNames[spaceId] || "Campus space"} is less crowded`,
            body: `Occupancy dropped to ${currentOccupancy[spaceId]}%, below your ${threshold}% alert threshold.`,
            read: false,
            createdAt,
            spaceId,
            actionLabel: "View Space",
            actionHref: `/spaces/${spaceId}`,
          }));
          setNotifications((previous) => [...notices, ...previous]);
        }
      } catch {
        // Keep the last known alert state when the live spaces endpoint is unavailable.
      } finally {
        isFetching = false;
      }
    }

    void checkCrowdAlerts();
    const interval = setInterval(() => void checkCrowdAlerts(), 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [alertThresholds, user?.id]);

  // Auth actions
  function loginAsDemo(role: "student" | "admin") {
    setUser(role === "admin" ? ADMIN_DEMO_USER : STUDENT_DEMO_USER);
  }

  async function signOut() {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Safe fallback
      }
    }
    setUser(null);
  }

  function updatePreferences(newPrefs: Partial<StudentPreferences>) {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  }

  // Reservation actions
  function createSeatReservation(params: {
    spaceId: string;
    spaceName: string;
    building: string;
    spaceType: SpaceType;
    seatId: string;
    durationHours?: number;
  }) {
    if (activeHold && (activeHold.status === "holding" || activeHold.status === "confirmed")) {
      return null;
    }

    const now = Date.now();
    const sessionDurationHours = Math.min(4, Math.max(1, params.durationHours ?? 2));
    const reservationId = `res-${now}`;
    const newHold: ActiveHold = {
      id: `hold-${now}`,
      reservationId,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
      building: params.building,
      seatId: params.seatId,
      sessionDurationHours,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minute hold
      sessionEndsAt: null,
      status: "holding",
    };

    setActiveHold(newHold);

    // Also add to reservations list
    const newRes: Reservation = {
      id: reservationId,
      userId: user?.id || "demo-student",
      spaceId: params.spaceId,
      spaceName: params.spaceName,
      spaceType: params.spaceType,
      building: params.building,
      date: formatLocalDate(now),
      startTime: formatClockTime(now),
      endTime: formatClockTime(now + sessionDurationHours * 60 * 60 * 1000),
      seats: 1,
      status: "upcoming",
      createdAt: new Date().toISOString(),
      notes: `Desk ${params.seatId} - 10 min check-in hold`,
    };

    setReservations((prev) => [newRes, ...prev]);

    // Send in-app notification
    const notif: AppNotification = {
      id: `notif-${now}`,
      userId: user?.id || "demo-student",
      type: "reservation_confirmed",
      title: "Desk held for 10 minutes",
      body: `Desk ${params.seatId} held at ${params.spaceName}. Check in before expiry to secure your seat.`,
      read: false,
      createdAt: new Date().toISOString(),
      spaceId: params.spaceId,
      actionLabel: "View Reservation",
      actionHref: "/reservations",
    };
    setNotifications((prev) => [notif, ...prev]);

    return newHold;
  }

  function confirmCheckIn(holdId: string) {
    if (activeHold && activeHold.id === holdId) {
      if (Date.now() >= activeHold.expiresAt) {
        setActiveHold((prev) => (prev ? { ...prev, status: "expired" } : null));
        setReservations((prev) =>
          prev.map((reservation) =>
            reservation.id === activeHold.reservationId
              ? { ...reservation, status: "expired" }
              : reservation
          )
        );
        setNotifications((prev) => [
          {
            id: `notif-expired-${activeHold.id}`,
            userId: user?.id || "demo-student",
            type: "system",
            title: "Desk hold expired",
            body: `The 10-minute hold on ${activeHold.spaceName} was released. Please reserve again to choose another desk.`,
            read: false,
            createdAt: new Date().toISOString(),
            spaceId: activeHold.spaceId,
            actionLabel: "Find a desk",
            actionHref: "/recommendation",
          },
          ...prev,
        ]);
        return;
      }

      const sessionStartsAt = Date.now();
      const sessionEndsAt = sessionStartsAt + activeHold.sessionDurationHours * 60 * 60 * 1000;
      setActiveHold((prev) => (prev ? { ...prev, status: "confirmed", sessionEndsAt } : null));
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === activeHold.reservationId
            ? {
                ...reservation,
                status: "active",
                date: formatLocalDate(sessionStartsAt),
                startTime: formatClockTime(sessionStartsAt),
                endTime: formatClockTime(sessionEndsAt),
                notes: `Desk ${activeHold.seatId} · checked in`,
              }
            : reservation
        )
      );

      const notif: AppNotification = {
        id: `notif-checkin-${Date.now()}`,
        userId: user?.id || "demo-student",
        type: "system",
        title: "Check-in Verified",
        body: `Welcome to ${activeHold.spaceName}! Your seat hold is now active.`,
        read: false,
        createdAt: new Date().toISOString(),
        spaceId: activeHold.spaceId,
        actionLabel: "View details",
        actionHref: `/spaces/${activeHold.spaceId}`,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }

  function cancelHold(holdId: string) {
    if (activeHold && activeHold.id === holdId) {
      setActiveHold((prev) => (prev ? { ...prev, status: "cancelled" } : null));

      setReservations((prev) =>
        prev.map((r) =>
          r.id === activeHold.reservationId
            ? { ...r, status: "cancelled" }
            : r
        )
      );

      const notif: AppNotification = {
        id: `notif-cancel-${Date.now()}`,
        userId: user?.id || "demo-student",
        type: "reservation_cancelled",
        title: "Seat released",
        body: activeHold.status === "confirmed"
          ? `Your checked-in seat at ${activeHold.spaceName} has been released.`
          : `Your 10-minute hold on ${activeHold.spaceName}, desk ${activeHold.seatId}, has been cancelled.`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }

  // Notification actions
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markNotificationRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function subscribeCrowdAlert(spaceId: string, spaceName: string, threshold = 70) {
    const isNewSubscription = !subscribedAlertSpaceIds.includes(spaceId);
    setAlertThresholds((previous) => ({ ...previous, [spaceId]: threshold }));
    setSubscribedAlertSpaceIds((previous) =>
      previous.includes(spaceId) ? previous : [...previous, spaceId]
    );

    const currentOccupancy = previousOccupancyRef.current[spaceId];
    if (isNewSubscription) {
      const alreadyBelowThreshold = currentOccupancy !== undefined && currentOccupancy <= threshold;
      const notif: AppNotification = {
        id: `notif-sub-${Date.now()}`,
        userId: user?.id || "demo-student",
        type: alreadyBelowThreshold ? "space_available" : "crowd_alert",
        title: alreadyBelowThreshold ? `${spaceName} is already below your threshold` : "Crowd alert active",
        body: alreadyBelowThreshold
          ? `${spaceName} is at ${currentOccupancy}% occupancy, below your ${threshold}% threshold.`
          : `We will notify you in this session if ${spaceName} occupancy drops below ${threshold}%.`,
        read: false,
        createdAt: new Date().toISOString(),
        spaceId,
        actionLabel: "View Space",
        actionHref: `/spaces/${spaceId}`,
      };
      setNotifications((previous) => [notif, ...previous]);
    }

    void fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, thresholdPercent: threshold }),
    }).catch(() => {});
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isSupabaseConnected,
        loginAsDemo,
        signOut,
        preferences,
        updatePreferences,
        reservations,
        activeHold,
        createSeatReservation,
        confirmCheckIn,
        cancelHold,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        subscribeCrowdAlert,
        subscribedAlertSpaceIds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
}

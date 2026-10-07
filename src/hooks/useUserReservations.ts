"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeChannel } from "./useRealtime";
import { useApp } from "@/context/AppContext";

interface ServerReservation {
  id: string;
  user_id: string;
  space_id: string;
  seat_label: string;
  status: string;
  expires_at: string;
  checked_in_at: string | null;
  created_at: string;
  spaces?: {
    name: string;
    building: string;
    floor: string;
    type: string;
  };
}

export interface ReservationView {
  id: string;
  spaceId: string;
  spaceName: string;
  building: string;
  seatLabel: string;
  status: string;
  expiresAt: string;
  checkedInAt: string | null;
  createdAt: string;
}

interface UseUserReservationsResult {
  reservations: ReservationView[];
  loading: boolean;
  reserve: (spaceId: string, seatLabel?: string) => Promise<ReservationView | null>;
  checkIn: (id: string) => Promise<boolean>;
  cancel: (id: string) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Fetches user-scoped reservations from /api/reservations and subscribes
 * to realtime changes for the authenticated user's reservations.
 */
export function useUserReservations(): UseUserReservationsResult {
  const { user } = useApp();
  const [reservations, setReservations] = useState<ReservationView[]>([]);
  const [loading, setLoading] = useState(true);

  function mapServerRes(r: ServerReservation): ReservationView {
    return {
      id: r.id,
      spaceId: r.space_id,
      spaceName: r.spaces?.name || "Campus Space",
      building: r.spaces?.building || "",
      seatLabel: r.seat_label,
      status: r.status,
      expiresAt: r.expires_at,
      checkedInAt: r.checked_in_at,
      createdAt: r.created_at,
    };
  }

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch("/api/reservations");
      const json = await res.json();
      if (json.success && json.data && json.source !== "mock_demo") {
        setReservations(json.data.map(mapServerRes));
      }
    } catch {
      // Stay with empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Realtime subscription for reservation changes
  useRealtimeChannel(
    user ? `reservations-${user.id}` : "reservations-demo",
    (channel) =>
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: user?.id && !user.id.startsWith("demo-") ? `user_id=eq.${user.id}` : undefined,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          if (payload.eventType === "INSERT") {
            const newRes: ReservationView = {
              id: row.id,
              spaceId: row.space_id,
              spaceName: "Campus Space",
              building: "",
              seatLabel: row.seat_label,
              status: row.status,
              expiresAt: row.expires_at,
              checkedInAt: row.checked_in_at,
              createdAt: row.created_at,
            };
            setReservations((prev) => [newRes, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? { ...r, status: row.status, checkedInAt: row.checked_in_at }
                  : r
              )
            );
          }
        }
      ),
    [user?.id]
  );

  const reserve = useCallback(async (spaceId: string, seatLabel = "Desk-01"): Promise<ReservationView | null> => {
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId, seatLabel }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const rv: ReservationView = {
          id: json.data.id,
          spaceId: json.data.spaceId || json.data.space_id || spaceId,
          spaceName: "Campus Space",
          building: "",
          seatLabel: json.data.seatLabel || json.data.seat_label || seatLabel,
          status: json.data.status || "holding",
          expiresAt: json.data.expiresAt || json.data.expires_at,
          checkedInAt: null,
          createdAt: json.data.createdAt || json.data.created_at || new Date().toISOString(),
        };
        setReservations((prev) => [rv, ...prev]);
        return rv;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const checkIn = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reservations/${id}/check-in`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "confirmed", checkedInAt: new Date().toISOString() } : r))
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const cancel = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reservations/${id}/cancel`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { reservations, loading, reserve, checkIn, cancel, refetch: fetchReservations };
}

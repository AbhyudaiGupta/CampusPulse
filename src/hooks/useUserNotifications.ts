"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeChannel } from "./useRealtime";
import { useApp } from "@/context/AppContext";
import type { AppNotification } from "@/lib/types";

interface UseUserNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => void;
}

/**
 * Fetches user-scoped notifications from /api/notifications and subscribes
 * to realtime inserts for the authenticated user.
 */
export function useUserNotifications(): UseUserNotificationsResult {
  const { user, notifications: contextNotifications, unreadCount: contextUnread, markNotificationRead, markAllNotificationsRead } = useApp();
  const [serverNotifications, setServerNotifications] = useState<AppNotification[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && json.data && json.source !== "mock_demo") {
        // Map server schema to AppNotification
        const mapped: AppNotification[] = json.data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type || "system",
          title: n.title,
          body: n.message || n.body || "",
          read: n.read,
          createdAt: n.created_at || n.createdAt,
          spaceId: undefined,
          actionLabel: n.action_url ? "View" : undefined,
          actionHref: n.action_url || undefined,
        }));
        setServerNotifications(mapped);
      }
    } catch {
      // Fall back to context
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useRealtimeChannel(
    user ? `notifications-${user.id}` : "notifications-demo",
    (channel) =>
      channel.on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: user?.id && !user.id.startsWith("demo-") ? `user_id=eq.${user.id}` : undefined,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          const newNotif: AppNotification = {
            id: row.id,
            userId: row.user_id,
            type: row.type || "system",
            title: row.title,
            body: row.message || "",
            read: row.read || false,
            createdAt: row.created_at,
            actionHref: row.action_url || undefined,
          };
          setServerNotifications((prev) => prev ? [newNotif, ...prev] : [newNotif]);
        }
      ),
    [user?.id]
  );

  const notifications = serverNotifications || contextNotifications;
  const unreadCount = serverNotifications
    ? serverNotifications.filter((n) => !n.read).length
    : contextUnread;

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setServerNotifications((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev
    );
    markNotificationRead(id);

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // Context already updated
    }
  }, [markNotificationRead]);

  const markAllRead = useCallback(async () => {
    setServerNotifications((prev) =>
      prev ? prev.map((n) => ({ ...n, read: true })) : prev
    );
    markAllNotificationsRead();

    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      // Context already updated
    }
  }, [markAllNotificationsRead]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}

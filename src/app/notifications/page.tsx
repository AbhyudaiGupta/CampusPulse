"use client";

import { useState } from "react";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition, DemoDataBadge, EmptyState } from "@/components/ui/Primitives";
import { useApp } from "@/context/AppContext";
import { useUserNotifications, useCurrentUser } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookMarked,
  XCircle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { AppNotification } from "@/lib/types";

function getNotificationIcon(type: AppNotification["type"]) {
  switch (type) {
    case "space_available":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case "crowd_alert":
      return <AlertTriangle size={16} className="text-amber-600" />;
    case "reservation_reminder":
      return <Clock size={16} className="text-cyan-600" />;
    case "reservation_confirmed":
      return <BookMarked size={16} className="text-emerald-600" />;
    case "reservation_cancelled":
      return <XCircle size={16} className="text-red-500" />;
    default:
      return <Bell size={16} className="text-slate-500" />;
  }
}

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const { subscribedAlertSpaceIds } = useApp();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    loading,
  } = useUserNotifications();

  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filterMode === "unread") return !n.read;
    return true;
  });

  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role={user?.role ?? "student"} userName={user?.name ?? "Student Demo"} />

      <main className="app-main" id="main-content">
        <TopNav
          title="Notification Centre"
          breadcrumb={["CampusPulse", "Alerts"]}
          userName={user?.name ?? "Student Demo"}
          role={user?.role ?? "student"}
        />

        <div className="page-content notification-content">
          <PageTransition>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">
                  In-App Notification Feed
                </h1>
                <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}`
                    : "All notifications have been reviewed"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <DemoDataBadge />
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="btn btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5 font-semibold"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Subscribed Zones Status Banner */}
            <div className="card card-sm mb-5 bg-cyan-50 border border-cyan-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[12px]">
                <Bell size={14} className="text-cyan-700" />
                <span className="font-semibold text-cyan-950">Occupancy alerts:</span>
                <span className="text-cyan-800">
                  {subscribedAlertSpaceIds.length} space{subscribedAlertSpaceIds.length !== 1 ? "s" : ""} watched at a 70% threshold
                </span>
              </div>
              <Link
                href="/map"
                className="text-[11px] font-bold text-cyan-700 hover:underline inline-flex items-center gap-1"
              >
                Inspect on Map <ArrowRight size={11} />
              </Link>
            </div>

            {/* Filter Tabs (Rectangular, non-pill) */}
            <div className="flex items-center gap-2 p-1 bg-[var(--color-surface-muted)] rounded-[9px] mb-4 w-fit border border-[var(--color-border-subtle)] text-[12px]">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-[7px] font-semibold transition-all ${
                  filterMode === "all"
                    ? "bg-white text-[var(--color-navy-950)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-pressed={filterMode === "all"}
              >
                All Alerts ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={`px-3 py-1.5 rounded-[7px] font-semibold transition-all ${
                  filterMode === "unread"
                    ? "bg-white text-[var(--color-navy-950)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-pressed={filterMode === "unread"}
              >
                Unread Only ({unreadCount})
              </button>
            </div>

            {/* Notifications Feed */}
            {filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell size={24} />}
                title={filterMode === "unread" ? "No unread alerts" : "No notifications yet"}
                body="Occupancy drops, 10-minute hold reminders, and crowd warnings will show up here."
              />
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`card card-sm notification-card border ${
                      notif.read
                        ? "bg-white border-[var(--color-border-subtle)] opacity-85"
                        : "bg-cyan-50/30 border-cyan-200"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-[8px] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3
                            className={`text-[14px] font-bold ${
                              notif.read ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
                            }`}
                          >
                            {notif.title}
                          </h3>
                          <span suppressHydrationWarning className="text-[11px] text-[var(--color-text-muted)]">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                          {notif.body}
                        </p>

                        {/* Action buttons row */}
                        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] text-[12px]">
                          {notif.actionHref && (
                            <Link
                              href={notif.actionHref}
                              onClick={() => markRead(notif.id)}
                              className="font-bold text-[var(--color-cyan-700)] hover:underline inline-flex items-center gap-1"
                            >
                              {notif.actionLabel || "View"} <ArrowRight size={12} />
                            </Link>
                          )}

                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markRead(notif.id)}
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-[11px] font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

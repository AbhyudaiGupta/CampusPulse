"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, ArrowRight, AlertTriangle, CheckCircle2, Clock, BookMarked, XCircle } from "lucide-react";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { formatRelativeTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";
import Link from "next/link";

function getNotifIcon(type: AppNotification["type"]) {
  switch (type) {
    case "space_available": return <CheckCircle2 size={14} className="text-emerald-600" />;
    case "crowd_alert": return <AlertTriangle size={14} className="text-amber-600" />;
    case "reservation_reminder": return <Clock size={14} className="text-cyan-600" />;
    case "reservation_confirmed": return <BookMarked size={14} className="text-emerald-600" />;
    case "reservation_cancelled": return <XCircle size={14} className="text-red-500" />;
    default: return <Bell size={14} className="text-slate-500" />;
  }
}

/**
 * Compact slide-over notification panel. Triggered from topnav bell icon.
 * Shows user-scoped notifications with mark-read and navigation.
 */
export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useUserNotifications();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-icon relative"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-[4px]"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="notification-popover absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white border border-[var(--color-border)] rounded-[6px] z-50 flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Notification centre"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[var(--color-text-secondary)]" />
                <span className="font-semibold text-[13px] text-[var(--color-text-primary)]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-[5px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[var(--color-cyan-600)] font-semibold hover:underline flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-cyan-50 transition-colors"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-[6px] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                  aria-label="Close notifications"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={24} className="text-[var(--color-text-muted)] mb-2 opacity-40" />
                  <p className="text-[13px] text-[var(--color-text-muted)]">No notifications yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.slice(0, 12).map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)] cursor-pointer transition-colors hover:bg-[var(--color-surface-muted)] ${
                        !notif.read ? "bg-cyan-50/40" : ""
                      }`}
                      onClick={() => {
                        if (!notif.read) markRead(notif.id);
                      }}
                    >
                      <div className="w-7 h-7 rounded-[5px] bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[12px] leading-snug ${!notif.read ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-[3px] bg-cyan-500 shrink-0 mt-1" aria-label="Unread" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{notif.body}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span suppressHydrationWarning className="text-[10px] text-[var(--color-text-muted)]">{formatRelativeTime(notif.createdAt)}</span>
                          {notif.actionHref && (
                            <Link
                              href={notif.actionHref}
                              onClick={() => setOpen(false)}
                              className="text-[10px] font-semibold text-[var(--color-cyan-600)] hover:underline flex items-center gap-0.5"
                            >
                              {notif.actionLabel || "View"} <ArrowRight size={9} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border-subtle)] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold text-[var(--color-cyan-600)] hover:underline flex items-center gap-1 justify-center"
              >
                View all notifications <ArrowRight size={11} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

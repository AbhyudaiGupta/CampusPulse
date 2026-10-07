"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Map,
  Sparkles,
  BookMarked,
  Bell,
  User,
  ShieldCheck,
  PlayCircle,
  Shield,
  LogOut,
  ChevronRight,
  Activity,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveUpdateIndicator } from "@/components/ui/Primitives";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { useConnectionState } from "@/hooks/useRealtime";

// ── Nav data ──────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "All Spaces", href: "/spaces", icon: Building2 },
  { label: "Campus Map", href: "/map", icon: Map },
  { label: "Find Best Spot", href: "/recommendation", icon: Sparkles },
  { label: "Reservations", href: "/reservations", icon: BookMarked },
  { label: "Notifications", href: "/notifications", icon: Bell, badge: 2 },
];

const ACCOUNT_NAV = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Privacy", href: "/privacy", icon: Lock },
  { label: "Demo Mode", href: "/demo", icon: PlayCircle },
];

const ADMIN_NAV = [
  { label: "Admin Centre", href: "/admin", icon: ShieldCheck },
];

import { useApp } from "@/context/AppContext";

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  role?: "student" | "admin";
  onSignOut?: () => void;
  userName?: string;
}

export function Sidebar({ role, onSignOut, userName }: SidebarProps) {
  const pathname = usePathname();
  const app = useApp();
  const connectionState = useConnectionState();

  const effectiveRole = role ?? app.user?.role ?? "student";
  const effectiveUserName = userName ?? app.user?.name ?? "Student Demo";
  const effectiveSignOut = onSignOut ?? app.signOut;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo" aria-hidden>
          <Activity size={17} color="#ffffff" strokeWidth={2.2} />
        </div>
        <div>
          <div className="sidebar-brand-name">CampusPulse</div>
          <div className="sidebar-brand-tagline">Know before you go.</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {STUDENT_NAV.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.href === "/notifications" ? app.unreadCount : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", isActive(item.href) && "active")}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon className="nav-item-icon" size={17} />
              <span>{item.label}</span>
              {badgeCount && badgeCount > 0 ? (
                <span className="nav-badge" aria-label={`${badgeCount} unread`}>{badgeCount}</span>
              ) : null}
            </Link>
          );
        })}

        {effectiveRole === "admin" && (
          <>
            <span className="sidebar-section-label">Admin</span>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-item", isActive(item.href) && "active")}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <Icon className="nav-item-icon" size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        <span className="sidebar-section-label">Account</span>
        {ACCOUNT_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", isActive(item.href) && "active")}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon className="nav-item-icon" size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-2 px-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-navy-700)] flex items-center justify-center">
            {effectiveRole === "admin" ? (
              <Shield size={13} color="#22d3ee" />
            ) : (
              <User size={13} color="rgba(255,255,255,0.6)" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate">{effectiveUserName}</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.35)]">{effectiveRole === "admin" ? "Administrator" : "Student"}</p>
          </div>
        </div>
        <button
          onClick={effectiveSignOut}
          className="nav-item w-full text-left"
          aria-label="Sign out"
        >
          <LogOut size={15} className="nav-item-icon" />
          <span className="text-[13px]">Sign out</span>
        </button>
        <div className="mt-3 px-2">
          <LiveUpdateIndicator state={connectionState} />
        </div>
      </div>
    </nav>
  );
}

// ── TopNav ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  title: string;
  breadcrumb?: string[];
  notificationCount?: number;
  userName?: string;
  role?: "student" | "admin";
  onSignOut?: () => void;
}

export function TopNav({
  title,
  breadcrumb = [],
  notificationCount,
  userName,
  role,
  onSignOut,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const app = useApp();
  const connectionState = useConnectionState();
  const pathname = usePathname();

  const effectiveUserName = userName ?? app.user?.name ?? "Student Demo";
  const effectiveRole = role ?? app.user?.role ?? "student";
  const effectiveSignOut = onSignOut ?? app.signOut;
  const mobileNavItems = [
    ...STUDENT_NAV,
    ...(effectiveRole === "admin" ? ADMIN_NAV : []),
    ...ACCOUNT_NAV,
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="topnav" role="banner">
      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileNavOpen}
        aria-controls="mobile-navigation"
      >
        <Menu size={19} />
      </button>

      {/* Breadcrumb */}
      <div className="topnav-breadcrumb" aria-label="Breadcrumb">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            <span>{crumb}</span>
            <ChevronRight size={13} className="opacity-40" aria-hidden />
          </span>
        ))}
        <span className="topnav-breadcrumb-current">{title}</span>
      </div>

      {/* Actions */}
      <div className="topnav-actions">
        <LiveUpdateIndicator state={connectionState} />

        {/* Notifications Panel */}
        <NotificationPanel />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] hover:bg-[var(--color-surface-muted)] transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[var(--color-navy-800)] flex items-center justify-center">
              {effectiveRole === "admin" ? (
                <Shield size={13} color="#22d3ee" />
              ) : (
                <User size={13} color="var(--color-text-secondary)" />
              )}
            </div>
            <div className="topnav-user-label text-left hidden sm:block">
              <p className="text-[12px] font-semibold leading-tight text-[var(--color-text-primary)]">
                {effectiveUserName}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {effectiveRole === "admin" ? "Administrator" : "Student"}
              </p>
            </div>
            <ChevronRight size={13} className="opacity-40 rotate-90" aria-hidden />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[var(--color-border-subtle)] rounded-[6px] py-1 z-50"
              role="menu"
            >
              <Link href="/profile" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] rounded-[8px] mx-1" role="menuitem">
                <User size={14} /> Profile
              </Link>
              <div className="divider my-1" />
              <button
                onClick={effectiveSignOut}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-600 hover:bg-red-50 rounded-[8px] mx-1 w-full text-left"
                role="menuitem"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)}>
          <nav
            id="mobile-navigation"
            className="mobile-nav-panel"
            aria-label="Mobile navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-nav-header">
              <div className="sidebar-brand-logo" aria-hidden>
                <Activity size={17} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="sidebar-brand-name">CampusPulse</div>
                <div className="sidebar-brand-tagline">Know before you go.</div>
              </div>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="sidebar-nav mobile-nav-list">
              <span className="sidebar-section-label">Navigation</span>
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = item.href === "/notifications"
                  ? app.unreadCount
                  : "badge" in item
                    ? item.badge
                    : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-item", isActive(item.href) && "active")}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="nav-item-icon" size={17} />
                    <span>{item.label}</span>
                    {badgeCount > 0 && <span className="nav-badge">{badgeCount}</span>}
                  </Link>
                );
              })}
            </div>
            <div className="mobile-nav-footer">
              <span className="truncate">{effectiveUserName}</span>
              <span>{effectiveRole === "admin" ? "Administrator" : "Student"}</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

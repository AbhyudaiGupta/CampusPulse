"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useCurrentUser } from "./useCurrentUser";
import { useApp, type StudentPreferences } from "@/context/AppContext";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  studentId?: string;
  department?: string;
  preferences: StudentPreferences;
}

export interface UseUserProfileResult {
  profile: UserProfileData | null;
  preferences: StudentPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPrefs: Partial<StudentPreferences>) => Promise<void>;
  updateProfile: (updates: Partial<{ name: string; department: string }>) => Promise<void>;
}

export function useUserProfile(): UseUserProfileResult {
  const { user } = useCurrentUser();
  const app = useApp();

  const [preferences, setPreferences] = useState<StudentPreferences>(app.preferences);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with AppContext preferences initially
  useEffect(() => {
    setPreferences(app.preferences);
  }, [app.preferences]);

  // Load preferences from Supabase if configured and user is logged in
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    let isMounted = true;
    async function loadRemoteProfile() {
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase!
          .from("profiles")
          .select("quiet_level, accessibility_required, max_walk_minutes, crowd_alerts, reservation_reminders, seat_drops")
          .eq("id", user!.id)
          .single();

        if (fetchErr) {
          // Table might not have row yet, ignore
          return;
        }

        if (data && isMounted) {
          const loadedPrefs: StudentPreferences = {
            quietLevel: data.quiet_level || app.preferences.quietLevel,
            accessibilityRequired: data.accessibility_required ?? app.preferences.accessibilityRequired,
            maxWalkMinutes: data.max_walk_minutes ?? app.preferences.maxWalkMinutes,
            crowdAlerts: data.crowd_alerts ?? app.preferences.crowdAlerts,
            reservationReminders: data.reservation_reminders ?? app.preferences.reservationReminders,
            seatDrops: data.seat_drops ?? app.preferences.seatDrops,
          };
          setPreferences(loadedPrefs);
          app.updatePreferences(loadedPrefs);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRemoteProfile();

    // Subscribe to realtime changes on this user's profile
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (!isMounted || !payload.new) return;
          const row = payload.new;
          const updated: StudentPreferences = {
            quietLevel: row.quiet_level || app.preferences.quietLevel,
            accessibilityRequired: row.accessibility_required ?? app.preferences.accessibilityRequired,
            maxWalkMinutes: row.max_walk_minutes ?? app.preferences.maxWalkMinutes,
            crowdAlerts: row.crowd_alerts ?? app.preferences.crowdAlerts,
            reservationReminders: row.reservation_reminders ?? app.preferences.reservationReminders,
            seatDrops: row.seat_drops ?? app.preferences.seatDrops,
          };
          setPreferences(updated);
          app.updatePreferences(updated);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [user?.id]);

  const updatePreferences = useCallback(
    async (newPrefs: Partial<StudentPreferences>) => {
      const merged = { ...preferences, ...newPrefs };
      setPreferences(merged);
      app.updatePreferences(newPrefs);

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase.from("profiles").upsert({
            id: user.id,
            quiet_level: merged.quietLevel,
            accessibility_required: merged.accessibilityRequired,
            max_walk_minutes: merged.maxWalkMinutes,
            crowd_alerts: merged.crowdAlerts,
            reservation_reminders: merged.reservationReminders,
            seat_drops: merged.seatDrops,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Keep local state
        }
      }
    },
    [preferences, app, user]
  );

  const updateProfile = useCallback(
    async (updates: Partial<{ name: string; department: string }>) => {
      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: updates.name,
              department: updates.department,
            },
          });
        } catch (err: any) {
          setError(err.message || "Failed to update profile");
        }
      }
    },
    [user]
  );

  const profileData: UserProfileData | null = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        preferences,
      }
    : null;

  return {
    profile: profileData,
    preferences,
    loading,
    error,
    updatePreferences,
    updateProfile,
  };
}

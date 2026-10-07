"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionState = "live" | "reconnecting" | "demo";

let globalConnectionState: ConnectionState = isSupabaseConfigured ? "reconnecting" : "demo";
const listeners = new Set<(s: ConnectionState) => void>();

function setGlobalState(s: ConnectionState) {
  if (globalConnectionState === s) return;
  globalConnectionState = s;
  listeners.forEach((fn) => fn(s));
}

// Single global heartbeat
let heartbeatStarted = false;
function startHeartbeat() {
  if (heartbeatStarted || !supabase) return;
  heartbeatStarted = true;

  // Check connection with a lightweight query
  async function ping() {
    try {
      const { error } = await supabase!.from("spaces").select("id").limit(1);
      setGlobalState(error ? "reconnecting" : "live");
    } catch {
      setGlobalState("reconnecting");
    }
  }

  ping();
  setInterval(ping, 30_000);
}

/**
 * Returns the global realtime connection state: "live" | "reconnecting" | "demo".
 * Shared across all components to prevent duplicate heartbeats.
 */
export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(globalConnectionState);

  useEffect(() => {
    listeners.add(setState);
    startHeartbeat();
    return () => { listeners.delete(setState); };
  }, []);

  return state;
}

/**
 * Subscribe to a Supabase Realtime channel. Manages lifecycle and prevents
 * duplicate subscriptions on navigation. Returns null in demo mode.
 */
export function useRealtimeChannel(
  channelName: string,
  configure: (channel: RealtimeChannel) => RealtimeChannel,
  deps: unknown[] = []
): RealtimeChannel | null {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const channel = configure(supabase.channel(channelName));
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setGlobalState("live");
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setGlobalState("reconnecting");
    });
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, ...deps]);

  return channelRef.current;
}

/**
 * Relative timestamp that updates every few seconds.
 */
export function useRelativeTime(isoString: string | null): string {
  const [text, setText] = useState("Updated just now");

  useEffect(() => {
    if (!isoString) { setText("No updates yet"); return; }

    function update() {
      const diffSec = Math.floor((Date.now() - new Date(isoString!).getTime()) / 1000);
      if (diffSec < 5) setText("Updated just now");
      else if (diffSec < 60) setText(`Updated ${diffSec} seconds ago`);
      else if (diffSec < 3600) setText(`Updated ${Math.floor(diffSec / 60)}m ago`);
      else setText(`Updated ${Math.floor(diffSec / 3600)}h ago`);
    }

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [isoString]);

  return text;
}

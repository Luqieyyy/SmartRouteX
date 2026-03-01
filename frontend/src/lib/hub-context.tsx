"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AdminRole, Hub, HubContext as HubContextType } from "@/types";
import { getHubContext, switchHub as switchHubApi } from "@/services/hubs";

/* ── Types ─────────────────────────────────────────────────── */

interface HubContextValue {
  /** Current hub context from the server */
  hubContext: HubContextType | null;
  /** Currently selected hub ID, or null for global view */
  activeHubId: number | null;
  /** Shorthand: the current active hub object */
  activeHub: Pick<Hub, "id" | "name" | "code" | "state" | "latitude" | "longitude"> | null;
  /** Whether the hub selector should be enabled */
  canSwitch: boolean;
  /** Whether to show "All Hubs (Global)" option */
  showGlobal: boolean;
  /** List of hubs the user can access */
  accessibleHubs: Pick<Hub, "id" | "name" | "code" | "state" | "latitude" | "longitude">[];
  /** User role */
  role: AdminRole | null;
  /** Switch hub — triggers data refresh across all modules */
  switchHub: (hubId: number | null) => Promise<void>;
  /** Refresh hub context from server */
  refreshHubContext: () => Promise<void>;
  /** Whether hub context is loading */
  loading: boolean;
  /** Increment to trigger data refresh in consuming components */
  refreshKey: number;
}

const HubCtx = createContext<HubContextValue | undefined>(undefined);

/* ── Provider ──────────────────────────────────────────────── */

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [hubContext, setHubContext] = useState<HubContextType | null>(null);
  const [activeHubId, setActiveHubId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("activeHubId");
      return stored ? Number(stored) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load hub context on mount
  const refreshHubContext = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const ctx = await getHubContext();
      setHubContext(ctx);

      // Sync active hub: if server says active_hub_id differs, respect it
      if (ctx.active_hub_id !== null) {
        setActiveHubId(ctx.active_hub_id);
        localStorage.setItem("activeHubId", String(ctx.active_hub_id));
      } else if (!ctx.can_switch) {
        // Locked role but somehow no hub → clear
        setActiveHubId(null);
        localStorage.removeItem("activeHubId");
      }
    } catch {
      // If 401, user is not logged in — silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHubContext();
  }, [refreshHubContext]);

  // Switch hub action
  const switchHub = useCallback(
    async (hubId: number | null) => {
      await switchHubApi(hubId);
      setActiveHubId(hubId);

      if (hubId) {
        localStorage.setItem("activeHubId", String(hubId));
      } else {
        localStorage.removeItem("activeHubId");
      }

      // Bump refresh key so all consuming components re-fetch data
      setRefreshKey((k) => k + 1);
    },
    []
  );

  // Derived values
  const activeHub = useMemo(() => {
    if (!hubContext || !activeHubId) return null;
    return (
      hubContext.accessible_hubs.find((h) => h.id === activeHubId) ?? null
    );
  }, [hubContext, activeHubId]);

  const value = useMemo<HubContextValue>(
    () => ({
      hubContext,
      activeHubId,
      activeHub,
      canSwitch: hubContext?.can_switch ?? false,
      showGlobal: hubContext?.show_global ?? false,
      accessibleHubs: hubContext?.accessible_hubs ?? [],
      role: (hubContext?.role as AdminRole) ?? null,
      switchHub,
      refreshHubContext,
      loading,
      refreshKey,
    }),
    [hubContext, activeHubId, activeHub, switchHub, refreshHubContext, loading, refreshKey]
  );

  return <HubCtx.Provider value={value}>{children}</HubCtx.Provider>;
}

/* ── Hook ──────────────────────────────────────────────────── */

export function useHubContext(): HubContextValue {
  const ctx = useContext(HubCtx);
  if (!ctx) {
    throw new Error("useHubContext must be used within <HubProvider>");
  }
  return ctx;
}

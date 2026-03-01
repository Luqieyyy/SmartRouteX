"use client";

import React, { useRef, useState, useEffect } from "react";
import { useHubContext } from "@/lib/hub-context";
import { Building2, ChevronDown, Globe, Lock } from "lucide-react";

/**
 * Hub selector dropdown for the topbar.
 *
 * Behaviour by role:
 *  - SUPER_ADMIN:        enabled, shows "All Hubs (Global)" + all hubs
 *  - REGIONAL_MANAGER:   enabled, shows only assigned hubs (no global option)
 *  - HUB_ADMIN / STAFF:  disabled, shows locked hub name
 */
export default function HubSelector() {
  const {
    activeHubId,
    activeHub,
    canSwitch,
    showGlobal,
    accessibleHubs,
    switchHub,
    loading,
  } = useHubContext();

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSelect(hubId: number | null) {
    if (hubId === activeHubId) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchHub(hubId);
    } catch {
      // toast error could go here
    } finally {
      setSwitching(false);
      setOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-1.5">
        <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
        <span className="text-xs text-gray-400">Loading…</span>
      </div>
    );
  }

  // Display label
  const displayLabel = activeHub
    ? `${activeHub.code} — ${activeHub.name}`
    : showGlobal
      ? "All Hubs (Global)"
      : "No Hub";

  // Locked state (HUB_ADMIN / STAFF)
  if (!canSwitch) {
    return (
      <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 cursor-not-allowed">
        <Lock size={13} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-600 max-w-[180px] truncate">
          {displayLabel}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
      >
        <Building2 size={13} className="text-gray-500" />
        <span className="max-w-[180px] truncate">{displayLabel}</span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded border border-gray-200 bg-white shadow-lg py-1 z-[60] max-h-72 overflow-y-auto">
          {/* Global option (SUPER_ADMIN only) */}
          {showGlobal && (
            <button
              onClick={() => handleSelect(null)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                activeHubId === null
                  ? "bg-red-50 text-[#E10600] font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Globe size={13} />
              All Hubs (Global)
            </button>
          )}

          {showGlobal && accessibleHubs.length > 0 && (
            <div className="border-t border-gray-100 my-0.5" />
          )}

          {/* Hub list */}
          {accessibleHubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => handleSelect(hub.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                activeHubId === hub.id
                  ? "bg-red-50 text-[#E10600] font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Building2 size={13} className="shrink-0" />
              <span className="truncate">
                {hub.code} — {hub.name}
              </span>
              {hub.state && (
                <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                  {hub.state}
                </span>
              )}
            </button>
          ))}

          {accessibleHubs.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-gray-400">
              No hubs available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

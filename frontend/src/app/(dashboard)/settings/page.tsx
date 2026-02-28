"use client";

import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          System configuration and preferences
        </p>
      </div>

      <div className="bg-white border border-gray-200 divide-y divide-gray-100">
        {/* General */}
        <div className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">General</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400">System Name</span>
              <p className="text-gray-900 font-medium">SmartRouteX</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Environment</span>
              <p className="text-gray-900 font-medium">Development</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">API Base URL</span>
              <p className="text-gray-900 font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL ?? "Not configured"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Version</span>
              <p className="text-gray-900 font-medium">1.0.0-beta</p>
            </div>
          </div>
        </div>

        {/* Zones */}
        <div className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Zone Configuration</h3>
          <p className="text-sm text-gray-400">Zone management — under development.</p>
        </div>

        {/* Notifications */}
        <div className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Notifications</h3>
          <p className="text-sm text-gray-400">Notification preferences — under development.</p>
        </div>
      </div>
    </div>
  );
}

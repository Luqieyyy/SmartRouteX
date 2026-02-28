"use client";

import React, { useEffect, useState } from "react";
import KpiCard from "@/components/ui/KpiCard";
import { getDashboardStats } from "@/services/dashboard";
import type { DashboardStats } from "@/types";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Operational analytics and performance reports
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#E10600]" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Parcels Today"
            value={stats.total_parcels_today}
            subtitle="Today"
          />
          <KpiCard
            label="Delivered Today"
            value={stats.delivered_today}
            subtitle="Completed"
          />
          <KpiCard
            label="Failed Attempts"
            value={stats.failed_attempts}
            subtitle="Today"
          />
          <KpiCard
            label="Success Rate"
            value={`${stats.success_rate}%`}
            subtitle="Delivery completion"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-12">
          Unable to load report data. Please ensure the API is running.
        </p>
      )}

      <div className="bg-white border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-400">
          Detailed report generation module — under development.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Export to CSV/PDF, date range filters, and zone-level breakdowns
          coming soon.
        </p>
      </div>
    </div>
  );
}

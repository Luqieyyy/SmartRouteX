"use client";

import React, { useEffect, useState } from "react";
import KpiCard from "@/components/ui/KpiCard";
import {
  getDashboardStats,
  getDeliveriesByZone,
  getDeliveryTrend,
} from "@/services/dashboard";
import type { DashboardStats, ZoneDelivery, DailyTrend } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";

type LoadState = "loading" | "ready" | "error";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [zones, setZones] = useState<ZoneDelivery[]>([]);
  const [trend, setTrend] = useState<DailyTrend[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const [s, z, t] = await Promise.all([
          getDashboardStats(),
          getDeliveriesByZone(),
          getDeliveryTrend(),
        ]);
        if (cancelled) return;
        setStats(s);
        setZones(z);
        setTrend(t);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={28} className="animate-spin text-[#E10600]" />
      </div>
    );
  }

  if (state === "error" || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertTriangle size={32} className="text-gray-400" />
        <p className="text-sm text-gray-500">
          Unable to load dashboard data. Please ensure the API is running.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-[#E10600] font-medium hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Operations Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Real-time overview of logistics operations
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Parcels Today" value={stats.total_parcels_today} />
        <KpiCard label="Delivered Today" value={stats.delivered_today} />
        <KpiCard label="Failed Attempts" value={stats.failed_attempts} />
        <KpiCard label="Active Riders" value={stats.active_riders} />
        <KpiCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          subtitle="Delivery completion"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deliveries by zone */}
        <div className="bg-white border border-gray-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Deliveries by Zone
          </h3>
          {zones.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-16">
              No zone data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zones}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #e5e7eb",
                    borderRadius: 0,
                  }}
                />
                <Bar dataKey="count" fill="#E10600" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 7-day trend */}
        <div className="bg-white border border-gray-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Delivery Trend — Last 7 Days
          </h3>
          {trend.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-16">
              No trend data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #e5e7eb",
                    borderRadius: 0,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#E10600"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#E10600" }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: "#9CA3AF" }}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

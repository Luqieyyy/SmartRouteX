import api from "@/lib/axios";
import type { DashboardStats, ZoneDelivery, DailyTrend } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get("/admin/dashboard/stats");
  return data;
}

export async function getDeliveriesByZone(): Promise<ZoneDelivery[]> {
  const { data } = await api.get("/admin/dashboard/by-zone");
  return data;
}

export async function getDeliveryTrend(): Promise<DailyTrend[]> {
  const { data } = await api.get("/admin/dashboard/trend");
  return data;
}

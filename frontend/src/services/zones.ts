import api from "@/lib/axios";
import type { Zone, PaginatedResponse } from "@/types";

export interface ZoneFilters {
  q?: string;
  hub_id?: number;
  page?: number;
  per_page?: number;
}

export interface CreateZonePayload {
  hub_id?: number;
  name: string;
  code: string;
  is_active?: boolean;
}

export interface UpdateZonePayload {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export async function getZones(
  filters: ZoneFilters = {}
): Promise<PaginatedResponse<Zone>> {
  const { data } = await api.get("/admin/zones", { params: filters });
  return data;
}

export async function getActiveZones(hubId?: number): Promise<Zone[]> {
  const params: Record<string, unknown> = {};
  if (hubId) params.hub_id = hubId;
  const { data } = await api.get("/admin/zones/active", { params });
  return data.data;
}

export async function createZone(
  payload: CreateZonePayload
): Promise<{ ok: boolean; message: string; zone: Zone }> {
  const { data } = await api.post("/admin/zones", payload);
  return data;
}

export async function updateZone(
  id: number,
  payload: UpdateZonePayload
): Promise<{ ok: boolean; zone: Zone }> {
  const { data } = await api.put(`/admin/zones/${id}`, payload);
  return data;
}

export async function deleteZone(
  id: number
): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.delete(`/admin/zones/${id}`);
  return data;
}

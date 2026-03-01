import api from "@/lib/axios";
import type { Hub, HubContext, PaginatedResponse } from "@/types";

export interface HubFilters {
  q?: string;
  page?: number;
  per_page?: number;
}

export interface CreateHubPayload {
  name: string;
  code: string;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export interface UpdateHubPayload {
  name?: string;
  code?: string;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export async function getHubs(
  filters: HubFilters = {}
): Promise<PaginatedResponse<Hub>> {
  const { data } = await api.get("/admin/hubs", { params: filters });
  return data;
}

export async function getActiveHubs(): Promise<Hub[]> {
  const { data } = await api.get("/admin/hubs/active");
  return data.data;
}

export async function createHub(
  payload: CreateHubPayload
): Promise<{ ok: boolean; message: string; hub: Hub }> {
  const { data } = await api.post("/admin/hubs", payload);
  return data;
}

export async function updateHub(
  id: number,
  payload: UpdateHubPayload
): Promise<{ ok: boolean; hub: Hub }> {
  const { data } = await api.put(`/admin/hubs/${id}`, payload);
  return data;
}

export async function deleteHub(
  id: number
): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.delete(`/admin/hubs/${id}`);
  return data;
}

/**
 * Switch the active hub context.
 * Pass null to switch to global view (SUPER_ADMIN only).
 */
export async function switchHub(
  hubId: number | null
): Promise<{ ok: boolean; message: string; hub: Hub | null; active_hub_id: number | null }> {
  const { data } = await api.post("/admin/switch-hub", { hub_id: hubId });

  // Persist for subsequent X-Hub-Id header
  if (typeof window !== "undefined") {
    if (data.active_hub_id) {
      localStorage.setItem("activeHubId", String(data.active_hub_id));
    } else {
      localStorage.removeItem("activeHubId");
    }
  }

  return data;
}

/**
 * Get the hub context for the current user (accessible hubs, permissions).
 */
export async function getHubContext(): Promise<HubContext> {
  const { data } = await api.get("/admin/hub-context");
  return data;
}

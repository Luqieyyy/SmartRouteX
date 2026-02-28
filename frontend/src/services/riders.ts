import api from "@/lib/axios";
import type { Rider, PaginatedResponse } from "@/types";

export interface RiderFilters {
  q?: string;
  zone?: string;
  is_active?: boolean;
  page?: number;
}

export async function getRiders(
  filters: RiderFilters = {}
): Promise<PaginatedResponse<Rider>> {
  const { data } = await api.get("/admin/riders", { params: filters });
  return data;
}

export async function getRider(id: number): Promise<Rider> {
  const { data } = await api.get(`/admin/riders/${id}`);
  return data;
}

export async function createRider(
  payload: Partial<Rider>
): Promise<{ ok: boolean; rider: Rider }> {
  const { data } = await api.post("/admin/riders", payload);
  return data;
}

export async function updateRider(
  id: number,
  payload: Partial<Rider>
): Promise<{ ok: boolean; rider: Rider }> {
  const { data } = await api.put(`/admin/riders/${id}`, payload);
  return data;
}

export async function deleteRider(
  id: number
): Promise<{ ok: boolean }> {
  const { data } = await api.delete(`/admin/riders/${id}`);
  return data;
}

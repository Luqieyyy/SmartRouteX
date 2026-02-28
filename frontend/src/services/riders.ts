import api from "@/lib/axios";
import type { Rider, RiderStatus, PaginatedResponse } from "@/types";

export interface RiderFilters {
  q?: string;
  zone?: string;
  zone_id?: number;
  status?: RiderStatus;
  page?: number;
}

export interface CreateRiderPayload {
  name: string;
  work_email: string;
  phone?: string | null;
  zone?: string | null;
  zone_id?: number | null;
  employment_type?: string | null;
  warehouse?: string | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  max_parcel_capacity?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
}

export interface UpdateRiderPayload {
  name?: string;
  work_email?: string;
  phone?: string | null;
  zone?: string | null;
  zone_id?: number | null;
  employment_type?: string | null;
  warehouse?: string | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  max_parcel_capacity?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  status?: RiderStatus;
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
  payload: CreateRiderPayload
): Promise<{ ok: boolean; message: string; rider: Rider }> {
  const { data } = await api.post("/admin/riders", payload);
  return data;
}

export async function updateRider(
  id: number,
  payload: UpdateRiderPayload
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

export async function resendSetupEmail(
  id: number
): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post(`/admin/riders/${id}/resend-setup-email`);
  return data;
}

/* ── Setup password (public, no auth) ─────────────────────── */

export async function validateSetupToken(
  token: string
): Promise<{ valid: boolean; rider?: { name: string; work_email: string }; message?: string }> {
  const { data } = await api.get("/rider/validate-token", { params: { token } });
  return data;
}

export async function setupPassword(
  token: string,
  password: string,
  password_confirmation: string
): Promise<{ ok: boolean; message: string; access_token?: string }> {
  const { data } = await api.post("/rider/setup-password", {
    token,
    password,
    password_confirmation,
  });
  return data;
}

import api from "@/lib/axios";
import type {
  Parcel,
  PaginatedResponse,
  ImportResult,
} from "@/types";

export interface ParcelFilters {
  q?: string;
  status?: string;
  zone?: string;
  page?: number;
  per_page?: number;
}

export async function getParcels(
  filters: ParcelFilters = {}
): Promise<PaginatedResponse<Parcel>> {
  const { data } = await api.get("/admin/parcels", { params: filters });
  return data;
}

export async function getParcel(id: number): Promise<Parcel> {
  const { data } = await api.get(`/admin/parcels/${id}`);
  return data;
}

export async function createParcel(
  payload: Partial<Parcel>
): Promise<{ ok: boolean; parcel: Parcel }> {
  const { data } = await api.post("/admin/parcels", payload);
  return data;
}

export async function updateParcel(
  id: number,
  payload: Partial<Parcel>
): Promise<{ ok: boolean; parcel: Parcel }> {
  const { data } = await api.put(`/admin/parcels/${id}`, payload);
  return data;
}

export async function deleteParcel(
  id: number
): Promise<{ ok: boolean }> {
  const { data } = await api.delete(`/admin/parcels/${id}`);
  return data;
}

export async function importParcelsCsv(
  file: File,
  defaultPriority = "NORMAL",
  defaultZone?: string
): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("default_priority", defaultPriority);
  if (defaultZone) form.append("default_zone", defaultZone);

  const { data } = await api.post("/admin/parcels/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

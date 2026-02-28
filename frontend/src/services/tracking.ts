import api from "@/lib/axios";
import type { RiderLocation, Parcel } from "@/types";

export interface LiveRiderPosition {
  rider_id: number;
  rider_name: string;
  lat: number;
  lng: number;
  recorded_at: string;
  assigned_parcels: number;
}

export async function getLivePositions(): Promise<LiveRiderPosition[]> {
  const { data } = await api.get("/admin/tracking/riders");
  return data;
}

export async function getAssignedParcelPoints(): Promise<
  { id: number; barcode: string; lat: number; lng: number; zone: string | null }[]
> {
  const { data } = await api.get("/admin/tracking/parcels");
  return data;
}

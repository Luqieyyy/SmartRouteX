/* ──────────────────────────────────────────────
   SmartRouteX — Domain Types
   ────────────────────────────────────────────── */

export type ParcelPriority = "NORMAL" | "EXPRESS";

export type ParcelStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED";

export interface Parcel {
  id: number;
  barcode: string;
  tracking_no: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  raw_address: string | null;
  zone: string | null;
  priority: ParcelPriority;
  status: ParcelStatus;
  assigned_rider_id: number | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
  rider?: Rider | null;
}

export interface Rider {
  id: number;
  name: string;
  phone: string | null;
  zone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parcels_count?: number;
  latest_location?: RiderLocation | null;
}

export interface RiderLocation {
  id: number;
  rider_id: number;
  lat: number;
  lng: number;
  recorded_at: string;
}

export interface DeliveryAttempt {
  id: number;
  parcel_id: number;
  rider_id: number | null;
  result: "DELIVERED" | "FAILED";
  note: string | null;
  pod_image_url: string | null;
  attempted_at: string;
  created_at: string;
}

/* Pagination envelope from Laravel */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/* Generic API success wrapper */
export interface ApiOk<T = unknown> {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
  data?: T;
}

/* CSV import result */
export interface ImportResult {
  ok: boolean;
  inserted: number;
  skipped: number;
  errors: string[];
}

/* Dashboard KPI payload */
export interface DashboardStats {
  total_parcels_today: number;
  delivered_today: number;
  failed_attempts: number;
  active_riders: number;
  success_rate: number;
}

export interface ZoneDelivery {
  zone: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  delivered: number;
  failed: number;
}

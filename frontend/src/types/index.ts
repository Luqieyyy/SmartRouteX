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

export type RiderStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface Rider {
  id: number;
  name: string;
  work_email: string | null;
  phone: string | null;
  zone: string | null;
  hub_id: number | null;
  zone_id: number | null;
  employment_type: string | null;
  warehouse: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  max_parcel_capacity: number | null;
  shift_start: string | null;
  shift_end: string | null;
  status: RiderStatus;
  is_active: boolean;
  must_change_password: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_by_admin_id: number | null;
  created_at: string;
  updated_at: string;
  parcels_count?: number;
  latest_location?: RiderLocation | null;
  hub?: Hub | null;
  assigned_zone?: Zone | null;
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

/* ── Hub / Zone ────────────────────────────────────────────── */

export type AdminRole =
  | "SUPER_ADMIN"
  | "REGIONAL_MANAGER"
  | "HUB_ADMIN"
  | "STAFF"
  | "admin";

export interface Hub {
  id: number;
  name: string;
  code: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  zones_count?: number;
  riders_count?: number;
  parcels_count?: number;
}

export interface Zone {
  id: number;
  hub_id: number;
  name: string;
  code: string;
  is_active: boolean;
  zone_boundary: { lat: number; lng: number }[] | null;
  color_code: string;
  created_at?: string;
  updated_at?: string;
  riders_count?: number;
  parcels_count?: number;
  hub?: Pick<Hub, "id" | "name" | "code"> | null;
}

/** Lightweight boundary data for map overlays */
export interface ZoneBoundary {
  id: number;
  name: string;
  code: string;
  color_code: string;
  zone_boundary: { lat: number; lng: number }[];
}

/** Hub context returned by login / /me / /hub-context endpoints */
export interface HubContext {
  role: AdminRole;
  can_switch: boolean;
  show_global: boolean;
  accessible_hubs: Pick<Hub, "id" | "name" | "code" | "state" | "latitude" | "longitude">[];
  active_hub_id: number | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  hub_id: number | null;
  hub?: Pick<Hub, "id" | "name" | "code"> | null;
  hub_context?: HubContext;
}

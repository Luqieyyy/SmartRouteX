/* ──────────────────────────────────────────────
   SmartRouteX — Google Maps Helper Utilities
   ────────────────────────────────────────────── */

import type { ParcelStatus } from "@/types";

/* ── Types ── */

export interface ParcelMarker {
  id: number;
  tracking_no: string;
  recipient_name: string;
  address: string;
  zone: string;
  status: ParcelStatus;
  lat: number;
  lng: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

/* ── Map Configuration ── */

/** Default center — Kuala Lumpur, Malaysia */
export const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 3.139,
  lng: 101.6869,
};

export const DEFAULT_ZOOM = 12;

export const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "0.75rem",
};

/** Minimal map options for a clean dashboard look */
export const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

/* ── Marker Colors by Status ── */

const STATUS_COLORS: Record<ParcelStatus, string> = {
  CREATED: "#6B7280",   // gray
  ASSIGNED: "#3B82F6",  // blue
  IN_TRANSIT: "#F59E0B", // amber
  DELIVERED: "#10B981", // green
  FAILED: "#EF4444",    // red
};

/**
 * Generate an SVG marker icon URL for a given parcel status.
 * Returns a data URI so no external asset requests are needed.
 */
export function getMarkerIcon(status: ParcelStatus): string {
  const color = STATUS_COLORS[status] ?? "#6B7280";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

/**
 * Build a polyline path from an ordered array of parcel markers.
 */
export function buildRoutePath(markers: ParcelMarker[]): RoutePoint[] {
  return markers.map(({ lat, lng }) => ({ lat, lng }));
}

/** Polyline styling */
export const ROUTE_POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  strokeColor: "#3B82F6",
  strokeOpacity: 0.8,
  strokeWeight: 3,
  geodesic: true,
};

/* ── Validation ── */

/**
 * Validates that the Google Maps API key environment variable is set.
 * Returns the key string or null if missing / empty.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key.trim().length === 0) {
    return null;
  }
  return key.trim();
}

/* ── Sample Data (for development / demo) ── */

export const SAMPLE_PARCELS: ParcelMarker[] = [
  {
    id: 1,
    tracking_no: "SRX-20260001",
    recipient_name: "Ahmad Bin Ibrahim",
    address: "12, Jalan Bukit Bintang, KL",
    zone: "Zone A",
    status: "IN_TRANSIT",
    lat: 3.1466,
    lng: 101.7108,
  },
  {
    id: 2,
    tracking_no: "SRX-20260002",
    recipient_name: "Siti Nurhaliza",
    address: "45, Jalan Ampang, KL",
    zone: "Zone A",
    status: "ASSIGNED",
    lat: 3.1579,
    lng: 101.7173,
  },
  {
    id: 3,
    tracking_no: "SRX-20260003",
    recipient_name: "Raj Kumar",
    address: "88, Jalan Petaling, KL",
    zone: "Zone B",
    status: "DELIVERED",
    lat: 3.1430,
    lng: 101.6958,
  },
  {
    id: 4,
    tracking_no: "SRX-20260004",
    recipient_name: "Lee Wei Ming",
    address: "23, Bangsar South, KL",
    zone: "Zone C",
    status: "FAILED",
    lat: 3.1103,
    lng: 101.6653,
  },
  {
    id: 5,
    tracking_no: "SRX-20260005",
    recipient_name: "Nurul Aisyah",
    address: "7, Mont Kiara, KL",
    zone: "Zone B",
    status: "CREATED",
    lat: 3.1715,
    lng: 101.6511,
  },
];

"use client";

/* ──────────────────────────────────────────────
   SmartRouteX — MapView Component
   Google Maps integration for admin dashboard.
   API key loaded exclusively from env variable.
   ────────────────────────────────────────────── */

import { useCallback, useMemo, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  PolylineF,
  useLoadScript,
} from "@react-google-maps/api";

import {
  buildRoutePath,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  getGoogleMapsApiKey,
  getMarkerIcon,
  MAP_CONTAINER_STYLE,
  MAP_OPTIONS,
  ROUTE_POLYLINE_OPTIONS,
  SAMPLE_PARCELS,
  type ParcelMarker,
} from "@/lib/mapHelpers";
import { statusColor } from "@/lib/utils";

/* ── Props ── */

interface MapViewProps {
  /** Pass parcel markers; falls back to sample data when omitted. */
  parcels?: ParcelMarker[];
  /** Override default map center */
  center?: google.maps.LatLngLiteral;
  /** Override default zoom */
  zoom?: number;
  /** Show the polyline route connecting markers */
  showRoute?: boolean;
  /** Container className override */
  className?: string;
}

/* ── Component ── */

export default function MapView({
  parcels,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showRoute = true,
  className = "h-[600px] w-full",
}: MapViewProps) {
  /* ---------- Validate API key ---------- */
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return <ApiKeyMissing />;
  }

  return (
    <MapInner
      apiKey={apiKey}
      parcels={parcels}
      center={center}
      zoom={zoom}
      showRoute={showRoute}
      className={className}
    />
  );
}

/* ── Inner map (only renders when key is available) ── */

function MapInner({
  apiKey,
  parcels,
  center,
  zoom,
  showRoute,
  className,
}: MapViewProps & { apiKey: string }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  const markers = useMemo(() => parcels ?? SAMPLE_PARCELS, [parcels]);
  const routePath = useMemo(() => buildRoutePath(markers), [markers]);

  const [selected, setSelected] = useState<ParcelMarker | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    if (markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }, [markers]);

  /* Loading / error states */
  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl border border-red-200 bg-red-50`}>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-red-700">
            Failed to load Google Maps
          </h3>
          <p className="mt-2 text-sm text-red-600">
            Please verify your API key is valid and has the Maps JavaScript API
            enabled.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50`}>
        <div className="flex items-center gap-3 text-gray-500">
          <Spinner />
          <span>Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onClick={() => setSelected(null)}
      >
        {/* ── Markers ── */}
        {markers.map((parcel) => (
          <MarkerF
            key={parcel.id}
            position={{ lat: parcel.lat, lng: parcel.lng }}
            icon={{
              url: getMarkerIcon(parcel.status),
              scaledSize: new google.maps.Size(28, 42),
              anchor: new google.maps.Point(14, 42),
            }}
            title={parcel.tracking_no}
            onClick={() => setSelected(parcel)}
          />
        ))}

        {/* ── Polyline Route ── */}
        {showRoute && routePath.length > 1 && (
          <PolylineF path={routePath} options={ROUTE_POLYLINE_OPTIONS} />
        )}

        {/* ── Info Window ── */}
        {selected && (
          <InfoWindowF
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
            options={{ pixelOffset: new google.maps.Size(0, -42) }}
          >
            <div className="min-w-[200px] p-1">
              <p className="text-sm font-bold text-gray-900">
                {selected.tracking_no}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {selected.recipient_name}
              </p>

              <div className="mt-2 space-y-1 text-xs text-gray-700">
                <div className="flex items-start gap-1.5">
                  <span className="font-medium text-gray-500">Address:</span>
                  <span>{selected.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-500">Area:</span>
                  <span>{selected.zone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-500">Status:</span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(selected.status)}`}
                  >
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}

/* ── Error State: Missing API Key ── */

function ApiKeyMissing() {
  return (
    <div className="flex h-[600px] w-full items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50">
      <div className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-amber-800">
          Google Maps API Key Not Configured
        </h3>

        <p className="mt-2 text-sm text-amber-700">
          The environment variable{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          is missing or empty.
        </p>

        <div className="mt-4 rounded-lg bg-white/70 p-4 text-left text-xs text-gray-700">
          <p className="mb-2 font-semibold text-gray-900">Quick Setup:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Create <code className="font-mono">.env.local</code> in the{" "}
              <code className="font-mono">frontend/</code> root
            </li>
            <li>
              Add:{" "}
              <code className="font-mono">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
              </code>
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ── Loading Spinner ── */

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-gray-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  PolygonF,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/lib/google-maps-loader";
import { polygonCentroid } from "@/components/maps/ZoneDrawingMap";
import Button from "@/components/ui/Button";
import {
  getLivePositions,
  getAssignedParcelPoints,
  type LiveRiderPosition,
} from "@/services/tracking";
import { getZoneBoundaries } from "@/services/zones";
import type { ZoneBoundary } from "@/types";
import { getGoogleMapsApiKey } from "@/lib/mapHelpers";
import { useHubContext } from "@/lib/hub-context";

const KL_CENTER = { lat: 3.139, lng: 101.6869 }; // fallback

interface ParcelPoint {
  id: number;
  barcode: string;
  lat: number;
  lng: number;
  zone: string | null;
}

/* ── Rider SVG marker (blue circle) ── */
function riderIcon(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="white" stroke-width="3"/>
    <circle cx="16" cy="16" r="5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

/* ── Parcel SVG marker (red pin) ── */
function parcelIcon(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#EF4444"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export default function TrackingPage() {
  const { refreshKey, activeHub, activeHubId } = useHubContext();
  const apiKey = getGoogleMapsApiKey();

  // Map center: active hub coords → fallback to KL
  const hubCenter = useMemo(() => {
    if (activeHub?.latitude && activeHub?.longitude) {
      return { lat: activeHub.latitude, lng: activeHub.longitude };
    }
    return KL_CENTER;
  }, [activeHub]);

  const [riders, setRiders] = useState<LiveRiderPosition[]>([]);
  const [parcels, setParcels] = useState<ParcelPoint[]>([]);
  const [zoneBoundaries, setZoneBoundaries] = useState<ZoneBoundary[]>([]);
  const [showRiders, setShowRiders] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        getLivePositions(),
        getAssignedParcelPoints(),
      ]);
      setRiders(r);
      setParcels(p);
    } catch {
      /* fallback: keep previous data */
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  /* ── Fetch zone boundaries (on hub switch) ── */
  useEffect(() => {
    if (!activeHubId) {
      setZoneBoundaries([]);
      return;
    }
    getZoneBoundaries(activeHubId)
      .then(setZoneBoundaries)
      .catch(() => setZoneBoundaries([]));
  }, [activeHubId, refreshKey]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Live Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {riders.length} riders online — auto-refresh every 10s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showRiders ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowRiders(!showRiders)}
          >
            Riders {showRiders ? "ON" : "OFF"}
          </Button>
          <Button
            variant={showParcels ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowParcels(!showParcels)}
          >
            Parcels {showParcels ? "ON" : "OFF"}
          </Button>
          <Button
            variant={showZones ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowZones(!showZones)}
          >
            Zones {showZones ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Loading map data…
          </div>
        ) : !apiKey ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-sm text-center">
              <p className="text-amber-700 font-semibold">
                Google Maps API Key Missing
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Add <code className="bg-gray-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
                <code className="bg-gray-100 px-1 rounded font-mono text-xs">.env.local</code> and restart the dev server.
              </p>
            </div>
          </div>
        ) : (
          <TrackingMap
            apiKey={apiKey}
            riders={showRiders ? riders : []}
            parcels={showParcels ? parcels : []}
            zoneBoundaries={showZones ? zoneBoundaries : []}
            hubCenter={hubCenter}
          />
        )}
      </div>
    </div>
  );
}

/* ── Google Map inner component ── */

function TrackingMap({
  apiKey,
  riders,
  parcels,
  zoneBoundaries,
  hubCenter,
}: {
  apiKey: string;
  riders: LiveRiderPosition[];
  parcels: ParcelPoint[];
  zoneBoundaries: ZoneBoundary[];
  hubCenter: { lat: number; lng: number };
}) {
  const { isLoaded, loadError } = useGoogleMaps(apiKey);

  const [selectedRider, setSelectedRider] = useState<LiveRiderPosition | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelPoint | null>(null);

  const riderIconUrl = useMemo(() => riderIcon(), []);
  const parcelIconUrl = useMemo(() => parcelIcon(), []);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      const allPoints = [
        ...riders.map((r) => ({ lat: r.lat, lng: r.lng })),
        ...parcels.map((p) => ({ lat: p.lat, lng: p.lng })),
      ];
      if (allPoints.length === 0) {
        // No markers → center on hub
        map.setCenter(hubCenter);
        map.setZoom(13);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      allPoints.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    },
    [riders, parcels, hubCenter],
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        Failed to load Google Maps. Check API key &amp; billing.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Loading Google Maps…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={hubCenter}
      zoom={13}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
      onLoad={onMapLoad}
      onClick={() => {
        setSelectedRider(null);
        setSelectedParcel(null);
      }}
    >
      {/* Zone boundary polygons */}
      {zoneBoundaries.map((z) => (
        <React.Fragment key={`zone-${z.id}`}>
          <PolygonF
            paths={z.zone_boundary}
            options={{
              fillColor: z.color_code,
              fillOpacity: 0.15,
              strokeColor: z.color_code,
              strokeWeight: 2,
              strokeOpacity: 0.8,
              zIndex: 0,
            }}
          />
          {/* Zone name label at polygon centre */}
          <MarkerF
            position={polygonCentroid(z.zone_boundary)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
            }}
            label={{
              text: z.name,
              color: z.color_code,
              fontSize: "16px",
              fontWeight: "800",
            }}
            clickable={false}
          />
        </React.Fragment>
      ))}

      {/* Rider markers */}
      {riders.map((r) => (
        <MarkerF
          key={`rider-${r.rider_id}`}
          position={{ lat: r.lat, lng: r.lng }}
          icon={{
            url: riderIconUrl,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          }}
          title={r.rider_name}
          onClick={() => {
            setSelectedParcel(null);
            setSelectedRider(r);
          }}
        />
      ))}

      {/* Parcel markers */}
      {parcels.map((p) => (
        <MarkerF
          key={`parcel-${p.id}`}
          position={{ lat: p.lat, lng: p.lng }}
          icon={{
            url: parcelIconUrl,
            scaledSize: new google.maps.Size(24, 36),
            anchor: new google.maps.Point(12, 36),
          }}
          title={p.barcode}
          onClick={() => {
            setSelectedRider(null);
            setSelectedParcel(p);
          }}
        />
      ))}

      {/* Rider info window */}
      {selectedRider && (
        <InfoWindowF
          position={{ lat: selectedRider.lat, lng: selectedRider.lng }}
          onCloseClick={() => setSelectedRider(null)}
          options={{ pixelOffset: new google.maps.Size(0, -16) }}
        >
          <div className="min-w-[180px] p-1">
            <p className="text-sm font-bold text-gray-900">
              {selectedRider.rider_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Parcels: {selectedRider.assigned_parcels}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedRider.recorded_at}
            </p>
          </div>
        </InfoWindowF>
      )}

      {/* Parcel info window */}
      {selectedParcel && (
        <InfoWindowF
          position={{ lat: selectedParcel.lat, lng: selectedParcel.lng }}
          onCloseClick={() => setSelectedParcel(null)}
          options={{ pixelOffset: new google.maps.Size(0, -36) }}
        >
          <div className="min-w-[180px] p-1">
            <p className="text-sm font-mono font-bold text-gray-900">
              {selectedParcel.barcode}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedParcel.zone ?? "No zone"}
            </p>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

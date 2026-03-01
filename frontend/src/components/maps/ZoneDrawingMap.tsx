"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  DrawingManagerF,
  MarkerF,
  PolygonF,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/lib/google-maps-loader";
import Button from "@/components/ui/Button";
import { MapPin, Trash2, Pencil } from "lucide-react";

/* ── Types ── */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Read-only neighbouring zone shown on the map during editing */
export interface NeighbourZone {
  id: number;
  name: string;
  color_code: string;
  zone_boundary: LatLng[];
}

interface ZoneDrawingMapProps {
  /** Existing polygon to render (edit mode) */
  boundary: LatLng[] | null;
  /** Called whenever the polygon changes */
  onBoundaryChange: (boundary: LatLng[] | null) => void;
  /** Hub center for initial map view */
  hubCenter?: LatLng;
  /** Zone color */
  color?: string;
  /** API key */
  apiKey: string;
  /** Zone name to display in polygon centre */
  zoneName?: string;
  /** Other zones in the same hub (read-only overlay) */
  otherZones?: NeighbourZone[];
}

const MAP_STYLE: React.CSSProperties = {
  width: "100%",
  height: "420px",
  borderRadius: "0.5rem",
};

const DEFAULT_CENTER = { lat: 3.139, lng: 101.6869 };

/* ── Predefined zone colors ── */
export const ZONE_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
  "#D946EF", // fuchsia
];

/* ── Helper: compute polygon centroid ── */
export function polygonCentroid(pts: LatLng[]): LatLng {
  let latSum = 0;
  let lngSum = 0;
  for (const p of pts) {
    latSum += p.lat;
    lngSum += p.lng;
  }
  return {
    lat: latSum / pts.length,
    lng: lngSum / pts.length,
  };
}

/* ── Helper: check if two polygons intersect (using Google Geometry) ── */
export function polygonsIntersect(a: LatLng[], b: LatLng[]): boolean {
  if (typeof google === "undefined" || !google.maps?.geometry?.poly) return false;

  // Build Google LatLng arrays
  const polyA = a.map((p) => new google.maps.LatLng(p.lat, p.lng));
  const polyB = b.map((p) => new google.maps.LatLng(p.lat, p.lng));

  // Check if any vertex of A is inside B
  for (const pt of polyA) {
    if (google.maps.geometry.poly.containsLocation(pt, new google.maps.Polygon({ paths: polyB }))) {
      return true;
    }
  }
  // Check if any vertex of B is inside A
  for (const pt of polyB) {
    if (google.maps.geometry.poly.containsLocation(pt, new google.maps.Polygon({ paths: polyA }))) {
      return true;
    }
  }
  return false;
}

/* ── Component ── */

export default function ZoneDrawingMap({
  boundary,
  onBoundaryChange,
  hubCenter,
  color = "#3B82F6",
  apiKey,
  zoneName,
  otherZones = [],
}: ZoneDrawingMapProps) {
  /* Use shared loader — prevents "API loaded multiple times" error */
  const { isLoaded, loadError } = useGoogleMaps(apiKey);

  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /*
   * During editing, we store changes in a local ref so React does NOT
   * re-render <PolygonF> (which would call setPaths, destroying the old
   * path and its listeners). We push the final result to the parent
   * only when the user clicks "Stop Editing".
   */
  const liveEditRef = useRef<LatLng[] | null>(null);
  const [editVertexCount, setEditVertexCount] = useState(0);

  /*
   * Stable ref to onBoundaryChange (avoids stale-closure bugs).
   */
  const cbRef = useRef(onBoundaryChange);
  cbRef.current = onBoundaryChange;

  const center = hubCenter ?? DEFAULT_CENTER;

  /* ── Extract coords from a google.maps.Polygon ── */
  const extractCoords = useCallback((poly: google.maps.Polygon): LatLng[] => {
    const path = poly.getPath();
    const coords: LatLng[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const pt = path.getAt(i);
      coords.push({
        lat: Math.round(pt.lat() * 1e7) / 1e7,
        lng: Math.round(pt.lng() * 1e7) / 1e7,
      });
    }
    return coords;
  }, []);

  /* ── Remove all path-edit listeners ── */
  const clearListeners = useCallback(() => {
    listenersRef.current.forEach((l) => google.maps.event.removeListener(l));
    listenersRef.current = [];
  }, []);

  /* ── Attach path-edit listeners to a polygon ── */
  const attachEditListeners = useCallback(
    (poly: google.maps.Polygon) => {
      clearListeners();
      const path = poly.getPath();

      const sync = () => {
        const coords = extractCoords(poly);
        if (coords.length >= 3) {
          liveEditRef.current = coords;
          setEditVertexCount(coords.length);
        }
      };

      listenersRef.current.push(
        google.maps.event.addListener(path, "set_at", sync),
        google.maps.event.addListener(path, "insert_at", sync),
        google.maps.event.addListener(path, "remove_at", sync),
      );
    },
    [clearListeners, extractCoords],
  );

  /* ── Handle new polygon drawn by DrawingManager ── */
  const onPolygonComplete = useCallback(
    (poly: google.maps.Polygon) => {
      const coords = extractCoords(poly);

      poly.setMap(null);

      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      polygonRef.current = null;
      clearListeners();
      liveEditRef.current = null;

      cbRef.current(coords);
      setIsDrawing(false);
      setIsEditing(false);
    },
    [extractCoords, clearListeners],
  );

  /* ── Start drawing mode ── */
  const startDrawing = () => {
    clearListeners();
    liveEditRef.current = null;
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    cbRef.current(null);
    setIsEditing(false);
    setIsDrawing(true);
  };

  /* ── Delete polygon ── */
  const deleteBoundary = () => {
    clearListeners();
    liveEditRef.current = null;
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    cbRef.current(null);
    setIsDrawing(false);
    setIsEditing(false);
  };

  /* ── Toggle edit mode for existing polygon ── */
  const toggleEdit = () => {
    if (!polygonRef.current) return;
    const entering = !isEditing;

    if (entering) {
      liveEditRef.current = null;
      polygonRef.current.setEditable(true);
      attachEditListeners(polygonRef.current);
    } else {
      polygonRef.current.setEditable(false);
      clearListeners();
      if (liveEditRef.current) {
        cbRef.current(liveEditRef.current);
        liveEditRef.current = null;
      }
    }
    setIsEditing(entering);
  };

  /* ── Fit map to show all zones ── */
  const fitToBounds = useCallback((coords: LatLng[], extras: NeighbourZone[]) => {
    if (!mapRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    coords.forEach((pt) => { bounds.extend(pt); hasPoints = true; });
    extras.forEach((z) => z.zone_boundary.forEach((pt) => { bounds.extend(pt); hasPoints = true; }));
    if (hasPoints) {
      mapRef.current.fitBounds(bounds, 40);
    }
  }, []);

  /* ── Map load handler ── */
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (boundary && boundary.length >= 3) {
        fitToBounds(boundary, otherZones);
      } else if (otherZones.length > 0) {
        fitToBounds([], otherZones);
      }
    },
    [boundary, otherZones, fitToBounds],
  );

  /* ── React PolygonF load ── */
  const onPolygonLoad = useCallback((poly: google.maps.Polygon) => {
    polygonRef.current = poly;
  }, []);

  /* Cleanup listeners on unmount */
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      listenersRef.current.forEach((l) => google.maps.event.removeListener(l));
    };
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-gray-50 rounded-lg text-sm text-red-500">
        Failed to load Google Maps. Check API key &amp; billing.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-gray-50 rounded-lg text-sm text-gray-400">
        Loading Google Maps…
      </div>
    );
  }

  const hasBoundary = boundary && boundary.length >= 3;
  const displayVertices = isEditing && liveEditRef.current
    ? liveEditRef.current.length
    : hasBoundary
      ? boundary!.length
      : 0;

  /* Centroid for zone name label */
  const centroid = hasBoundary ? polygonCentroid(boundary!) : null;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isDrawing ? "primary" : "secondary"}
          size="sm"
          onClick={startDrawing}
        >
          <MapPin size={14} className="mr-1.5" />
          {hasBoundary ? "Redraw Boundary" : "Draw Boundary"}
        </Button>

        {hasBoundary && (
          <>
            <Button
              type="button"
              variant={isEditing ? "primary" : "secondary"}
              size="sm"
              onClick={toggleEdit}
            >
              <Pencil size={14} className="mr-1.5" />
              {isEditing ? "Stop Editing" : "Edit Vertices"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deleteBoundary}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete
            </Button>
          </>
        )}

        {(hasBoundary || isEditing) && (
          <span className="text-xs text-gray-500 ml-auto">
            {displayVertices} vertices
            {isEditing && <span className="ml-1 text-blue-600">(editing)</span>}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={center}
          zoom={13}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* ── Other zones (read-only, low opacity) ── */}
          {otherZones.map((z) => (
            <React.Fragment key={`other-${z.id}`}>
              <PolygonF
                paths={z.zone_boundary}
                options={{
                  fillColor: z.color_code,
                  fillOpacity: 0.08,
                  strokeColor: z.color_code,
                  strokeWeight: 1.5,
                  strokeOpacity: 0.5,
                  clickable: false,
                  editable: false,
                  zIndex: 0,
                }}
              />
              {/* Neighbour zone name label */}
              <MarkerF
                position={polygonCentroid(z.zone_boundary)}
                icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
                label={{
                  text: z.name,
                  color: z.color_code,
                  fontSize: "15px",
                  fontWeight: "700",
                }}
                clickable={false}
              />
            </React.Fragment>
          ))}

          {/* Drawing manager — only active when in drawing mode */}
          {isDrawing && (
            <DrawingManagerF
              options={{
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: false,
                polygonOptions: {
                  fillColor: color,
                  fillOpacity: 0.25,
                  strokeColor: color,
                  strokeWeight: 3,
                  editable: true,
                  zIndex: 2,
                },
              }}
              onPolygonComplete={onPolygonComplete}
            />
          )}

          {/* Render existing polygon (when not actively drawing) — bold stroke */}
          {!isDrawing && hasBoundary && (
            <PolygonF
              paths={boundary!}
              options={{
                fillColor: color,
                fillOpacity: 0.25,
                strokeColor: color,
                strokeWeight: 3,
                editable: isEditing,
                zIndex: 2,
              }}
              onLoad={onPolygonLoad}
            />
          )}

          {/* Zone name label at centroid — large & bold */}
          {!isDrawing && centroid && zoneName && (
            <MarkerF
              position={centroid}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
              label={{
                text: zoneName,
                color: color,
                fontSize: "16px",
                fontWeight: "800",
              }}
              clickable={false}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

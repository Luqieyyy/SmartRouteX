"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { getLivePositions, getAssignedParcelPoints, type LiveRiderPosition } from "@/services/tracking";

/* Leaflet is client-only — dynamic import avoids SSR issues */
import dynamic from "next/dynamic";
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

const DEFAULT_CENTER: [number, number] = [3.139, 101.6869]; // KL

interface ParcelPoint {
  id: number;
  barcode: string;
  lat: number;
  lng: number;
  zone: string | null;
}

export default function TrackingPage() {
  const [riders, setRiders] = useState<LiveRiderPosition[]>([]);
  const [parcels, setParcels] = useState<ParcelPoint[]>([]);
  const [showRiders, setShowRiders] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([getLivePositions(), getAssignedParcelPoints()]);
      setRiders(r);
      setParcels(p);
    } catch {
      /* fallback: keep previous data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Live Tracking</h1>
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
        </div>
      </div>

      <div className="border border-gray-200 bg-white" style={{ height: "calc(100vh - 200px)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Loading map data...
          </div>
        ) : (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showRiders &&
              riders.map((r) => (
                <Marker key={`rider-${r.rider_id}`} position={[r.lat, r.lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{r.rider_name}</p>
                      <p className="text-gray-500">Parcels: {r.assigned_parcels}</p>
                      <p className="text-gray-400">{r.recorded_at}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {showParcels &&
              parcels.map((p) => (
                <Marker key={`parcel-${p.id}`} position={[p.lat, p.lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-mono font-semibold">{p.barcode}</p>
                      <p className="text-gray-500">{p.zone ?? "No zone"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

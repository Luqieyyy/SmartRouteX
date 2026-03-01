/* ──────────────────────────────────────────────
   SmartRouteX — Shared Google Maps Loader
   
   Single source of truth for loading the Google Maps
   JavaScript API. All components must use this hook
   instead of calling useLoadScript directly. This
   ensures the script is loaded exactly ONCE with the
   full set of libraries (drawing + geometry).
   ────────────────────────────────────────────── */

import { useLoadScript, type Libraries } from "@react-google-maps/api";

/**
 * Stable module-level reference — must never be re-created
 * or useLoadScript will think the config changed.
 */
const LIBRARIES: Libraries = ["drawing", "geometry"];

/**
 * Drop-in replacement for useLoadScript.
 * Always loads drawing + geometry libraries so every
 * component shares the same <script> tag.
 */
export function useGoogleMaps(apiKey: string) {
  return useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
}

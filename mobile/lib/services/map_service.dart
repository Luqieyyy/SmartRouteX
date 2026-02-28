import 'dart:math';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../models/parcel.dart';

/// Handles all Google Maps logic — markers, polylines, geocoding, camera.
/// Keeps UI layer clean by encapsulating map operations.
class MapService {
  // ───────────────────── Dummy Parcels ─────────────────────
  /// Hardcoded parcel list for development/testing.
  static List<Parcel> getDummyParcels() => const [
        Parcel(
          id: 1,
          barcode: 'SRX-001',
          trackingNo: 'TRK-1001',
          recipientName: 'Ahmad Bin Ismail',
          recipientPhone: '0171234567',
          rawAddress: 'Taman Universiti, Skudai',
          recipientLat: 1.5364,
          recipientLng: 103.6372,
          zone: 'Skudai',
          priority: 'EXPRESS',
          status: 'ASSIGNED',
        ),
        Parcel(
          id: 2,
          barcode: 'SRX-002',
          trackingNo: 'TRK-1002',
          recipientName: 'Siti Aminah',
          recipientPhone: '0129876543',
          rawAddress: 'Taman Mutiara Rini, Skudai',
          recipientLat: 1.5455,
          recipientLng: 103.6518,
          zone: 'Skudai',
          priority: 'NORMAL',
          status: 'ASSIGNED',
        ),
        Parcel(
          id: 3,
          barcode: 'SRX-003',
          trackingNo: 'TRK-1003',
          recipientName: 'Lee Wei Ming',
          recipientPhone: '0167890123',
          rawAddress: 'Taman Sutera Utama, Skudai',
          recipientLat: 1.5281,
          recipientLng: 103.6661,
          zone: 'Skudai',
          priority: 'NORMAL',
          status: 'IN_TRANSIT',
        ),
        Parcel(
          id: 4,
          barcode: 'SRX-004',
          trackingNo: 'TRK-1004',
          recipientName: 'Raj Kumar',
          recipientPhone: '0143456789',
          rawAddress: 'Bukit Indah, Johor Bahru',
          recipientLat: 1.5701,
          recipientLng: 103.6561,
          zone: 'Bukit Indah',
          priority: 'EXPRESS',
          status: 'ASSIGNED',
        ),
        Parcel(
          id: 5,
          barcode: 'SRX-005',
          trackingNo: 'TRK-1005',
          recipientName: 'Nurul Huda',
          recipientPhone: '0187654321',
          rawAddress: 'Taman Nusa Bestari, Johor Bahru',
          recipientLat: 1.5553,
          recipientLng: 103.6745,
          zone: 'Nusa Bestari',
          priority: 'NORMAL',
          status: 'ASSIGNED',
        ),
      ];

  // ───────────────────── Current Location ─────────────────────

  /// Returns device position or `null` if permissions denied / service off.
  static Future<Position?> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied) return null;
    }
    if (perm == LocationPermission.deniedForever) return null;

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  // ───────────────────── Markers ─────────────────────

  /// Builds a rider location marker (blue).
  static Marker buildRiderMarker(LatLng position) {
    return Marker(
      markerId: const MarkerId('rider'),
      position: position,
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      infoWindow: const InfoWindow(title: 'You', snippet: 'Current location'),
    );
  }

  /// Builds markers for a list of parcels with numbered labels.
  static Set<Marker> buildParcelMarkers(
    List<Parcel> parcels, {
    void Function(Parcel)? onTap,
  }) {
    final markers = <Marker>{};
    for (int i = 0; i < parcels.length; i++) {
      final p = parcels[i];
      if (!p.hasGps) continue;

      markers.add(
        Marker(
          markerId: MarkerId('parcel_${p.id}'),
          position: LatLng(p.recipientLat!, p.recipientLng!),
          icon: p.isExpress
              ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed)
              : BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueOrange),
          infoWindow: InfoWindow(
            title: '${i + 1}. ${p.recipientName ?? 'Unknown'}',
            snippet: p.rawAddress ?? p.zone ?? '',
          ),
          onTap: onTap != null ? () => onTap(p) : null,
        ),
      );
    }
    return markers;
  }

  // ───────────────────── Polyline ─────────────────────

  /// Creates a route polyline connecting parcels in order.
  /// If rider is close (< 30km), starts from rider; otherwise just parcels.
  static Polyline buildRoutePolyline(
    LatLng riderPosition,
    List<Parcel> parcels,
  ) {
    final points = <LatLng>[];

    // Only include rider in polyline if they're reasonably close to parcels
    if (_isRiderNearParcels(riderPosition, parcels)) {
      points.add(riderPosition);
    }

    for (final p in parcels) {
      if (p.hasGps) {
        points.add(LatLng(p.recipientLat!, p.recipientLng!));
      }
    }

    return Polyline(
      polylineId: const PolylineId('route'),
      points: points,
      color: Colors.blue.shade700,
      width: 4,
      patterns: [PatternItem.dash(20), PatternItem.gap(10)],
    );
  }

  // ───────────────────── Camera ─────────────────────

  /// Computes a camera bounds that fits all parcels.
  /// Only includes rider position if they're within ~30km of parcel cluster.
  static LatLngBounds computeBounds(
    LatLng riderPosition,
    List<Parcel> parcels,
  ) {
    final gps = parcels.where((p) => p.hasGps).toList();
    if (gps.isEmpty) {
      // No parcels with GPS — just show rider area
      return LatLngBounds(
        southwest: LatLng(riderPosition.latitude - 0.01, riderPosition.longitude - 0.01),
        northeast: LatLng(riderPosition.latitude + 0.01, riderPosition.longitude + 0.01),
      );
    }

    double minLat = gps.first.recipientLat!;
    double maxLat = gps.first.recipientLat!;
    double minLng = gps.first.recipientLng!;
    double maxLng = gps.first.recipientLng!;

    for (final p in gps) {
      minLat = min(minLat, p.recipientLat!);
      maxLat = max(maxLat, p.recipientLat!);
      minLng = min(minLng, p.recipientLng!);
      maxLng = max(maxLng, p.recipientLng!);
    }

    // Include rider only if close to the parcel cluster
    if (_isRiderNearParcels(riderPosition, parcels)) {
      minLat = min(minLat, riderPosition.latitude);
      maxLat = max(maxLat, riderPosition.latitude);
      minLng = min(minLng, riderPosition.longitude);
      maxLng = max(maxLng, riderPosition.longitude);
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  /// Returns the centroid (center point) of a parcel list.
  static LatLng parcelCentroid(List<Parcel> parcels) {
    final gps = parcels.where((p) => p.hasGps).toList();
    if (gps.isEmpty) return const LatLng(1.5500, 103.6500);
    final avgLat = gps.map((p) => p.recipientLat!).reduce((a, b) => a + b) / gps.length;
    final avgLng = gps.map((p) => p.recipientLng!).reduce((a, b) => a + b) / gps.length;
    return LatLng(avgLat, avgLng);
  }

  /// Checks if rider is within ~30km of the parcel centroid.
  static bool _isRiderNearParcels(LatLng rider, List<Parcel> parcels) {
    final centroid = parcelCentroid(parcels);
    final distKm = Geolocator.distanceBetween(
      rider.latitude, rider.longitude,
      centroid.latitude, centroid.longitude,
    ) / 1000;
    return distKm < 30;
  }

  // ───────────────────── Reverse Geocode ─────────────────────

  /// Reverse geocodes a LatLng into a human-readable area name.
  /// Falls back to raw coordinates on failure.
  static Future<String> reverseGeocode(LatLng position) async {
    try {
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (placemarks.isNotEmpty) {
        final pm = placemarks.first;
        final parts = <String>[
          if (pm.subLocality?.isNotEmpty == true) pm.subLocality!,
          if (pm.locality?.isNotEmpty == true) pm.locality!,
          if (pm.administrativeArea?.isNotEmpty == true)
            pm.administrativeArea!,
        ];
        if (parts.isNotEmpty) return parts.join(', ');
      }
    } catch (_) {
      // Fallback below
    }
    return '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
  }
}

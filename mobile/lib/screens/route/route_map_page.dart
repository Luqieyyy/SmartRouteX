import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../config/theme.dart';
import '../../models/parcel.dart';
import '../../services/map_service.dart';

/// Full-screen Google Map showing rider location, parcel markers,
/// route polyline, and reverse-geocoded area name.
class RouteMapPage extends StatefulWidget {
  const RouteMapPage({super.key});

  @override
  State<RouteMapPage> createState() => _RouteMapPageState();
}

class _RouteMapPageState extends State<RouteMapPage> {
  final Completer<GoogleMapController> _controllerCompleter = Completer();
  bool _dataReady = false;
  String? _errorMessage;

  // Map data
  LatLng? _riderPosition;
  String _areaName = '';
  List<Parcel> _parcels = [];
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};

  // Default fallback: center of Skudai/JB parcel area
  static const _fallback = LatLng(1.5500, 103.6500);
  LatLng _initialTarget = _fallback;

  @override
  void initState() {
    super.initState();
    // Pre-compute the parcel centroid so the initial camera is in the right area
    final parcels = MapService.getDummyParcels();
    _initialTarget = MapService.parcelCentroid(parcels);
    _loadData();
  }

  /// Loads rider position, builds markers/polylines, then animates camera.
  Future<void> _loadData() async {
    try {
      // 1. Get rider location
      final pos = await MapService.getCurrentPosition();
      final riderLatLng = pos != null
          ? LatLng(pos.latitude, pos.longitude)
          : _fallback;

      // 2. Load dummy parcels
      final parcels = MapService.getDummyParcels();

      // 3. Build markers
      final parcelMarkers = MapService.buildParcelMarkers(
        parcels,
        onTap: _onParcelTapped,
      );
      final riderMarker = MapService.buildRiderMarker(riderLatLng);

      // 4. Build route polyline
      final polyline = MapService.buildRoutePolyline(riderLatLng, parcels);

      // 5. Reverse geocode rider location
      final area = await MapService.reverseGeocode(riderLatLng);

      if (!mounted) return;

      setState(() {
        _riderPosition = riderLatLng;
        _parcels = parcels;
        _markers = {riderMarker, ...parcelMarkers};
        _polylines = {polyline};
        _areaName = area;
        _dataReady = true;
      });

      // 6. Fit camera after data + controller are both ready
      await _fitBoundsWhenReady();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Failed to load map: $e';
      });
    }
  }

  /// Waits for both [_controllerCompleter] and data, then animates the camera.
  Future<void> _fitBoundsWhenReady() async {
    if (_riderPosition == null || _parcels.isEmpty) return;

    final controller = await _controllerCompleter.future;

    // Critical: let the map finish its first layout frame before animating.
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    final bounds = MapService.computeBounds(_riderPosition!, _parcels);
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 64),
    );
  }

  /// Zooms to fit all markers (rider + parcels).
  Future<void> _fitBounds() async {
    if (_riderPosition == null || _parcels.isEmpty) return;
    if (!_controllerCompleter.isCompleted) return;

    final controller = await _controllerCompleter.future;
    final bounds = MapService.computeBounds(_riderPosition!, _parcels);
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 64),
    );
  }

  void _onParcelTapped(Parcel parcel) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _ParcelInfoSheet(parcel: parcel),
    );
  }

  Future<void> _recenterCamera() async {
    if (_riderPosition == null || !_controllerCompleter.isCompleted) return;
    final controller = await _controllerCompleter.future;
    await controller.animateCamera(
      CameraUpdate.newLatLngZoom(_riderPosition!, 14),
    );
  }

  @override
  void dispose() {
    if (_controllerCompleter.isCompleted) {
      _controllerCompleter.future.then((c) => c.dispose());
    }
    super.dispose();
  }

  // ───────────────────── Build ─────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Route Map'),
        actions: [
          if (_areaName.isNotEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 14,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _areaName,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: !_dataReady
          ? null
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Fit all markers
                FloatingActionButton.small(
                  heroTag: 'fitAll',
                  onPressed: _fitBounds,
                  backgroundColor: AppTheme.surface,
                  child: const Icon(Icons.zoom_out_map, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                // Re-center on rider
                FloatingActionButton.small(
                  heroTag: 'recenter',
                  onPressed: _recenterCamera,
                  backgroundColor: AppTheme.primary,
                  child: const Icon(Icons.my_location, color: Colors.white),
                ),
              ],
            ),
    );
  }

  Widget _buildBody() {
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _errorMessage = null;
                  });
                  _loadData();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    // Always keep GoogleMap in the tree so the controller initialises early.
    return Stack(
      children: [
        // Google Map — always mounted
        GoogleMap(
          initialCameraPosition: CameraPosition(
            target: _initialTarget,
            zoom: 13,
          ),
          markers: _markers,
          polylines: _polylines,
          myLocationEnabled: false,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
          onMapCreated: (controller) {
            if (!_controllerCompleter.isCompleted) {
              _controllerCompleter.complete(controller);
            }
            // If data was ready before the controller, fit now.
            if (_dataReady) _fitBoundsWhenReady();
          },
        ),

        // Loading overlay
        if (!_dataReady)
          Container(
            color: Colors.white70,
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Locating you & loading parcels…'),
                ],
              ),
            ),
          ),

        // Delivery summary chip
        if (_dataReady)
          Positioned(
            bottom: 16,
            left: 16,
            right: 72,
            child: _DeliverySummaryCard(parcels: _parcels),
          ),
      ],
    );
  }
}

// ───────────────────── Parcel Info Bottom Sheet ─────────────────────

class _ParcelInfoSheet extends StatelessWidget {
  final Parcel parcel;

  const _ParcelInfoSheet({required this.parcel});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Parcel header
          Row(
            children: [
              Icon(
                Icons.inventory_2,
                color: parcel.isExpress ? AppTheme.error : AppTheme.warning,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  parcel.barcode,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (parcel.isExpress)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'EXPRESS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.error,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          _infoRow(Icons.person, parcel.recipientName ?? 'Unknown'),
          const SizedBox(height: 6),
          _infoRow(Icons.phone, parcel.recipientPhone ?? '—'),
          const SizedBox(height: 6),
          _infoRow(Icons.place, parcel.rawAddress ?? parcel.zone ?? '—'),
          const SizedBox(height: 6),
          _infoRow(Icons.local_shipping, 'Status: ${parcel.status}'),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

// ───────────────────── Delivery Summary Card ─────────────────────

class _DeliverySummaryCard extends StatelessWidget {
  final List<Parcel> parcels;

  const _DeliverySummaryCard({required this.parcels});

  @override
  Widget build(BuildContext context) {
    final express = parcels.where((p) => p.isExpress).length;
    final normal = parcels.length - express;

    return Card(
      elevation: 4,
      shadowColor: Colors.black26,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            const Icon(Icons.route, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${parcels.length} stops',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
            if (express > 0) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '$express express',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 6),
            ],
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.success.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '$normal normal',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../config/api_config.dart';
import 'api_client.dart';

/// GPS tracking service — foreground + periodic uploads.
class LocationService {
  final Dio _dio = ApiClient().dio;

  StreamSubscription<Position>? _subscription;
  bool _tracking = false;

  bool get isTracking => _tracking;

  /// Request permissions, then start tracking.
  Future<bool> startTracking() async {
    final permission = await _checkPermission();
    if (!permission) return false;

    _tracking = true;

    _subscription = Geolocator.getPositionStream(
      locationSettings: AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
        intervalDuration: Duration(seconds: ApiConfig.locationIntervalSec),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'SmartRouteX',
          notificationText: 'Location tracking active',
          enableWakeLock: true,
        ),
      ),
    ).listen(_onPosition);

    return true;
  }

  void stopTracking() {
    _tracking = false;
    _subscription?.cancel();
    _subscription = null;
  }

  Future<Position?> getCurrentPosition() async {
    final permission = await _checkPermission();
    if (!permission) return null;
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  void _onPosition(Position pos) {
    _sendToServer(
      lat: pos.latitude,
      lng: pos.longitude,
      accuracy: pos.accuracy,
      speed: pos.speed,
      heading: pos.heading,
    );
  }

  Future<void> _sendToServer({
    required double lat,
    required double lng,
    double? accuracy,
    double? speed,
    double? heading,
  }) async {
    try {
      await _dio.post('/rider/location', data: {
        'lat': lat,
        'lng': lng,
        'accuracy': accuracy,
        'speed': speed,
        'heading': heading,
        'recorded_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {
      // Silently fail — sync queue handles offline
    }
  }

  Future<bool> _checkPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;

    return true;
  }

  void dispose() {
    stopTracking();
  }
}

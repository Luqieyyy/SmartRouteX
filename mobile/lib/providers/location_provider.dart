import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

class LocationState {
  final bool tracking;
  final double? lat;
  final double? lng;

  const LocationState({this.tracking = false, this.lat, this.lng});
}

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationService _service;

  LocationNotifier(this._service) : super(const LocationState());

  Future<void> startTracking() async {
    final ok = await _service.startTracking();
    state = LocationState(tracking: ok);
  }

  void stopTracking() {
    _service.stopTracking();
    state = const LocationState(tracking: false);
  }

  /// Returns the current Position or null.
  Future<Position?> fetchCurrent() async {
    final pos = await _service.getCurrentPosition();
    if (pos != null) {
      state = LocationState(
        tracking: state.tracking,
        lat: pos.latitude,
        lng: pos.longitude,
      );
    }
    return pos;
  }
}

final locationServiceProvider = Provider((ref) => LocationService());

final locationProvider =
    StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier(ref.read(locationServiceProvider));
});

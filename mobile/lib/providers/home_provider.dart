import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/parcel_service.dart';

/// Home screen summary data.
class HomeState {
  final RiderSummary? summary;
  final bool shiftActive;
  final bool loading;
  final String? error;

  const HomeState({
    this.summary,
    this.shiftActive = false,
    this.loading = false,
    this.error,
  });

  HomeState copyWith({
    RiderSummary? summary,
    bool? shiftActive,
    bool? loading,
    String? error,
  }) {
    return HomeState(
      summary: summary ?? this.summary,
      shiftActive: shiftActive ?? this.shiftActive,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

class HomeNotifier extends StateNotifier<HomeState> {
  final ParcelService _service;

  HomeNotifier(this._service) : super(const HomeState());

  Future<void> load() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final profile = await _service.getProfile();
      state = HomeState(
        summary: profile.summary,
        shiftActive: profile.rider.shiftActive,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> toggleShift() async {
    final newValue = !state.shiftActive;
    state = state.copyWith(shiftActive: newValue);
    try {
      await _service.updateProfile({'shift_active': newValue});
    } catch (_) {
      state = state.copyWith(shiftActive: !newValue);
    }
  }
}

final homeProvider = StateNotifierProvider<HomeNotifier, HomeState>((ref) {
  return HomeNotifier(ParcelService());
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/route_suggestion.dart';
import '../services/route_service.dart';

class RouteState {
  final RouteSuggestion? suggestion;
  final String strategy;
  final bool loading;
  final String? error;

  const RouteState({
    this.suggestion,
    this.strategy = 'balanced',
    this.loading = false,
    this.error,
  });

  RouteState copyWith({
    RouteSuggestion? suggestion,
    String? strategy,
    bool? loading,
    String? error,
  }) {
    return RouteState(
      suggestion: suggestion ?? this.suggestion,
      strategy: strategy ?? this.strategy,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

class RouteNotifier extends StateNotifier<RouteState> {
  final RouteService _service;

  RouteNotifier(this._service) : super(const RouteState());

  void setStrategy(String strategy) {
    state = state.copyWith(strategy: strategy);
  }

  Future<void> suggest({
    required List<int> parcelIds,
    required double startLat,
    required double startLng,
  }) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _service.suggest(
        parcelIds: parcelIds,
        strategy: state.strategy,
        startLat: startLat,
        startLng: startLng,
      );
      state = state.copyWith(suggestion: result, loading: false);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  void clear() {
    state = const RouteState();
  }
}

final routeProvider = StateNotifierProvider<RouteNotifier, RouteState>((ref) {
  return RouteNotifier(RouteService());
});

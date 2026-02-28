import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/parcel.dart';
import '../services/parcel_service.dart';

/// State for the parcels list screen.
class ParcelsState {
  final List<Parcel> parcels;
  final bool loading;
  final String? error;
  final String activeTab;

  const ParcelsState({
    this.parcels = const [],
    this.loading = false,
    this.error,
    this.activeTab = 'ASSIGNED',
  });

  ParcelsState copyWith({
    List<Parcel>? parcels,
    bool? loading,
    String? error,
    String? activeTab,
  }) {
    return ParcelsState(
      parcels: parcels ?? this.parcels,
      loading: loading ?? this.loading,
      error: error,
      activeTab: activeTab ?? this.activeTab,
    );
  }
}

class ParcelsNotifier extends StateNotifier<ParcelsState> {
  final ParcelService _service;

  ParcelsNotifier(this._service) : super(const ParcelsState());

  Future<void> load({String? status, String? query}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final tab = status ?? state.activeTab;
      final parcels = await _service.getParcels(status: tab, query: query);
      state = state.copyWith(
        parcels: parcels,
        loading: false,
        activeTab: tab,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<Parcel?> claim(String barcode) async {
    try {
      final parcel = await _service.claimParcel(barcode);
      await load();
      return parcel;
    } catch (_) {
      rethrow;
    }
  }

  Future<Parcel?> scan(String barcode, String type) async {
    try {
      final parcel = await _service.scanParcel(barcode, type);
      await load();
      return parcel;
    } catch (_) {
      rethrow;
    }
  }

  Future<void> uploadPod(
    int parcelId,
    String photoPath, {
    String? notes,
    double? lat,
    double? lng,
  }) async {
    await _service.uploadPod(
      parcelId: parcelId,
      image: File(photoPath),
      note: notes,
      lat: lat,
      lng: lng,
    );
    await load();
  }

  Future<void> markFailed(int parcelId, String reason) async {
    await _service.markFailed(parcelId: parcelId, reason: reason);
    await load();
  }

  void setTab(String tab) {
    load(status: tab);
  }
}

final parcelServiceProvider = Provider((ref) => ParcelService());

final parcelsProvider =
    StateNotifierProvider<ParcelsNotifier, ParcelsState>((ref) {
  return ParcelsNotifier(ref.read(parcelServiceProvider));
});

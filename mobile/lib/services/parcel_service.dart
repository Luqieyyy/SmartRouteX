import 'dart:io';

import 'package:dio/dio.dart';
import '../models/parcel.dart';
import '../models/delivery_attempt.dart';
import '../models/rider.dart';
import 'api_client.dart';

/// Summary counters for rider's current day.
class RiderSummary {
  final int assigned;
  final int inTransit;
  final int delivered;
  final int failed;

  const RiderSummary({
    required this.assigned,
    required this.inTransit,
    required this.delivered,
    required this.failed,
  });

  factory RiderSummary.fromJson(Map<String, dynamic> json) => RiderSummary(
        assigned: json['assigned'] as int? ?? 0,
        inTransit: json['inTransit'] as int? ?? 0,
        delivered: json['delivered'] as int? ?? 0,
        failed: json['failed'] as int? ?? 0,
      );

  int get total => assigned + inTransit + delivered + failed;
}

/// Profile response combining rider data and summary.
class ProfileResponse {
  final Rider rider;
  final RiderSummary summary;

  const ProfileResponse({required this.rider, required this.summary});

  factory ProfileResponse.fromJson(Map<String, dynamic> json) =>
      ProfileResponse(
        rider: Rider.fromJson(json['rider'] as Map<String, dynamic>),
        summary:
            RiderSummary.fromJson(json['summary'] as Map<String, dynamic>),
      );
}

/// Parcel and rider operations service.
class ParcelService {
  final Dio _dio = ApiClient().dio;

  /// GET /rider/profile
  Future<ProfileResponse> getProfile() async {
    final res = await _dio.get('/rider/profile');
    return ProfileResponse.fromJson(res.data as Map<String, dynamic>);
  }

  /// PATCH /rider/profile
  Future<void> updateProfile(Map<String, dynamic> data) async {
    await _dio.patch('/rider/profile', data: data);
  }

  /// GET /rider/parcels
  Future<List<Parcel>> getParcels({String? status, String? query}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    if (query != null && query.isNotEmpty) params['q'] = query;

    final res = await _dio.get('/rider/parcels', queryParameters: params);
    final data = res.data as Map<String, dynamic>;
    final items = data['data'] as List;
    return items
        .map((e) => Parcel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /rider/parcels/claim
  Future<Parcel> claimParcel(String barcode) async {
    final res = await _dio.post('/rider/parcels/claim', data: {
      'barcode': barcode,
    });
    final data = res.data as Map<String, dynamic>;
    return Parcel.fromJson(data['parcel'] as Map<String, dynamic>);
  }

  /// POST /rider/parcels/scan
  Future<Parcel> scanParcel(String barcode, String scanType) async {
    final res = await _dio.post('/rider/parcels/scan', data: {
      'barcode': barcode,
      'scan_type': scanType,
    });
    final data = res.data as Map<String, dynamic>;
    return Parcel.fromJson(data['parcel'] as Map<String, dynamic>);
  }

  /// POST /rider/parcels/{id}/pod
  Future<DeliveryAttempt> uploadPod({
    required int parcelId,
    required File image,
    String? note,
    double? lat,
    double? lng,
  }) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(image.path),
      if (note != null) 'note': note,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      'delivered_at': DateTime.now().toIso8601String(),
    });

    final res = await _dio.post(
      '/rider/parcels/$parcelId/pod',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    final data = res.data as Map<String, dynamic>;
    return DeliveryAttempt.fromJson(data['attempt'] as Map<String, dynamic>);
  }

  /// POST /rider/parcels/{id}/fail
  Future<DeliveryAttempt> markFailed({
    required int parcelId,
    required String reason,
    String? note,
    double? lat,
    double? lng,
  }) async {
    final res = await _dio.post('/rider/parcels/$parcelId/fail', data: {
      'reason': reason,
      if (note != null) 'note': note,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      'attempted_at': DateTime.now().toIso8601String(),
    });
    final data = res.data as Map<String, dynamic>;
    return DeliveryAttempt.fromJson(data['attempt'] as Map<String, dynamic>);
  }
}

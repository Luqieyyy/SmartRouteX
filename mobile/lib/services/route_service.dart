import 'package:dio/dio.dart';
import '../models/route_suggestion.dart';
import 'api_client.dart';

/// Route optimization service.
class RouteService {
  final Dio _dio = ApiClient().dio;

  /// POST /rider/route/suggest
  Future<RouteSuggestion> suggest({
    required List<int> parcelIds,
    required String strategy,
    required double startLat,
    required double startLng,
    double? weightDistance,
    double? weightPriority,
  }) async {
    final body = <String, dynamic>{
      'parcel_ids': parcelIds,
      'strategy': strategy,
      'start_lat': startLat,
      'start_lng': startLng,
    };

    if (weightDistance != null || weightPriority != null) {
      body['weights'] = {
        if (weightDistance != null) 'distance': weightDistance,
        if (weightPriority != null) 'priority': weightPriority,
      };
    }

    final res = await _dio.post('/rider/route/suggest', data: body);
    return RouteSuggestion.fromJson(res.data as Map<String, dynamic>);
  }
}

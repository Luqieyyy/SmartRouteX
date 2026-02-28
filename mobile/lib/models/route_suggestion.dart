class RouteStop {
  final int stopOrder;
  final int parcelId;
  final String barcode;
  final String? recipient;
  final String? address;
  final String? zone;
  final String priority;
  final double? lat;
  final double? lng;
  final double? distanceKm;

  const RouteStop({
    required this.stopOrder,
    required this.parcelId,
    required this.barcode,
    this.recipient,
    this.address,
    this.zone,
    this.priority = 'NORMAL',
    this.lat,
    this.lng,
    this.distanceKm,
  });

  factory RouteStop.fromJson(Map<String, dynamic> json) => RouteStop(
        stopOrder: json['stop_order'] as int,
        parcelId: json['parcel_id'] as int,
        barcode: json['barcode'] as String,
        recipient: json['recipient'] as String?,
        address: json['address'] as String?,
        zone: json['zone'] as String?,
        priority: json['priority'] as String? ?? 'NORMAL',
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
        distanceKm: (json['distance_km'] as num?)?.toDouble(),
      );
}

class RouteSuggestion {
  final String strategy;
  final int totalStops;
  final double distanceKm;
  final int etaMin;
  final List<RouteStop> stops;

  const RouteSuggestion({
    required this.strategy,
    required this.totalStops,
    required this.distanceKm,
    required this.etaMin,
    required this.stops,
  });

  factory RouteSuggestion.fromJson(Map<String, dynamic> json) =>
      RouteSuggestion(
        strategy: json['strategy'] as String,
        totalStops: json['total_stops'] as int,
        distanceKm: (json['distance_km'] as num).toDouble(),
        etaMin: json['eta_min'] as int,
        stops: (json['stops'] as List)
            .map((e) => RouteStop.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

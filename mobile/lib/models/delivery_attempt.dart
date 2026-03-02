class DeliveryAttempt {
  final int id;
  final int parcelId;
  final int? riderId;
  final String result;
  final String? note;
  final String? podImageUrl;
  final double? lat;
  final double? lng;
  final String? attemptedAt;
  final String? riderName;

  const DeliveryAttempt({
    required this.id,
    required this.parcelId,
    this.riderId,
    required this.result,
    this.note,
    this.podImageUrl,
    this.lat,
    this.lng,
    this.attemptedAt,
    this.riderName,
  });

  factory DeliveryAttempt.fromJson(Map<String, dynamic> json) =>
      DeliveryAttempt(
        id: json['id'] as int,
        parcelId: json['parcel_id'] as int,
        riderId: json['rider_id'] as int?,
        result: json['result'] as String,
        note: json['note'] as String?,
        podImageUrl: json['pod_image_url'] as String?,
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
        attemptedAt: json['attempted_at'] as String?,
        riderName: json['rider'] != null
            ? (json['rider'] as Map<String, dynamic>)['name'] as String?
            : null,
      );

  bool get isDelivered => result == 'DELIVERED';
  bool get isFailed => result == 'FAILED';
  bool get hasLocation => lat != null && lng != null;
  bool get hasPodImage => podImageUrl != null && podImageUrl!.isNotEmpty;
}

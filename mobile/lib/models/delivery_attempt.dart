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
      );
}

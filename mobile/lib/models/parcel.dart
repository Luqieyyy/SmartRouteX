class Parcel {
  final int id;
  final String barcode;
  final String? trackingNo;
  final String? recipientName;
  final String? recipientPhone;
  final String? rawAddress;
  final double? recipientLat;
  final double? recipientLng;
  final String? zone;
  final String priority;
  final String status;
  final int? assignedRiderId;
  final String? assignedAt;
  final String? createdAt;

  const Parcel({
    required this.id,
    required this.barcode,
    this.trackingNo,
    this.recipientName,
    this.recipientPhone,
    this.rawAddress,
    this.recipientLat,
    this.recipientLng,
    this.zone,
    this.priority = 'NORMAL',
    this.status = 'CREATED',
    this.assignedRiderId,
    this.assignedAt,
    this.createdAt,
  });

  factory Parcel.fromJson(Map<String, dynamic> json) => Parcel(
        id: json['id'] as int,
        barcode: json['barcode'] as String,
        trackingNo: json['tracking_no'] as String?,
        recipientName: json['recipient_name'] as String?,
        recipientPhone: json['recipient_phone'] as String?,
        rawAddress: json['raw_address'] as String?,
        recipientLat: (json['recipient_lat'] as num?)?.toDouble(),
        recipientLng: (json['recipient_lng'] as num?)?.toDouble(),
        zone: json['zone'] as String?,
        priority: json['priority'] as String? ?? 'NORMAL',
        status: json['status'] as String? ?? 'CREATED',
        assignedRiderId: json['assigned_rider_id'] as int?,
        assignedAt: json['assigned_at'] as String?,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'barcode': barcode,
        'tracking_no': trackingNo,
        'recipient_name': recipientName,
        'recipient_phone': recipientPhone,
        'raw_address': rawAddress,
        'recipient_lat': recipientLat,
        'recipient_lng': recipientLng,
        'zone': zone,
        'priority': priority,
        'status': status,
        'assigned_rider_id': assignedRiderId,
      };

  bool get hasGps => recipientLat != null && recipientLng != null;
  bool get isExpress => priority == 'EXPRESS';
}

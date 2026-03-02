class Rider {
  final int id;
  final int? userId;
  final String name;
  final String? phone;
  final String? zone;
  final bool isActive;
  final bool shiftActive;
  final String? createdAt;
  final int? hubId;
  final String? hubName;
  final double? hubLat;
  final double? hubLng;

  const Rider({
    required this.id,
    this.userId,
    required this.name,
    this.phone,
    this.zone,
    this.isActive = true,
    this.shiftActive = false,
    this.createdAt,
    this.hubId,
    this.hubName,
    this.hubLat,
    this.hubLng,
  });

  factory Rider.fromJson(Map<String, dynamic> json) {
    // Hub data may come as flat keys (login/me) or nested object (profile)
    final hub = json['hub'] as Map<String, dynamic>?;
    
    return Rider(
      id: json['id'] as int,
      userId: json['user_id'] as int?,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      zone: json['zone'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      shiftActive: json['shift_active'] as bool? ?? false,
      createdAt: json['created_at'] as String?,
      hubId: json['hub_id'] as int?,
      hubName: json['hub_name'] as String? ?? hub?['name'] as String?,
      hubLat: (json['hub_lat'] as num?)?.toDouble() ?? (hub?['latitude'] as num?)?.toDouble(),
      hubLng: (json['hub_lng'] as num?)?.toDouble() ?? (hub?['longitude'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'name': name,
        'phone': phone,
        'zone': zone,
        'is_active': isActive,
        'shift_active': shiftActive,
        'hub_id': hubId,
        'hub_name': hubName,
        'hub_lat': hubLat,
        'hub_lng': hubLng,
      };

  /// Whether hub GPS coordinates are available.
  bool get hasHubLocation => hubLat != null && hubLng != null;
}

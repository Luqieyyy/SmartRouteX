class Rider {
  final int id;
  final int? userId;
  final String name;
  final String? phone;
  final String? zone;
  final bool isActive;
  final bool shiftActive;
  final String? createdAt;

  const Rider({
    required this.id,
    this.userId,
    required this.name,
    this.phone,
    this.zone,
    this.isActive = true,
    this.shiftActive = false,
    this.createdAt,
  });

  factory Rider.fromJson(Map<String, dynamic> json) => Rider(
        id: json['id'] as int,
        userId: json['user_id'] as int?,
        name: json['name'] as String,
        phone: json['phone'] as String?,
        zone: json['zone'] as String?,
        isActive: json['is_active'] as bool? ?? true,
        shiftActive: json['shift_active'] as bool? ?? false,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'name': name,
        'phone': phone,
        'zone': zone,
        'is_active': isActive,
        'shift_active': shiftActive,
      };
}

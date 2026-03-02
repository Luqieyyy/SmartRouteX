import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/parcel.dart';
import 'status_badge.dart';

/// Parcel list tile with inline action buttons.
class ParcelTile extends StatelessWidget {
  final Parcel parcel;
  final VoidCallback? onTap;
  final VoidCallback? onPod;
  final VoidCallback? onUpdateLocation;

  const ParcelTile({
    super.key,
    required this.parcel,
    this.onTap,
    this.onPod,
    this.onUpdateLocation,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          border: Border.all(
            color: parcel.isExpress
                ? AppTheme.primary.withValues(alpha: 0.3)
                : AppTheme.border,
          ),
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: barcode + status + priority
            Row(
              children: [
                // Priority indicator
                Container(
                  width: 4,
                  height: 36,
                  decoration: BoxDecoration(
                    color: parcel.isExpress ? AppTheme.primary : AppTheme.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              parcel.barcode,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                                fontFamily: 'monospace',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          StatusBadge(status: parcel.status),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        parcel.recipientName ?? 'No recipient',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (parcel.rawAddress != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          parcel.rawAddress!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),

            // Bottom row: action buttons
            if (parcel.isInTransit || parcel.isAssigned) ...[
              const SizedBox(height: 10),
              const Divider(height: 1, color: AppTheme.border),
              const SizedBox(height: 8),
              Row(
                children: [
                  // GPS indicator
                  Icon(
                    parcel.hasGps ? Icons.gps_fixed : Icons.gps_off,
                    size: 14,
                    color: parcel.hasGps
                        ? AppTheme.success
                        : AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    parcel.hasGps ? 'GPS' : 'No GPS',
                    style: TextStyle(
                      fontSize: 10,
                      color: parcel.hasGps
                          ? AppTheme.success
                          : AppTheme.textSecondary,
                    ),
                  ),
                  const Spacer(),

                  // Update Location button
                  if (onUpdateLocation != null)
                    _ActionChip(
                      icon: Icons.my_location,
                      label: 'Location',
                      color: Colors.blue.shade600,
                      onTap: onUpdateLocation!,
                    ),
                  const SizedBox(width: 6),

                  // POD button
                  if (onPod != null && parcel.isInTransit)
                    _ActionChip(
                      icon: Icons.camera_alt_outlined,
                      label: 'POD',
                      color: AppTheme.primary,
                      onTap: onPod!,
                    ),
                  const SizedBox(width: 6),

                  // View details chevron
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.chevron_right,
                      size: 16,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    parcel.hasGps ? Icons.gps_fixed : Icons.gps_off,
                    size: 14,
                    color: parcel.hasGps
                        ? AppTheme.success
                        : AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.chevron_right,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

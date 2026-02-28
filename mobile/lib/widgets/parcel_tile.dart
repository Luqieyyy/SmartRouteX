import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/parcel.dart';
import 'status_badge.dart';

/// Parcel list tile — compact row for scrollable lists.
class ParcelTile extends StatelessWidget {
  final Parcel parcel;
  final VoidCallback? onTap;

  const ParcelTile({super.key, required this.parcel, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppTheme.border)),
        ),
        child: Row(
          children: [
            // Priority indicator
            Container(
              width: 4,
              height: 40,
              decoration: BoxDecoration(
                color: parcel.isExpress ? AppTheme.primary : AppTheme.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        parcel.barcode,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                          fontFamily: 'monospace',
                        ),
                      ),
                      const SizedBox(width: 8),
                      StatusBadge(status: parcel.status),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    parcel.recipientName ?? 'No recipient',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (parcel.rawAddress != null) ...[
                    const SizedBox(height: 1),
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

            // GPS verification indicator
            Icon(
              parcel.hasGps ? Icons.gps_fixed : Icons.gps_off,
              size: 16,
              color: parcel.hasGps ? AppTheme.success : AppTheme.textSecondary,
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right,
              size: 18,
              color: AppTheme.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

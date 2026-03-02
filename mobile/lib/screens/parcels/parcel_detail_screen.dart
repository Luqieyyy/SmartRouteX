import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/api_config.dart';
import '../../models/parcel.dart';
import '../../providers/parcel_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/status_badge.dart';

class ParcelDetailScreen extends ConsumerStatefulWidget {
  final String parcelId;
  const ParcelDetailScreen({super.key, required this.parcelId});

  @override
  ConsumerState<ParcelDetailScreen> createState() =>
      _ParcelDetailScreenState();
}

class _ParcelDetailScreenState extends ConsumerState<ParcelDetailScreen> {
  Parcel? _parcel;
  bool _updatingLocation = false;
  bool _markingComplete = false;

  @override
  void initState() {
    super.initState();
    _loadParcel();
  }

  void _loadParcel() {
    final parcels = ref.read(parcelsProvider).parcels;
    final id = int.tryParse(widget.parcelId);
    setState(() {
      _parcel = parcels.where((p) => p.id == id).firstOrNull;
    });
  }

  Future<void> _handleUpdateLocation() async {
    if (_updatingLocation) return;

    setState(() => _updatingLocation = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      final loc =
          await ref.read(locationProvider.notifier).fetchCurrent();
      if (loc == null) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Unable to get GPS location. Please enable location.'),
            backgroundColor: AppTheme.warning,
          ),
        );
        return;
      }

      await ref.read(parcelsProvider.notifier).updateLocation(
            lat: loc.latitude,
            lng: loc.longitude,
            accuracy: loc.accuracy,
          );

      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 16),
              const SizedBox(width: 8),
              Text(
                  'Location updated (${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)})'),
            ],
          ),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed: $e'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _updatingLocation = false);
    }
  }

  Future<void> _handleMarkCompleted() async {
    final p = _parcel;
    if (p == null || _markingComplete) return;

    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Mark as Delivered',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: const Text(
            'Are you sure you want to mark this parcel as delivered?',
            style: TextStyle(fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.success,
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _markingComplete = true);
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);

    try {
      await ref.read(parcelsProvider.notifier).markDelivered(p.barcode);
      messenger.showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Parcel marked as delivered!'),
            ],
          ),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      router.pop();
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed: $e'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _markingComplete = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _parcel;
    if (p == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Parcel')),
        body: const Center(child: Text('Parcel not found')),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Text(
          p.barcode,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
        ),
        actions: [
          if (p.trackingNo != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Text(
                  p.trackingNo!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Status + Priority Header ──
          _StatusHeader(parcel: p),
          const SizedBox(height: 16),

          // ── Action Buttons Row ──
          if (p.isInTransit || p.isAssigned) ...[
            _ActionButtonsRow(
              parcel: p,
              updatingLocation: _updatingLocation,
              markingComplete: _markingComplete,
              onPod: p.isInTransit
                  ? () => context.push('/pod/${p.id}')
                  : null,
              onUpdateLocation: _handleUpdateLocation,
              onMarkCompleted: p.isInTransit ? _handleMarkCompleted : null,
              onScanPickup: p.isAssigned
                  ? () async {
                      await ref
                          .read(parcelsProvider.notifier)
                          .scan(p.barcode, 'PICKUP');
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Parcel picked up!'),
                            backgroundColor: AppTheme.success,
                          ),
                        );
                        context.pop();
                      }
                    }
                  : null,
              onMarkFailed: p.isInTransit
                  ? () => _showFailDialog(p.id)
                  : null,
            ),
            const SizedBox(height: 16),
          ],

          // ── Recipient Section ──
          _Section(
            title: 'RECIPIENT',
            icon: Icons.person_outlined,
            children: [
              _DetailRow('Name', p.recipientName ?? 'N/A'),
              _DetailRow('Phone', p.recipientPhone ?? 'N/A'),
              _DetailRow('Address', p.rawAddress ?? 'N/A'),
              if (p.zone != null) _DetailRow('Zone', p.zone!),
            ],
          ),
          const SizedBox(height: 12),

          // ── Parcel Info Section ──
          _Section(
            title: 'PARCEL DETAILS',
            icon: Icons.inventory_2_outlined,
            children: [
              _DetailRow('Barcode', p.barcode),
              if (p.trackingNo != null)
                _DetailRow('Tracking', p.trackingNo!),
              _DetailRow('Priority', p.priority),
              _DetailRow('Status', p.status.replaceAll('_', ' ')),
              if (p.createdAt != null)
                _DetailRow('Created', _formatDate(p.createdAt!)),
              if (p.assignedAt != null)
                _DetailRow('Assigned', _formatDate(p.assignedAt!)),
            ],
          ),
          const SizedBox(height: 12),

          // ── GPS Info ──
          _Section(
            title: 'LOCATION',
            icon: Icons.location_on_outlined,
            children: [
              _DetailRow(
                'Destination GPS',
                p.hasGps
                    ? '${p.recipientLat!.toStringAsFixed(6)}, ${p.recipientLng!.toStringAsFixed(6)}'
                    : 'Not available',
              ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Delivery History / POD ──
          _DeliveryHistorySection(parcel: p),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showFailDialog(int parcelId) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Mark as Failed',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: TextField(
          controller: reasonCtrl,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Enter failure reason...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              final reason = reasonCtrl.text.trim();
              if (reason.isEmpty) return;
              Navigator.pop(ctx);
              final messenger = ScaffoldMessenger.of(context);
              final router = GoRouter.of(context);
              await ref
                  .read(parcelsProvider.notifier)
                  .markFailed(parcelId, reason);
              messenger.showSnackBar(
                const SnackBar(
                  content: Text('Parcel marked as failed'),
                  backgroundColor: AppTheme.error,
                ),
              );
              router.pop();
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}

// ── Status Header Widget ──
class _StatusHeader extends StatelessWidget {
  final Parcel parcel;
  const _StatusHeader({required this.parcel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _statusGradientStart(parcel.status),
            _statusGradientEnd(parcel.status),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _statusIcon(parcel.status),
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  parcel.status.replaceAll('_', ' '),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _statusDescription(parcel.status),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          if (parcel.isExpress)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bolt, size: 12, color: Colors.white),
                  SizedBox(width: 2),
                  Text(
                    'EXPRESS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          if (parcel.hasGps) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.gps_fixed, size: 14, color: Colors.white),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusGradientStart(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Colors.blue.shade500;
      case 'IN_TRANSIT':
        return Colors.orange.shade500;
      case 'DELIVERED':
        return Colors.green.shade500;
      case 'FAILED':
        return Colors.red.shade500;
      default:
        return Colors.grey.shade500;
    }
  }

  Color _statusGradientEnd(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Colors.blue.shade700;
      case 'IN_TRANSIT':
        return Colors.orange.shade700;
      case 'DELIVERED':
        return Colors.green.shade700;
      case 'FAILED':
        return Colors.red.shade700;
      default:
        return Colors.grey.shade700;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Icons.assignment_outlined;
      case 'IN_TRANSIT':
        return Icons.local_shipping_outlined;
      case 'DELIVERED':
        return Icons.check_circle_outline;
      case 'FAILED':
        return Icons.cancel_outlined;
      default:
        return Icons.inventory_2_outlined;
    }
  }

  String _statusDescription(String status) {
    switch (status) {
      case 'ASSIGNED':
        return 'Parcel assigned, ready for pickup';
      case 'IN_TRANSIT':
        return 'Parcel is being delivered';
      case 'DELIVERED':
        return 'Parcel successfully delivered';
      case 'FAILED':
        return 'Delivery attempt failed';
      default:
        return 'Parcel created';
    }
  }
}

// ── Action Buttons Row ──
class _ActionButtonsRow extends StatelessWidget {
  final Parcel parcel;
  final bool updatingLocation;
  final bool markingComplete;
  final VoidCallback? onPod;
  final VoidCallback? onUpdateLocation;
  final VoidCallback? onMarkCompleted;
  final VoidCallback? onScanPickup;
  final VoidCallback? onMarkFailed;

  const _ActionButtonsRow({
    required this.parcel,
    required this.updatingLocation,
    required this.markingComplete,
    this.onPod,
    this.onUpdateLocation,
    this.onMarkCompleted,
    this.onScanPickup,
    this.onMarkFailed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Primary actions
        Row(
          children: [
            // POD button
            if (onPod != null)
              Expanded(
                child: _ActionButton(
                  icon: Icons.camera_alt_outlined,
                  label: 'Capture POD',
                  color: AppTheme.primary,
                  onTap: onPod!,
                ),
              ),
            // Scan Pickup button
            if (onScanPickup != null)
              Expanded(
                child: _ActionButton(
                  icon: Icons.qr_code_scanner,
                  label: 'Scan Pickup',
                  color: Colors.blue.shade600,
                  onTap: onScanPickup!,
                ),
              ),
            if (onPod != null || onScanPickup != null)
              const SizedBox(width: 8),

            // Update Location
            Expanded(
              child: _ActionButton(
                icon: Icons.my_location,
                label: updatingLocation ? 'Updating...' : 'Update Location',
                color: Colors.blue.shade600,
                outlined: true,
                loading: updatingLocation,
                onTap: onUpdateLocation ?? () {},
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            // Mark Completed
            if (onMarkCompleted != null)
              Expanded(
                child: _ActionButton(
                  icon: Icons.check_circle_outline,
                  label: markingComplete ? 'Processing...' : 'Mark Completed',
                  color: AppTheme.success,
                  loading: markingComplete,
                  onTap: onMarkCompleted!,
                ),
              ),
            if (onMarkCompleted != null && onMarkFailed != null)
              const SizedBox(width: 8),
            // Mark Failed
            if (onMarkFailed != null)
              Expanded(
                child: _ActionButton(
                  icon: Icons.cancel_outlined,
                  label: 'Mark Failed',
                  color: AppTheme.error,
                  outlined: true,
                  onTap: onMarkFailed!,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool outlined;
  final bool loading;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.outlined = false,
    this.loading = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: outlined ? Colors.transparent : color,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: loading ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: outlined
              ? BoxDecoration(
                  border: Border.all(color: color),
                  borderRadius: BorderRadius.circular(8),
                )
              : null,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: outlined ? color : Colors.white,
                  ),
                )
              else
                Icon(icon, size: 16, color: outlined ? color : Colors.white),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: outlined ? color : Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Delivery History Section ──
class _DeliveryHistorySection extends StatelessWidget {
  final Parcel parcel;
  const _DeliveryHistorySection({required this.parcel});

  @override
  Widget build(BuildContext context) {
    if (parcel.deliveryAttempts.isEmpty) {
      return _Section(
        title: 'DELIVERY HISTORY',
        icon: Icons.history,
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No delivery attempts yet',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade400,
                ),
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.history, size: 14, color: AppTheme.textSecondary),
            const SizedBox(width: 6),
            const Text(
              'DELIVERY HISTORY',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
                letterSpacing: 1,
              ),
            ),
            const Spacer(),
            Text(
              '${parcel.deliveryAttempts.length} attempt(s)',
              style: const TextStyle(
                fontSize: 10,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...parcel.deliveryAttempts.map((attempt) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              border: Border.all(
                color: attempt.result == 'DELIVERED'
                    ? Colors.green.shade200
                    : Colors.red.shade200,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusBadge(status: attempt.result),
                    const SizedBox(width: 8),
                    if (attempt.attemptedAt != null)
                      Text(
                        attempt.attemptedAt!,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                  ],
                ),
                if (attempt.note != null && attempt.note!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    attempt.note!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
                if (attempt.lat != null && attempt.lng != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '📍 ${attempt.lat!.toStringAsFixed(6)}, ${attempt.lng!.toStringAsFixed(6)}',
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
                // POD Image
                if (attempt.podImageUrl != null &&
                    attempt.podImageUrl!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'PROOF OF DELIVERY',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: CachedNetworkImage(
                      imageUrl: _buildPodUrl(attempt.podImageUrl!),
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        height: 180,
                        color: Colors.grey.shade100,
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        height: 180,
                        color: Colors.grey.shade100,
                        child: const Center(
                          child: Icon(Icons.broken_image_outlined,
                              color: AppTheme.textSecondary),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ],
    );
  }

  String _buildPodUrl(String url) {
    if (url.startsWith('http')) return url;
    // Build from base URL
    final baseUrl = ApiConfig.baseUrl;
    // Remove /api from base URL to get server root
    final serverRoot = baseUrl.replaceAll('/api', '');
    return '$serverRoot$url';
  }
}

// ── Section Container ──
class _Section extends StatelessWidget {
  final String title;
  final IconData? icon;
  final List<Widget> children;

  const _Section({required this.title, this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: 6),
            ],
            Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            border: Border.all(color: AppTheme.border),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

// ── Detail Row ──
class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

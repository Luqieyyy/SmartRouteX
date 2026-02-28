import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/parcel.dart';
import '../../providers/parcel_provider.dart';
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

  @override
  void initState() {
    super.initState();
    final parcels = ref.read(parcelsProvider).parcels;
    final id = int.tryParse(widget.parcelId);
    _parcel = parcels.where((p) => p.id == id).firstOrNull;
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
        title: Text(p.barcode),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status + Priority row
          Row(
            children: [
              StatusBadge(status: p.status),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _priorityColor(p.priority).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  p.priority.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _priorityColor(p.priority),
                  ),
                ),
              ),
              const Spacer(),
              if (p.hasGps)
                const Row(
                  children: [
                    Icon(Icons.gps_fixed, size: 12, color: AppTheme.success),
                    SizedBox(width: 4),
                    Text('GPS',
                        style: TextStyle(
                            fontSize: 10, color: AppTheme.success)),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Recipient
          _Section(
            title: 'RECIPIENT',
            children: [
              _DetailRow('Name', p.recipientName ?? 'N/A'),
              _DetailRow('Phone', p.recipientPhone ?? 'N/A'),
              _DetailRow('Address', p.rawAddress ?? 'N/A'),
              if (p.zone != null) _DetailRow('Zone', p.zone!),
            ],
          ),
          const SizedBox(height: 16),

          // Parcel Info
          _Section(
            title: 'PARCEL DETAILS',
            children: [
              _DetailRow('Barcode', p.barcode),
              if (p.trackingNo != null)
                _DetailRow('Tracking', p.trackingNo!),
            ],
          ),
          const SizedBox(height: 24),

          // Actions
          if (p.status == 'ASSIGNED') ...[
            SizedBox(
              height: 44,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.qr_code_scanner, size: 18),
                label: const Text('Scan Pickup'),
                onPressed: () async {
                  await ref
                      .read(parcelsProvider.notifier)
                      .scan(p.barcode, 'PICKUP');
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Parcel picked up')),
                    );
                    context.pop();
                  }
                },
              ),
            ),
          ],
          if (p.status == 'IN_TRANSIT') ...[
            SizedBox(
              height: 44,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.check_circle_outlined, size: 18),
                label: const Text('Scan Delivery'),
                onPressed: () async {
                  await ref
                      .read(parcelsProvider.notifier)
                      .scan(p.barcode, 'DELIVERY');
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Parcel delivered')),
                    );
                    context.pop();
                  }
                },
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.camera_alt_outlined, size: 18),
                label: const Text('Capture POD'),
                onPressed: () => context.push('/pod/${p.id}'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('Mark Failed'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.error,
                  side: const BorderSide(color: AppTheme.error),
                ),
                onPressed: () => _showFailDialog(p.id),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showFailDialog(int parcelId) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Failed',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
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
            style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error),
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
                const SnackBar(content: Text('Parcel marked as failed')),
              );
              router.pop();
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Color _priorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'EXPRESS':
        return AppTheme.error;
      case 'HIGH':
        return AppTheme.warning;
      case 'NORMAL':
        return AppTheme.textSecondary;
      case 'LOW':
        return AppTheme.textSecondary;
      default:
        return AppTheme.textSecondary;
    }
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _Section({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppTheme.textSecondary,
            letterSpacing: 1,
          ),
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

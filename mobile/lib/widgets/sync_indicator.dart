import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../providers/sync_provider.dart';

/// Sync status indicator — shows pending queue count.
class SyncIndicator extends ConsumerWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sync = ref.watch(syncProvider);

    if (sync.pendingCount == 0) {
      return const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_done_outlined, size: 16, color: AppTheme.success),
          SizedBox(width: 4),
          Text(
            'Synced',
            style: TextStyle(fontSize: 11, color: AppTheme.success),
          ),
        ],
      );
    }

    return GestureDetector(
      onTap: () => ref.read(syncProvider.notifier).processNow(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (sync.processing)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 1.5),
            )
          else
            const Icon(
              Icons.cloud_upload_outlined,
              size: 16,
              color: AppTheme.warning,
            ),
          const SizedBox(width: 4),
          Text(
            '${sync.pendingCount} pending',
            style: const TextStyle(fontSize: 11, color: AppTheme.warning),
          ),
        ],
      ),
    );
  }
}

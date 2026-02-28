import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/sync_queue.dart';

/// Sync queue provider — exposes pending count and triggers.
class SyncState {
  final int pendingCount;
  final bool processing;

  const SyncState({this.pendingCount = 0, this.processing = false});
}

class SyncNotifier extends StateNotifier<SyncState> {
  final SyncQueue _queue;

  SyncNotifier(this._queue) : super(const SyncState());

  void refresh() {
    state = SyncState(pendingCount: _queue.pendingCount);
  }

  Future<void> processNow() async {
    state = SyncState(pendingCount: _queue.pendingCount, processing: true);
    await _queue.processQueue();
    state = SyncState(pendingCount: _queue.pendingCount, processing: false);
  }

  Future<void> enqueue({
    required String action,
    required String method,
    Map<String, dynamic>? body,
  }) async {
    await _queue.enqueue(action: action, method: method, body: body);
    refresh();
  }
}

final syncQueueProvider = Provider((ref) => SyncQueue());

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  return SyncNotifier(ref.read(syncQueueProvider));
});

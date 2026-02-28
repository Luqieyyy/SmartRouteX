import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../config/api_config.dart';
import 'api_client.dart';

/// Offline-first sync queue. Stores actions in Hive
/// and retries with exponential backoff when online.
class SyncQueue {
  static final SyncQueue instance = SyncQueue._();
  SyncQueue._();

  static const _boxName = 'sync_queue';
  late Box<String> _box;
  Timer? _retryTimer;
  bool _processing = false;
  bool _initialized = false;

  int get pendingCount => _initialized ? _box.length : 0;
  bool get hasPending => _initialized && _box.isNotEmpty;

  Future<void> init() async {
    if (_initialized) return;
    _box = await Hive.openBox<String>(_boxName);
    _initialized = true;
    _startWatching();
  }

  /// Enqueue an action for sync.
  /// [action] is the API endpoint, [method] is GET/POST/PATCH/etc.,
  /// [body] is the request payload.
  Future<void> enqueue({
    required String action,
    required String method,
    Map<String, dynamic>? body,
    int retries = 0,
  }) async {
    if (!_initialized) await init();
    final entry = jsonEncode({
      'action': action,
      'method': method,
      'body': body,
      'retries': retries,
      'created_at': DateTime.now().toIso8601String(),
    });
    await _box.add(entry);
    _scheduleProcess();
  }

  /// Process all queued items.
  Future<void> processQueue() async {
    if (!_initialized || _processing || _box.isEmpty) return;
    _processing = true;

    final keys = _box.keys.toList();
    for (final key in keys) {
      final raw = _box.get(key);
      if (raw == null) continue;

      final entry = jsonDecode(raw) as Map<String, dynamic>;
      final action = entry['action'] as String;
      final method = entry['method'] as String;
      final body = entry['body'] as Map<String, dynamic>?;
      final retries = entry['retries'] as int? ?? 0;

      try {
        final dio = ApiClient().dio;
        switch (method.toUpperCase()) {
          case 'POST':
            await dio.post(action, data: body);
            break;
          case 'PATCH':
            await dio.patch(action, data: body);
            break;
          case 'PUT':
            await dio.put(action, data: body);
            break;
          case 'DELETE':
            await dio.delete(action, data: body);
            break;
        }
        // Success — remove from queue
        await _box.delete(key);
      } catch (e) {
        if (retries >= ApiConfig.maxRetries) {
          // Max retries reached — drop the entry
          await _box.delete(key);
          continue;
        }

        // Increment retry counter
        final updated = Map<String, dynamic>.from(entry);
        updated['retries'] = retries + 1;
        await _box.put(key, jsonEncode(updated));

        // Exponential backoff — stop processing, retry later
        final delay = ApiConfig.retryBaseDelay * (1 << retries);
        _retryTimer?.cancel();
        _retryTimer = Timer(delay, _scheduleProcess);
        break;
      }
    }

    _processing = false;
  }

  void _scheduleProcess() {
    // Debounce: process after 500ms
    _retryTimer?.cancel();
    _retryTimer = Timer(const Duration(milliseconds: 500), processQueue);
  }

  void _startWatching() {
    Connectivity().onConnectivityChanged.listen((result) {
      final hasConnection = result.any((r) => r != ConnectivityResult.none);
      if (hasConnection && hasPending) {
        _scheduleProcess();
      }
    });
  }

  Future<void> clear() async {
    await _box.clear();
  }

  void dispose() {
    _retryTimer?.cancel();
  }
}

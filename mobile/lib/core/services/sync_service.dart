import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive/hive.dart';
import '../api/api_client.dart';

/// Supported offline entities (must match backend SyncService)
const syncEntities = [
  'Attendance',
  'Member',
  'Event',
  'EventAssignment',
  'Swap',
  'Replacement',
  'DisciplineCase',
  'FinanceTransaction',
];

class SyncService {
  SyncService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;
  Box get _queue => Hive.box('sync_queue');

  Future<void> enqueue({
    required String entity,
    required String entityId,
    required Map<String, dynamic> payload,
  }) async {
    if (!syncEntities.contains(entity)) {
      throw ArgumentError('Unsupported sync entity: $entity');
    }
    final item = {
      'entity': entity,
      'entityId': entityId,
      'payload': payload,
      'clientUpdatedAt': DateTime.now().toUtc().toIso8601String(),
    };
    await _queue.add(item);
  }

  Future<SyncResult> syncIfOnline() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      return SyncResult(skipped: true, message: 'Offline');
    }

    final items = _queue.values.toList();
    if (items.isEmpty) {
      return SyncResult(skipped: true, message: 'Queue empty');
    }

    await _client.loadToken();
    final response = await _client.dio.post(
      '/sync/batch',
      data: {
        'items': items.map((raw) {
          final e = Map<String, dynamic>.from(
            jsonDecode(jsonEncode(raw)) as Map,
          );
          return {
            'entity': e['entity'],
            'entityId': e['entityId'],
            'payload': e['payload'],
            'clientUpdatedAt': e['clientUpdatedAt'],
          };
        }).toList(),
      },
    );

    final data = response.data['data'] as Map<String, dynamic>?;
    final results = data?['results'] as List<dynamic>? ?? [];

    final toRemove = <int>[];
    for (var i = 0; i < results.length; i++) {
      if (results[i]['status'] == 'applied') {
        toRemove.add(i);
      }
    }
    for (var i = toRemove.length - 1; i >= 0; i--) {
      await _queue.deleteAt(toRemove[i]);
    }

    final rejected =
        results.where((r) => r['status'] == 'rejected').length;

    return SyncResult(
      applied: results.length - rejected,
      rejected: rejected,
    );
  }

  int get pendingCount => _queue.length;

  List<Map<String, dynamic>> get pendingItems => _queue.values
      .map((e) => Map<String, dynamic>.from(jsonDecode(jsonEncode(e)) as Map))
      .toList();
}

class SyncResult {
  SyncResult({
    this.skipped = false,
    this.applied = 0,
    this.rejected = 0,
    this.message,
  });

  final bool skipped;
  final int applied;
  final int rejected;
  final String? message;
}

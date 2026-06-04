import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Offline cache for MF-3 ministry service lists (metadata only).
class MinistryServicesCache {
  MinistryServicesCache(this._prefs);

  final SharedPreferences _prefs;

  static const _prefix = 'mf3_ministry_';

  String _key(String ministryId, String bucket) => '$_prefix${ministryId}_$bucket';

  Future<void> saveList(
    String ministryId,
    String bucket,
    List<Map<String, dynamic>> rows,
  ) async {
    await _prefs.setString(
      _key(ministryId, bucket),
      jsonEncode({'savedAt': DateTime.now().toIso8601String(), 'rows': rows}),
    );
  }

  List<Map<String, dynamic>>? readList(String ministryId, String bucket) {
    final raw = _prefs.getString(_key(ministryId, bucket));
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final rows = decoded['rows'] as List<dynamic>? ?? [];
      return rows.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return null;
    }
  }
}

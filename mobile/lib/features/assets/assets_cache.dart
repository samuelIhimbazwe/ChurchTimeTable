import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Offline cache for MF-4 assets (list + assignments + maintenance summaries).
class AssetsCache {
  static const _assetsKey = 'mf4_assets_cache';
  static const _assignmentsKey = 'mf4_asset_assignments_cache';
  static const _maintenanceKey = 'mf4_asset_maintenance_cache';

  Future<void> saveAssets(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_assetsKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadAssets() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_assetsKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveAssignments(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_assignmentsKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadAssignments() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_assignmentsKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveMaintenance(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_maintenanceKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadMaintenance() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_maintenanceKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }
}

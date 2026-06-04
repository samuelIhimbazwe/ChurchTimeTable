import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class ProtocolCache {
  static const _dashboardKey = 'protocol_dashboard_cache';
  static const _assignmentsKey = 'protocol_assignments_cache';

  Future<void> saveDashboard(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_dashboardKey, jsonEncode(data));
  }

  Future<Map<String, dynamic>?> loadDashboard() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_dashboardKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveAssignments(List<dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_assignmentsKey, jsonEncode(data));
  }

  Future<List<dynamic>?> loadAssignments() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_assignmentsKey);
    if (raw == null) return null;
    return jsonDecode(raw) as List<dynamic>;
  }
}

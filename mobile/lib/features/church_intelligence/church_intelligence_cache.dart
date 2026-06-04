import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class ChurchIntelligenceCache {
  static const _summaryKey = 'mf6_church_health_summary';
  static const _alertsKey = 'mf6_governance_alerts';
  static const _reportsKey = 'mf6_church_reports';

  Future<void> saveSummary(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_summaryKey, jsonEncode(data));
  }

  Future<Map<String, dynamic>?> loadSummary() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_summaryKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveAlerts(List<dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_alertsKey, jsonEncode(data));
  }

  Future<List<dynamic>?> loadAlerts() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_alertsKey);
    if (raw == null) return null;
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveReports(List<dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_reportsKey, jsonEncode(data));
  }

  Future<List<dynamic>?> loadReports() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_reportsKey);
    if (raw == null) return null;
    return jsonDecode(raw) as List<dynamic>;
  }
}

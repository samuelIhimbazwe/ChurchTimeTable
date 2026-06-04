import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Offline cache for member portal payloads.
class MemberPortalCache {
  static const dashboardKey = 'member_portal_dashboard';
  static const membershipKey = 'member_portal_membership';
  static const broadcastsKey = 'member_portal_broadcasts';
  static const invitationsKey = 'member_portal_invitations';
  static const requestsKey = 'member_portal_requests';

  Future<void> saveDashboard(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(dashboardKey, jsonEncode(data));
  }

  Future<Map<String, dynamic>?> loadDashboard() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(dashboardKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveMembership(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(membershipKey, jsonEncode(data));
  }

  Future<Map<String, dynamic>?> loadMembership() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(membershipKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveBroadcasts(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(broadcastsKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadBroadcasts() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(broadcastsKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveInvitations(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(invitationsKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadInvitations() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(invitationsKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveRequests(List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(requestsKey, jsonEncode(items));
  }

  Future<List<dynamic>> loadRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(requestsKey);
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }
}

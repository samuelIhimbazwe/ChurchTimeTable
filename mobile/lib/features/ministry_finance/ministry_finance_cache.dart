import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class MinistryFinanceCache {
  static const _summaryKey = 'mf5_ministry_finance_summary';
  static const _fundsKey = 'mf5_ministry_finance_funds';
  static const _expensesKey = 'mf5_ministry_finance_expenses';

  Future<void> saveSummary(String ministryId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_summaryKey:$ministryId', jsonEncode(data));
  }

  Future<Map<String, dynamic>?> loadSummary(String ministryId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_summaryKey:$ministryId');
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveFunds(String ministryId, List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_fundsKey:$ministryId', jsonEncode(items));
  }

  Future<List<dynamic>> loadFunds(String ministryId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_fundsKey:$ministryId');
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }

  Future<void> saveExpenses(String ministryId, List<dynamic> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_expensesKey:$ministryId', jsonEncode(items));
  }

  Future<List<dynamic>> loadExpenses(String ministryId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_expensesKey:$ministryId');
    if (raw == null) return [];
    return jsonDecode(raw) as List<dynamic>;
  }
}

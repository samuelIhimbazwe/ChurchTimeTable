class DashboardWidgetConfig {
  DashboardWidgetConfig({
    required this.id,
    required this.category,
    required this.priority,
  });

  final String id;
  final String category;
  final int priority;

  factory DashboardWidgetConfig.fromJson(Map<String, dynamic> json) {
    return DashboardWidgetConfig(
      id: json['id'] as String? ?? '',
      category: json['category'] as String? ?? 'overview',
      priority: json['priority'] as int? ?? 999,
    );
  }
}

class MinistryAlert {
  MinistryAlert({
    required this.id,
    required this.type,
    required this.severity,
    required this.title,
    required this.message,
    this.count,
    this.actionHint,
  });

  final String id;
  final String type;
  final String severity;
  final String title;
  final String message;
  final int? count;
  final String? actionHint;

  factory MinistryAlert.fromJson(Map<String, dynamic> json) {
    return MinistryAlert(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      severity: json['severity'] as String? ?? 'info',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      count: json['count'] as int?,
      actionHint: json['actionHint'] as String?,
    );
  }
}

class PermissionWidgets {
  PermissionWidgets({
    this.treasurer = false,
    this.discipline = false,
    this.secretary = false,
    this.operationsManager = false,
    this.protocolCoordinator = false,
    this.protocolPresident = false,
    this.choirLeader = false,
    this.teamHead = false,
    this.replacements = false,
    this.attendanceTools = false,
    this.financeSnapshot = false,
  });

  final bool treasurer;
  final bool discipline;
  final bool secretary;
  final bool operationsManager;
  final bool protocolCoordinator;
  final bool protocolPresident;
  final bool choirLeader;
  final bool teamHead;
  final bool replacements;
  final bool attendanceTools;
  final bool financeSnapshot;

  factory PermissionWidgets.fromJson(Map<String, dynamic>? json) {
    if (json == null) return PermissionWidgets();
    return PermissionWidgets(
      treasurer: json['treasurer'] as bool? ?? false,
      discipline: json['discipline'] as bool? ?? false,
      secretary: json['secretary'] as bool? ?? false,
      operationsManager: json['operationsManager'] as bool? ?? false,
      protocolCoordinator: json['protocolCoordinator'] as bool? ?? false,
      protocolPresident: json['protocolPresident'] as bool? ?? false,
      choirLeader: json['choirLeader'] as bool? ?? false,
      teamHead: json['teamHead'] as bool? ?? false,
      replacements: json['replacements'] as bool? ?? false,
      attendanceTools: json['attendanceTools'] as bool? ?? false,
      financeSnapshot: json['financeSnapshot'] as bool? ?? false,
    );
  }
}

class MemberDashboardSummary {
  MemberDashboardSummary({
    required this.upcomingAssignments,
    required this.pendingSwaps,
    required this.widgets,
    required this.alerts,
    required this.permissionWidgets,
    this.attendanceRate,
    this.raw = const {},
  });

  final int upcomingAssignments;
  final int pendingSwaps;
  final List<DashboardWidgetConfig> widgets;
  final List<MinistryAlert> alerts;
  final PermissionWidgets permissionWidgets;
  final double? attendanceRate;
  final Map<String, dynamic> raw;

  factory MemberDashboardSummary.fromJson(Map<String, dynamic> json) {
    final widgetsRaw = json['widgets'] as List<dynamic>? ?? [];
    final alertsRaw = json['alerts'] as List<dynamic>? ?? [];
    return MemberDashboardSummary(
      upcomingAssignments: json['upcomingAssignments'] as int? ?? 0,
      pendingSwaps: json['pendingSwaps'] as int? ?? 0,
      widgets: widgetsRaw
          .map((w) => DashboardWidgetConfig.fromJson(Map<String, dynamic>.from(w as Map)))
          .toList(),
      alerts: alertsRaw
          .map((a) => MinistryAlert.fromJson(Map<String, dynamic>.from(a as Map)))
          .toList(),
      permissionWidgets: PermissionWidgets.fromJson(
        json['permissionWidgets'] as Map<String, dynamic>?,
      ),
      attendanceRate: (json['attendanceRate'] as num?)?.toDouble(),
      raw: json,
    );
  }

  bool hasWidget(String id) => widgets.any((w) => w.id == id);
}

class LeaderDashboardSummary {
  LeaderDashboardSummary({
    required this.upcomingEvents,
    required this.pendingSwaps,
    required this.pendingReplacements,
    required this.widgets,
    required this.alerts,
    required this.permissionWidgets,
    this.attendanceRate,
    this.raw = const {},
  });

  final int upcomingEvents;
  final int pendingSwaps;
  final int pendingReplacements;
  final List<DashboardWidgetConfig> widgets;
  final List<MinistryAlert> alerts;
  final PermissionWidgets permissionWidgets;
  final double? attendanceRate;
  final Map<String, dynamic> raw;

  factory LeaderDashboardSummary.fromJson(Map<String, dynamic> json) {
    final widgetsRaw = json['widgets'] as List<dynamic>? ?? [];
    final alertsRaw = json['alerts'] as List<dynamic>? ?? [];
    return LeaderDashboardSummary(
      upcomingEvents: json['upcomingEvents'] as int? ?? 0,
      pendingSwaps: json['pendingSwaps'] as int? ?? 0,
      pendingReplacements: json['pendingReplacements'] as int? ?? 0,
      widgets: widgetsRaw
          .map((w) => DashboardWidgetConfig.fromJson(Map<String, dynamic>.from(w as Map)))
          .toList(),
      alerts: alertsRaw
          .map((a) => MinistryAlert.fromJson(Map<String, dynamic>.from(a as Map)))
          .toList(),
      permissionWidgets: PermissionWidgets.fromJson(
        json['permissionWidgets'] as Map<String, dynamic>?,
      ),
      attendanceRate: (json['attendanceRate'] as num?)?.toDouble(),
      raw: json,
    );
  }

  bool hasWidget(String id) => widgets.any((w) => w.id == id);
}

bool hasDashboardWidget(List<DashboardWidgetConfig> widgets, String id) {
  return widgets.any((w) => w.id == id);
}

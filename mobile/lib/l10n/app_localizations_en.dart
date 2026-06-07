// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get app_title => 'CMMS';

  @override
  String get app_tagline => 'Church management system';

  @override
  String get nav_home => 'Home';

  @override
  String get nav_members => 'Members';

  @override
  String get nav_events => 'Events';

  @override
  String get nav_more => 'More';

  @override
  String get members_title => 'Members';

  @override
  String get member_profile_title => 'Member profile';

  @override
  String get member_profile_timeline => 'Activity timeline';

  @override
  String get member_profile_timeline_empty => 'No activity recorded yet.';

  @override
  String get member_profile_status => 'Status';

  @override
  String get member_profile_voice => 'Voice section';

  @override
  String get member_profile_family => 'Family';

  @override
  String get member_profile_welfare => 'Open welfare cases';

  @override
  String get members_empty => 'No members found yet.';

  @override
  String get auth_sign_in_action => 'Sign in';

  @override
  String get auth_email_label => 'Email';

  @override
  String get auth_password_label => 'Password';

  @override
  String get auth_email_invalid => 'Enter a valid email address';

  @override
  String get auth_password_min_length =>
      'Password must be at least 6 characters';

  @override
  String get auth_login_failed => 'Sign in failed';

  @override
  String get validation_required => 'This field is required';

  @override
  String get onboarding_signup_title => 'Ministry registration';

  @override
  String get onboarding_signup_first_name => 'First name';

  @override
  String get onboarding_signup_last_name => 'Last name';

  @override
  String get onboarding_signup_phone => 'Phone (optional)';

  @override
  String get onboarding_signup_ministry => 'Ministry';

  @override
  String get onboarding_signup_ministry_choir => 'Choir';

  @override
  String get onboarding_signup_ministry_protocol => 'Protocol';

  @override
  String get onboarding_signup_ministry_both => 'Both ministries';

  @override
  String get onboarding_signup_ministry_choir_desc =>
      'Serve in worship through singing, rehearsals, and scheduled services.';

  @override
  String get onboarding_signup_ministry_protocol_desc =>
      'Welcome, guide, and coordinate hospitality during church services.';

  @override
  String get onboarding_signup_ministry_both_desc =>
      'You participate in both choir and protocol ministries.';

  @override
  String get onboarding_signup_confirm_password => 'Confirm password';

  @override
  String get onboarding_signup_password_mismatch => 'Passwords do not match.';

  @override
  String get onboarding_signup_approval_note =>
      'After you submit, a leader will review your registration before full access is granted.';

  @override
  String get onboarding_signup_back => 'Back';

  @override
  String get onboarding_signup_continue => 'Continue';

  @override
  String get onboarding_signup_submit => 'Submit registration';

  @override
  String get onboarding_signup_have_account =>
      'Already have an account? Sign in';

  @override
  String get onboarding_pending_eyebrow => 'Registration received';

  @override
  String get onboarding_pending_title => 'Your request is being reviewed';

  @override
  String onboarding_pending_greeting(String name) {
    return 'Thank you, $name.';
  }

  @override
  String get onboarding_pending_body =>
      'Your ministry registration has been received. Leaders are reviewing your request.';

  @override
  String get onboarding_pending_step_review =>
      'A ministry leader will review your details.';

  @override
  String get onboarding_pending_step_notify =>
      'You will receive a notification when a decision is made.';

  @override
  String get onboarding_pending_step_access =>
      'Once approved, you can view schedules and ministry updates.';

  @override
  String get onboarding_pending_help =>
      'If you need help, contact your choir or protocol leader.';

  @override
  String get dashboard_member_title => 'My dashboard';

  @override
  String dashboard_welcome(Object name) {
    return 'Welcome back, $name';
  }

  @override
  String get dashboard_leader_title => 'Leader dashboard';

  @override
  String get nav_calendar => 'Event calendar';

  @override
  String get nav_attendance => 'Attendance';

  @override
  String get nav_swaps => 'Swaps';

  @override
  String get nav_replacements => 'Replacements';

  @override
  String get nav_discipline => 'Discipline';

  @override
  String get nav_finance => 'Choir finance';

  @override
  String get nav_notifications => 'Notifications';

  @override
  String get nav_sync => 'Offline sync';

  @override
  String get nav_assignments => 'Assignments';

  @override
  String get nav_choir_rotation => 'Choir rotation';

  @override
  String get nav_budgets => 'Budgets';

  @override
  String get nav_settings => 'Settings';

  @override
  String get member_attendance_label => 'Attendance';

  @override
  String get attendance_status_present => 'Present';

  @override
  String get attendance_status_absent => 'Absent';

  @override
  String get attendance_status_late => 'Late';

  @override
  String get attendance_status_excused => 'Excused';

  @override
  String get attendance_status_unexcused => 'Unexcused';

  @override
  String get attendance_save_action => 'Save attendance';

  @override
  String get attendance_saved_success => 'Attendance saved';

  @override
  String get attendance_queued_offline => 'Queued for offline sync';

  @override
  String get attendance_notes_label => 'Notes';

  @override
  String get event_picker_label => 'Select event';

  @override
  String get member_picker_label => 'Select member';

  @override
  String get swap_list_title => 'Swaps';

  @override
  String get swap_request_action => 'Request swap';

  @override
  String get swap_accept_action => 'Accept swap';

  @override
  String get swap_reject_action => 'Reject';

  @override
  String get swap_leader_approve_action => 'Leader approve';

  @override
  String get swap_finalize_action => 'Finalize swap';

  @override
  String get replacement_title => 'Replacements';

  @override
  String get replacement_request_action => 'Request replacement';

  @override
  String get discipline_title => 'Discipline';

  @override
  String get finance_summary_title => 'Choir finance';

  @override
  String get sync_title => 'Offline sync';

  @override
  String get sync_now_action => 'Sync now';

  @override
  String get sync_pending_count => 'Pending items';

  @override
  String get settings_title => 'Settings';

  @override
  String get settings_language_title => 'Language';

  @override
  String get settings_language_subtitle => 'Choose your preferred app language';

  @override
  String get language_kinyarwanda => 'Kinyarwanda';

  @override
  String get language_english => 'English';

  @override
  String get language_french => 'French';

  @override
  String get language_changed_success => 'Language updated';

  @override
  String get common_refresh => 'Refresh';

  @override
  String get common_save => 'Save';

  @override
  String get common_cancel => 'Cancel';

  @override
  String get common_logout => 'Sign out';

  @override
  String get common_loading => 'Please wait...';

  @override
  String get error_conflict => 'Schedule conflict detected';

  @override
  String get error_unauthorized => 'Invalid credentials';

  @override
  String get error_forbidden => 'Access denied';

  @override
  String get error_not_found => 'Not found';

  @override
  String get error_validation => 'Validation failed';

  @override
  String get error_business_rule => 'Action not allowed';

  @override
  String get error_network => 'Network unavailable';

  @override
  String get error_unknown => 'Something went wrong';

  @override
  String get member_name_fallback => 'Member';

  @override
  String get sync_pending_hint => 'Pending items in queue';

  @override
  String get sync_queued_items_title => 'Queued items';

  @override
  String get sync_offline_skipped => 'Offline';

  @override
  String get sync_queue_empty_skipped => 'Queue empty';

  @override
  String sync_result_applied(int applied, int rejected) {
    return 'Applied: $applied, Rejected: $rejected';
  }

  @override
  String get notifications_title => 'Notifications';

  @override
  String get assignments_title => 'Assignments';

  @override
  String get choir_rotation_title => 'Choir rotation';

  @override
  String get budgets_title => 'Budgets';

  @override
  String get calendar_selected_day => 'Events on this day';

  @override
  String get replacement_event_id_label => 'Event ID';

  @override
  String get replacement_absent_member_label => 'Absent member ID (optional)';

  @override
  String get replacement_cover_member_label => 'Cover member ID (optional)';

  @override
  String get replacement_requested_success => 'Replacement requested';

  @override
  String get swap_with_member_label => 'Swap with';

  @override
  String get swap_details_title => 'Swap details';

  @override
  String get common_approve => 'Approve';

  @override
  String get common_finalize => 'Finalize';

  @override
  String get finance_income_label => 'Income';

  @override
  String get finance_expense_label => 'Expense';

  @override
  String get finance_balance_label => 'Balance';

  @override
  String get finance_unpaid_label => 'Outstanding';

  @override
  String get budget_name_label => 'Budget name';

  @override
  String get budget_amount_label => 'Amount';

  @override
  String get budget_create_action => 'Create budget';

  @override
  String budget_amount_subtitle(Object amount) {
    return 'Amount: $amount';
  }

  @override
  String get choir_refresh_pool_action => 'Refresh pool';

  @override
  String get choir_auto_assign_action => 'Auto assign';

  @override
  String choir_eligible_members_label(int count) {
    return 'Eligible members: $count';
  }

  @override
  String choir_slot_subtitle(Object slot) {
    return 'Slot #$slot';
  }

  @override
  String choir_assigned_count_message(int count) {
    return 'Assigned $count members';
  }

  @override
  String get assignment_manual_override_label => 'Manual override';

  @override
  String get assignment_override_reason_label => 'Override reason';

  @override
  String get assignment_add_member_label => 'Add member';

  @override
  String assignment_queue_title(int count) {
    return 'Queue ($count)';
  }

  @override
  String get assignment_bulk_assign_action => 'Bulk assign';

  @override
  String assignment_members_assigned_message(int count) {
    return 'Assigned $count members';
  }

  @override
  String get term_choir => 'Choir';

  @override
  String get term_protocol => 'Protocol';

  @override
  String get term_attendance => 'Attendance';

  @override
  String get term_discipline => 'Discipline';

  @override
  String get term_rehearsal => 'Rehearsal';

  @override
  String get term_worship_service => 'Worship service';

  @override
  String get term_member => 'Member';

  @override
  String get term_announcement => 'Announcement';

  @override
  String get term_schedule => 'Schedule';

  @override
  String get term_responsibility => 'Assignment';

  @override
  String get term_replacement => 'Replacement';

  @override
  String get term_swap => 'Swap';

  @override
  String get term_event => 'Event';

  @override
  String get term_leader => 'Leader';

  @override
  String get term_committee => 'Committee';

  @override
  String get term_treasurer => 'Treasurer';

  @override
  String get term_secretary => 'Secretary';

  @override
  String swap_request_sent(Object memberName) {
    return '$memberName requested to swap with you';
  }

  @override
  String swap_status_updated(Object statusLabel) {
    return 'Swap update: $statusLabel';
  }

  @override
  String swap_list_item_subtitle(Object eventName, Object statusLabel) {
    return '$eventName · $statusLabel';
  }

  @override
  String attendance_marked_for_event(Object eventName) {
    return 'Your attendance for $eventName was recorded';
  }

  @override
  String discipline_case_opened(Object caseTitle) {
    return 'A discipline case was opened: $caseTitle';
  }

  @override
  String dues_remaining(Object amount) {
    return 'Remaining balance: $amount';
  }

  @override
  String event_assigned_to_you(Object eventName) {
    return 'You were assigned to: $eventName';
  }

  @override
  String replacement_requested_for_event(Object eventName) {
    return 'Replacement requested for $eventName';
  }

  @override
  String get replacement_list_title => 'Replacement requests';

  @override
  String get replacement_list_empty => 'No replacement requests yet';

  @override
  String replacement_list_item_subtitle(
      Object eventName, Object absentName, Object coverName) {
    return '$eventName · $absentName → $coverName';
  }

  @override
  String get swap_status_requested => 'Requested';

  @override
  String get swap_status_target_accepted => 'Accepted by partner';

  @override
  String get swap_status_target_rejected => 'Declined by partner';

  @override
  String get swap_status_leader_pending => 'Awaiting leader';

  @override
  String get swap_status_approved => 'Leader approved';

  @override
  String get swap_status_rejected => 'Rejected';

  @override
  String get swap_status_finalized => 'Finalized';

  @override
  String get swap_status_cancelled => 'Cancelled';

  @override
  String get replacement_status_requested => 'Requested';

  @override
  String get replacement_status_leader_pending => 'Awaiting leader';

  @override
  String get replacement_status_approved => 'Approved';

  @override
  String get replacement_status_rejected => 'Rejected';

  @override
  String get replacement_status_finalized => 'Finalized';

  @override
  String get discipline_stage_reported => 'Reported';

  @override
  String get discipline_stage_under_review => 'Under review';

  @override
  String get discipline_stage_decision_pending => 'Decision pending';

  @override
  String get discipline_stage_actioned => 'Actioned';

  @override
  String get discipline_stage_closed => 'Closed';

  @override
  String get enum_status_unknown => 'Unknown status';

  @override
  String get settings_appearance_title => 'Appearance';

  @override
  String get settings_theme_system => 'System default';

  @override
  String get settings_theme_light => 'Light';

  @override
  String get settings_theme_dark => 'Dark';

  @override
  String get event_detail_title => 'Event details';

  @override
  String get event_create_title => 'Create event';

  @override
  String get event_edit_action => 'Edit';

  @override
  String get event_assign_action => 'Assign members';

  @override
  String get event_mark_attendance_action => 'Mark attendance';

  @override
  String get event_notify_action => 'Notify members';

  @override
  String get event_history_title => 'History';

  @override
  String get event_audit_title => 'Audit trail';

  @override
  String get event_type_choir_service => 'Choir service';

  @override
  String get event_type_concert => 'Concert';

  @override
  String get event_type_protocol_service => 'Protocol service';

  @override
  String get event_type_church_event => 'Church event';

  @override
  String get event_ministry_both => 'Both ministries';

  @override
  String get event_filter_all_types => 'All types';

  @override
  String get event_filter_ministry_all => 'All ministries';

  @override
  String get event_view_month => 'Month';

  @override
  String get event_view_week => 'Week';

  @override
  String get event_start_label => 'Starts';

  @override
  String get event_end_label => 'Ends';

  @override
  String get event_location_label => 'Location';

  @override
  String get event_description_label => 'Description';

  @override
  String get event_recurrence_label => 'Recurrence';

  @override
  String get event_conflict_error => 'End time must be after start time';

  @override
  String get event_created_success => 'Event created';

  @override
  String get event_assigned_members_title => 'Assigned members';

  @override
  String get event_attendance_title => 'Attendance';

  @override
  String get dashboard_section_overview => 'Overview';

  @override
  String get dashboard_kpi_upcoming_events => 'Upcoming events';

  @override
  String get dashboard_kpi_upcoming_assignments => 'Upcoming assignments';

  @override
  String get dashboard_kpi_pending_swaps => 'Pending swaps';

  @override
  String get dashboard_kpi_pending_replacements => 'Pending replacements';

  @override
  String get dashboard_kpi_attendance_rate => 'Attendance rate';

  @override
  String get dashboard_kpi_active_discipline => 'Active discipline';

  @override
  String get dashboard_kpi_sync_conflicts => 'Sync conflicts';

  @override
  String get dashboard_kpi_finance_balance => 'Finance balance';

  @override
  String get sync_conflicts_title => 'Sync conflicts';

  @override
  String get sync_last_sync => 'Last sync';

  @override
  String sync_failed_count(int count) {
    return 'Failed: $count';
  }

  @override
  String get sync_retry_action => 'Retry';

  @override
  String get sync_conflict_reason => 'Reason';

  @override
  String get attendance_bulk_title => 'Bulk attendance';

  @override
  String get attendance_bulk_save => 'Save all';

  @override
  String get assignment_validate_action => 'Validate assignment';

  @override
  String get assignment_conflict_warning => 'Schedule conflict detected';

  @override
  String get assignment_quota_warning => 'Quota limit exceeded';

  @override
  String get member_availability_title => 'Member availability';

  @override
  String get member_unavailable_dates_label => 'Unavailable dates';

  @override
  String get common_create => 'Create';

  @override
  String get common_retry => 'Retry';

  @override
  String get nav_coverage => 'Coverage';

  @override
  String get attendance_governance_title => 'Attendance governance';

  @override
  String get attendance_mark_all_present => 'Mark all present';

  @override
  String get attendance_excuse_review_title => 'Excuse review';

  @override
  String get attendance_excuse_no_reason => 'No reason provided';

  @override
  String get attendance_select_event_hint =>
      'Select an event to load the roster';

  @override
  String get attendance_roster_empty => 'No members assigned to this event';

  @override
  String get attendance_reliability_title => 'Reliability score';

  @override
  String attendance_reliability_subtitle(Object band, Object percentage) {
    return '$percentage% · $band';
  }

  @override
  String get attendance_excuse_request_title => 'Request excused absence';

  @override
  String get attendance_excuse_request_subtitle =>
      'Submit an excuse for an upcoming assignment. A leader will review it.';

  @override
  String get attendance_excuse_reason_label => 'Reason';

  @override
  String get attendance_excuse_submit_action => 'Submit excuse';

  @override
  String attendance_excuse_submitted(Object eventName) {
    return 'Excuse submitted for $eventName';
  }

  @override
  String get attendance_recent_title => 'Recent attendance';

  @override
  String get attendance_recent_empty => 'No attendance history yet';

  @override
  String get attendance_status_attended => 'Attended';

  @override
  String get attendance_status_replacement => 'Replacement served';

  @override
  String get attendance_status_voluntary => 'Voluntary service';

  @override
  String get attendance_excuse_illness => 'Illness';

  @override
  String get attendance_excuse_travel => 'Travel';

  @override
  String get attendance_excuse_work_school => 'Work or school';

  @override
  String get attendance_excuse_emergency => 'Emergency';

  @override
  String get attendance_excuse_family => 'Family issue';

  @override
  String get attendance_excuse_approved_leave => 'Approved leave';

  @override
  String get attendance_excuse_conflict => 'Unavoidable conflict';

  @override
  String get attendance_excuse_unknown => 'Unknown';

  @override
  String get coverage_analytics_title => 'Coverage analytics';

  @override
  String get coverage_analytics_swaps => 'Swaps';

  @override
  String get coverage_analytics_replacements => 'Replacements';

  @override
  String get coverage_analytics_voluntary => 'Voluntary service';

  @override
  String get coverage_analytics_unresolved => 'Unresolved swaps';

  @override
  String get coverage_readiness_title => 'Readiness';

  @override
  String get coverage_readiness_empty => 'No readiness warnings';

  @override
  String get coverage_team_head_title => 'Team head';

  @override
  String get coverage_team_head_empty => 'No pending coverage issues';

  @override
  String get coverage_coordinator_title => 'Coordinator';

  @override
  String get coverage_coordinator_empty => 'No escalated coverage cases';

  @override
  String get coverage_escalated_title => 'Escalated';

  @override
  String get coverage_open_swaps => 'Manage swaps';

  @override
  String get coverage_open_replacements => 'Manage replacements';

  @override
  String get coverage_swaps_empty => 'No swap requests';

  @override
  String get coverage_readiness_ready => 'Fully ready';

  @override
  String get coverage_readiness_replacement_pending => 'Replacement pending';

  @override
  String get coverage_readiness_attendance_risk => 'Attendance risk';

  @override
  String get coverage_readiness_staffing_shortage => 'Staffing shortage';

  @override
  String get coverage_readiness_operational_danger => 'Operational danger';

  @override
  String get attendance_tab_marking => 'Marking';

  @override
  String get attendance_tab_choir => 'Choir';

  @override
  String get attendance_tab_oversight => 'Oversight';

  @override
  String get attendance_choir_title => 'Choir attendance';

  @override
  String get attendance_choir_marked => 'Marked';

  @override
  String get attendance_choir_excused => 'Excused';

  @override
  String get attendance_choir_unexcused => 'Unexcused';

  @override
  String get attendance_choir_lateness => 'Lateness';

  @override
  String get attendance_choir_pending_review => 'Pending review';

  @override
  String get attendance_discipline_title => 'Discipline recommendations';

  @override
  String get attendance_discipline_subtitle =>
      'Pastoral review suggested — not automatic discipline.';

  @override
  String get attendance_discipline_empty => 'No recommendations right now.';

  @override
  String get attendance_discipline_create => 'Open discipline case';

  @override
  String get attendance_discipline_created => 'Discipline case created.';

  @override
  String get coverage_escalate_team_head => 'Escalate to team head';

  @override
  String get coverage_escalate_coordinator => 'Escalate to coordinator';

  @override
  String get coverage_escalate_president => 'Escalate to president';

  @override
  String get phoneRequired => 'Phone number required to continue.';

  @override
  String get updatePhoneNow => 'Update now';

  @override
  String get restrictedUntilPhoneAdded =>
      'Phone number required to continue ministry operations.';

  @override
  String get warningPhoneIncomplete =>
      'Complete your phone number to avoid losing access to ministry tools.';

  @override
  String get my_contributions_title => 'My contributions';

  @override
  String get my_contributions_member_number => 'Member number';

  @override
  String get my_contributions_history_title => 'Contribution history';

  @override
  String get my_contributions_total => 'Total contributed';

  @override
  String get my_contributions_outstanding => 'Outstanding balance';

  @override
  String get my_contributions_ack_sent => 'Thank-you sent';

  @override
  String get my_contributions_ack_pending => 'Acknowledgment pending';

  @override
  String get my_contributions_ack_failed => 'Acknowledgment failed';

  @override
  String get operational_units_title => 'Operational units';

  @override
  String get operational_unit_detail_title => 'Unit';

  @override
  String get ministries_title => 'Ministries';

  @override
  String get ministry_detail_title => 'Ministry';

  @override
  String get families_title => 'Families';

  @override
  String get search_group_welfare_cases => 'Welfare cases';

  @override
  String get search_group_songs => 'Songs';

  @override
  String get search_group_rehearsals => 'Rehearsals';

  @override
  String get welfare_title => 'Welfare';

  @override
  String get welfare_open_cases => 'Open cases';

  @override
  String get welfare_funds_raised => 'Funds raised';

  @override
  String get welfare_raised => 'Raised';

  @override
  String get welfare_remaining => 'Remaining';

  @override
  String get welfare_amount => 'Amount';

  @override
  String get welfare_contribute => 'Contribute';

  @override
  String get music_title => 'Music library';

  @override
  String get music_usage_count => 'Uses';

  @override
  String get rehearsals_title => 'Rehearsals';

  @override
  String get rehearsals_readiness => 'Readiness';

  @override
  String get rehearsals_attendance => 'Attendance';

  @override
  String get rehearsals_plan => 'Plan';

  @override
  String get rehearsals_reports => 'Reports';

  @override
  String get rehearsals_prep_score => 'Preparation score';

  @override
  String get welfare_create_title => 'Open welfare case';

  @override
  String get welfare_field_title => 'Title';

  @override
  String get welfare_field_description => 'Description';

  @override
  String get welfare_field_member_id => 'Member ID';

  @override
  String get welfare_category => 'Category';

  @override
  String get welfare_submit_case => 'Submit case';

  @override
  String get welfare_assistance_title => 'Record assistance';

  @override
  String get welfare_assistance_type => 'Assistance type';

  @override
  String get welfare_record_assistance => 'Record assistance';

  @override
  String get welfare_reports_title => 'Welfare reports';

  @override
  String get welfare_assistance_total => 'Assistance total';

  @override
  String get welfare_tab_overview => 'Overview';

  @override
  String get welfare_timeline => 'Timeline';

  @override
  String get welfare_timeline_empty => 'No timeline events yet.';

  @override
  String get welfare_contributions => 'Contributions';

  @override
  String get welfare_offline_banner =>
      'Showing cached data. Pull to refresh when online.';

  @override
  String get music_favorites => 'Favorites';

  @override
  String get music_favorite => 'Add to favorites';

  @override
  String get music_unfavorite => 'Remove from favorites';

  @override
  String get music_recent => 'Recently viewed';

  @override
  String get music_lyrics => 'Lyrics';

  @override
  String get music_assets => 'Assets';

  @override
  String get common_back => 'Back';

  @override
  String get common_next => 'Next';

  @override
  String get search_group_welfare_categories => 'Welfare categories';

  @override
  String get search_group_choir_documents => 'Choir documents';

  @override
  String get search_group_choir_meetings => 'Choir meetings';

  @override
  String get search_group_welfare_assistance => 'Welfare assistance';
}

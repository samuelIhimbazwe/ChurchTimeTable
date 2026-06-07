// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kinyarwanda (`rw`).
class AppLocalizationsRw extends AppLocalizations {
  AppLocalizationsRw([String locale = 'rw']) : super(locale);

  @override
  String get app_title => 'CMMS';

  @override
  String get app_tagline => 'Sisitemu yo gucunga itorero';

  @override
  String get nav_home => 'Ahabanza';

  @override
  String get nav_members => 'Abanyamuryango';

  @override
  String get nav_events => 'Ibirori';

  @override
  String get nav_more => 'Ibindi';

  @override
  String get members_title => 'Abanyamuryango';

  @override
  String get member_profile_title => 'Umwirondoro w\'umunyamuryango';

  @override
  String get member_profile_timeline => 'Ibikorwa by\'umunyamuryango';

  @override
  String get member_profile_timeline_empty => 'Nta bikorwa biraboneka.';

  @override
  String get member_profile_status => 'Imiterere';

  @override
  String get member_profile_voice => 'Ijwi';

  @override
  String get member_profile_family => 'Umuryango';

  @override
  String get member_profile_welfare => 'Dosiye z\'ubufasha zifunguye';

  @override
  String get members_empty => 'Nta banyamuryango babonetse.';

  @override
  String get auth_sign_in_action => 'Injira';

  @override
  String get auth_email_label => 'Imeri';

  @override
  String get auth_password_label => 'Ijambo banga';

  @override
  String get auth_email_invalid => 'Andika imeri yemewe';

  @override
  String get auth_password_min_length =>
      'Ijambo banga rigomba kugira inyuguti 6';

  @override
  String get auth_login_failed => 'Kwinjira byanze';

  @override
  String get validation_required => 'Uyu murandiko urakeneka';

  @override
  String get onboarding_signup_title => 'Kwiyandikisha mu murimo';

  @override
  String get onboarding_signup_first_name => 'Izina ry\'ibanze';

  @override
  String get onboarding_signup_last_name => 'Izina ry\'umuryango';

  @override
  String get onboarding_signup_phone => 'Telefone (si ngombwa)';

  @override
  String get onboarding_signup_ministry => 'Umurimo';

  @override
  String get onboarding_signup_ministry_choir => 'Korali';

  @override
  String get onboarding_signup_ministry_protocol => 'Protocol';

  @override
  String get onboarding_signup_ministry_both => 'Imirimo ibiri';

  @override
  String get onboarding_signup_ministry_choir_desc =>
      'Gukorera mu gusenga binyuze mu ndirimbo n\'imyiteguro.';

  @override
  String get onboarding_signup_ministry_protocol_desc =>
      'Kwakira no gukurikirana serivisi z\'itorero.';

  @override
  String get onboarding_signup_ministry_both_desc =>
      'Ukora mu korali na protocol.';

  @override
  String get onboarding_signup_confirm_password => 'Emeza ijambo banga';

  @override
  String get onboarding_signup_password_mismatch =>
      'Amagambo y\'ibanga ntahura.';

  @override
  String get onboarding_signup_approval_note =>
      'Nyuma yo kohereza, umuyobozi azasuzuma kwiyandikisha kwawe.';

  @override
  String get onboarding_signup_back => 'Subira inyuma';

  @override
  String get onboarding_signup_continue => 'Komeza';

  @override
  String get onboarding_signup_submit => 'Ohereza kwiyandikisha';

  @override
  String get onboarding_signup_have_account => 'Usanzwe ufite konti? Injira';

  @override
  String get onboarding_pending_eyebrow => 'Kwiyandikisha kwakiriwe';

  @override
  String get onboarding_pending_title => 'Icyifuzo cyawe gisuzumwa';

  @override
  String onboarding_pending_greeting(String name) {
    return 'Murakoze, $name.';
  }

  @override
  String get onboarding_pending_body =>
      'Kwiyandikisha kwawe mu murimo kwakiriwe.';

  @override
  String get onboarding_pending_step_review =>
      'Umuyobozi azasuzuma amakuru yawe.';

  @override
  String get onboarding_pending_step_notify =>
      'Uzakira ubutumwa igihe icyemezo cyakozwe.';

  @override
  String get onboarding_pending_step_access =>
      'Niyo wemewe, uzabona gahunda n\'amakuru y\'umurimo.';

  @override
  String get onboarding_pending_help =>
      'Vugana n\'umuyobozi wa korali cyangwa wa protocol niba ukeneye ubufasha.';

  @override
  String get dashboard_member_title => 'Ikibaho cyanjye';

  @override
  String dashboard_welcome(Object name) {
    return 'Murakaza neza, $name';
  }

  @override
  String get dashboard_leader_title => 'Ikibaho cy\'umuyobozi';

  @override
  String get nav_calendar => 'Kalendari y\'ibikorwa';

  @override
  String get nav_attendance => 'Uko witabiriye';

  @override
  String get nav_swaps => 'Gusimburana';

  @override
  String get nav_replacements => 'Gusimbura';

  @override
  String get nav_discipline => 'Imyitwarire';

  @override
  String get nav_finance => 'Imari ya Korali';

  @override
  String get nav_notifications => 'Amakuru';

  @override
  String get nav_sync => 'Guhuza amakuru';

  @override
  String get nav_assignments => 'Gushyira ku gikorwa';

  @override
  String get nav_choir_rotation => 'Guhinduranya muri Korali';

  @override
  String get nav_budgets => 'Ingengo y\'imari';

  @override
  String get nav_settings => 'Igenamiterere';

  @override
  String get member_attendance_label => 'Uko witabiriye';

  @override
  String get attendance_status_present => 'Yitabiriye';

  @override
  String get attendance_status_absent => 'Ntiyitabiriye';

  @override
  String get attendance_status_late => 'Yakererewe';

  @override
  String get attendance_status_excused => 'Yasobanuye impamvu';

  @override
  String get attendance_status_unexcused => 'Nta mpamvu yumvikana';

  @override
  String get attendance_save_action => 'Bika uko witabiriye';

  @override
  String get attendance_saved_success => 'Uko witabiriye kwawe cyabitswe';

  @override
  String get attendance_queued_offline => 'Byateguwe kwoherezwa nta murandasi';

  @override
  String get attendance_notes_label => 'Inyandiko';

  @override
  String get event_picker_label => 'Hitamo igikorwa';

  @override
  String get member_picker_label => 'Hitamo umunyamuryango';

  @override
  String get swap_list_title => 'Gusimburana';

  @override
  String get swap_request_action => 'Saba gusimburana';

  @override
  String get swap_accept_action => 'Emera gusimburana';

  @override
  String get swap_reject_action => 'Wanga';

  @override
  String get swap_leader_approve_action => 'Emera n\'umuyobozi';

  @override
  String get swap_finalize_action => 'Sohora gusimburana';

  @override
  String get replacement_title => 'Gusimbura';

  @override
  String get replacement_request_action => 'Saba gusimbura';

  @override
  String get discipline_title => 'Imyitwarire';

  @override
  String get finance_summary_title => 'Imari ya Korali';

  @override
  String get sync_title => 'Guhuza amakuru';

  @override
  String get sync_now_action => 'Huza ubu';

  @override
  String get sync_pending_count => 'Ibitegereje guhuza';

  @override
  String get settings_title => 'Igenamiterere';

  @override
  String get settings_language_title => 'Ururimi';

  @override
  String get settings_language_subtitle => 'Hitamo ururimi ukoresha mu gikorwa';

  @override
  String get language_kinyarwanda => 'Ikinyarwanda';

  @override
  String get language_english => 'Icyongereza';

  @override
  String get language_french => 'Igifaransa';

  @override
  String get language_changed_success => 'Ururimi rwahinduwe';

  @override
  String get common_refresh => 'Ongera';

  @override
  String get common_save => 'Bika';

  @override
  String get common_cancel => 'Hagarika';

  @override
  String get common_logout => 'Sohoka';

  @override
  String get common_loading => 'Tegereza...';

  @override
  String get error_conflict =>
      'Habonetse ikibazo cyo guhura kw\'amasaha cyangwa gahunda';

  @override
  String get error_unauthorized => 'Ntushobora kwinjira';

  @override
  String get error_forbidden => 'Nta burenganzira';

  @override
  String get error_not_found => 'Ntibibonetse';

  @override
  String get error_validation => 'Amakuru si yo';

  @override
  String get error_business_rule => 'Iki gikorwa nticyemewe';

  @override
  String get error_network => 'Imiyoboro nta murandasi';

  @override
  String get error_unknown => 'Habaye ikosa';

  @override
  String get member_name_fallback => 'Umunyamuryango';

  @override
  String get sync_pending_hint => 'Ibitegereje mu murongo';

  @override
  String get sync_queued_items_title => 'Ibitegereje';

  @override
  String get sync_offline_skipped => 'Nta murandasi';

  @override
  String get sync_queue_empty_skipped => 'Nta kintu mu murongo';

  @override
  String sync_result_applied(int applied, int rejected) {
    return 'Byakoreshejwe: $applied, Byanze: $rejected';
  }

  @override
  String get notifications_title => 'Amakuru';

  @override
  String get assignments_title => 'Gushyira ku gikorwa';

  @override
  String get choir_rotation_title => 'Guhinduranya aboro';

  @override
  String get budgets_title => 'Ingengo y\'imari';

  @override
  String get calendar_selected_day => 'Ibikorwa by\'uyu munsi';

  @override
  String get replacement_event_id_label => 'ID y\'igikorwa';

  @override
  String get replacement_absent_member_label =>
      'Umunyamuryango adahari (si ngombwa)';

  @override
  String get replacement_cover_member_label => 'Umusimbura (si ngombwa)';

  @override
  String get replacement_requested_success => 'Gusimbura byasabwe';

  @override
  String get swap_with_member_label => 'Guhindurana na';

  @override
  String get swap_details_title => 'Amakuru y\'guhindurana';

  @override
  String get common_approve => 'Emera';

  @override
  String get common_finalize => 'Sohora';

  @override
  String get finance_income_label => 'Inyungu';

  @override
  String get finance_expense_label => 'Amafaranga yasohotse';

  @override
  String get finance_balance_label => 'Asigaye';

  @override
  String get finance_unpaid_label => 'Ideni risigaye';

  @override
  String get budget_name_label => 'Izina ry\'ingengo';

  @override
  String get budget_amount_label => 'Amafaranga';

  @override
  String get budget_create_action => 'Kurema ingengo';

  @override
  String budget_amount_subtitle(Object amount) {
    return 'Amafaranga: $amount';
  }

  @override
  String get choir_refresh_pool_action => 'Ongera urutonde';

  @override
  String get choir_auto_assign_action => 'Gushyira mu buryo bwikora';

  @override
  String choir_eligible_members_label(int count) {
    return 'Abemerewe: $count';
  }

  @override
  String choir_slot_subtitle(Object slot) {
    return 'Umurongo #$slot';
  }

  @override
  String choir_assigned_count_message(int count) {
    return 'Byashyizwe ku banyamuryango $count';
  }

  @override
  String get assignment_manual_override_label =>
      'Guhindura mu buryo bw\'umuntu';

  @override
  String get assignment_override_reason_label => 'Impamvu yo guhindura';

  @override
  String get assignment_add_member_label => 'Ongeraho umunyamuryango';

  @override
  String assignment_queue_title(int count) {
    return 'Urutonde ($count)';
  }

  @override
  String get assignment_bulk_assign_action => 'Gushyira benshi';

  @override
  String assignment_members_assigned_message(int count) {
    return 'Byashyizwe ku banyamuryango $count';
  }

  @override
  String get term_choir => 'Korali';

  @override
  String get term_protocol => 'Protocol';

  @override
  String get term_attendance => 'Uko witabiriye';

  @override
  String get term_discipline => 'Imyitwarire';

  @override
  String get term_rehearsal => 'Imyitozo';

  @override
  String get term_worship_service => 'Iteraniro';

  @override
  String get term_member => 'Umunyamuryango';

  @override
  String get term_announcement => 'Itangazo';

  @override
  String get term_schedule => 'Gahunda';

  @override
  String get term_responsibility => 'Inshingano';

  @override
  String get term_replacement => 'Gusimbura';

  @override
  String get term_swap => 'Gusimburana';

  @override
  String get term_event => 'Igikorwa';

  @override
  String get term_leader => 'Umuyobozi';

  @override
  String get term_committee => 'Komite';

  @override
  String get term_treasurer => 'Umubitsi';

  @override
  String get term_secretary => 'Umunyamabanga';

  @override
  String swap_request_sent(Object memberName) {
    return '$memberName yasabye ko musimburana';
  }

  @override
  String swap_status_updated(Object statusLabel) {
    return 'Impinduka ku gusimburana: $statusLabel';
  }

  @override
  String swap_list_item_subtitle(Object eventName, Object statusLabel) {
    return '$eventName · $statusLabel';
  }

  @override
  String attendance_marked_for_event(Object eventName) {
    return 'Uko witabiriye kwawe kuri $eventName byanditswe';
  }

  @override
  String discipline_case_opened(Object caseTitle) {
    return 'Ikibazo cy\'imyitwarire cyafunguwe: $caseTitle';
  }

  @override
  String dues_remaining(Object amount) {
    return 'Asigaye: $amount';
  }

  @override
  String event_assigned_to_you(Object eventName) {
    return 'Washyizwe ku gikorwa: $eventName';
  }

  @override
  String replacement_requested_for_event(Object eventName) {
    return 'Gusimbura byasabwe kuri $eventName';
  }

  @override
  String get replacement_list_title => 'Urutonde rwa gusimbura';

  @override
  String get replacement_list_empty => 'Nta gusimbura kuri ubu';

  @override
  String replacement_list_item_subtitle(
      Object eventName, Object absentName, Object coverName) {
    return '$eventName · $absentName → $coverName';
  }

  @override
  String get swap_status_requested => 'Byasabwe';

  @override
  String get swap_status_target_accepted => 'Byemewe n\'uwusimburwa';

  @override
  String get swap_status_target_rejected => 'Byanze n\'uwusimburwa';

  @override
  String get swap_status_leader_pending => 'Bitegereje umuyobozi';

  @override
  String get swap_status_approved => 'Byemewe n\'umuyobozi';

  @override
  String get swap_status_rejected => 'Byanze';

  @override
  String get swap_status_finalized => 'Byarangiye';

  @override
  String get swap_status_cancelled => 'Byahagaritswe';

  @override
  String get replacement_status_requested => 'Byasabwe';

  @override
  String get replacement_status_leader_pending => 'Bitegereje umuyobozi';

  @override
  String get replacement_status_approved => 'Byemewe';

  @override
  String get replacement_status_rejected => 'Byanze';

  @override
  String get replacement_status_finalized => 'Byarangiye';

  @override
  String get discipline_stage_reported => 'Byatangajwe';

  @override
  String get discipline_stage_under_review => 'Birasuzumwa';

  @override
  String get discipline_stage_decision_pending => 'Icyemezo gitegerejwe';

  @override
  String get discipline_stage_actioned => 'Byafatiwe icyemezo';

  @override
  String get discipline_stage_closed => 'Byarangiye';

  @override
  String get enum_status_unknown => 'Ntibisobanutse';

  @override
  String get settings_appearance_title => 'Isura';

  @override
  String get settings_theme_system => 'Ukurikije sisitemu';

  @override
  String get settings_theme_light => 'Urumuri';

  @override
  String get settings_theme_dark => 'Umwijima';

  @override
  String get event_detail_title => 'Amakuru y\'igikorwa';

  @override
  String get event_create_title => 'Kurema igikorwa';

  @override
  String get event_edit_action => 'Hindura';

  @override
  String get event_assign_action => 'Gushyira ku gikorwa';

  @override
  String get event_mark_attendance_action => 'Andika uko witabiriye';

  @override
  String get event_notify_action => 'Menyesha';

  @override
  String get event_history_title => 'Amateka';

  @override
  String get event_audit_title => 'Inyandiko z\'igenzura';

  @override
  String get event_type_choir_service => 'Iteraniro rya Korali';

  @override
  String get event_type_concert => 'Ikinamico';

  @override
  String get event_type_protocol_service => 'Serivisi ya Protocol';

  @override
  String get event_type_church_event => 'Igikorwa cy\'itorero';

  @override
  String get event_ministry_both => 'Byombi';

  @override
  String get event_filter_all_types => 'Ubwoko bwose';

  @override
  String get event_filter_ministry_all => 'Amatorero yose';

  @override
  String get event_view_month => 'Ukwezi';

  @override
  String get event_view_week => 'Icyumweru';

  @override
  String get event_start_label => 'Itangira';

  @override
  String get event_end_label => 'Irangira';

  @override
  String get event_location_label => 'Aho bibera';

  @override
  String get event_description_label => 'Ibisobanuro';

  @override
  String get event_recurrence_label => 'Gusubiramo';

  @override
  String get event_conflict_error => 'Amasaha ntahura';

  @override
  String get event_created_success => 'Igikorwa cyaremwe';

  @override
  String get event_assigned_members_title => 'Abashyizwe ku gikorwa';

  @override
  String get event_attendance_title => 'Uko witabiriye';

  @override
  String get dashboard_section_overview => 'Incamake';

  @override
  String get dashboard_kpi_upcoming_events => 'Ibikorwa biri imbere';

  @override
  String get dashboard_kpi_upcoming_assignments => 'Imirimo iri imbere';

  @override
  String get dashboard_kpi_pending_swaps => 'Gusimburana bitegereje';

  @override
  String get dashboard_kpi_pending_replacements => 'Gusimbura bitegereje';

  @override
  String get dashboard_kpi_attendance_rate => 'Igipimo cy\'uko witabiriye';

  @override
  String get dashboard_kpi_active_discipline => 'Imyitwarire ikomeje';

  @override
  String get dashboard_kpi_sync_conflicts => 'Amakimbirane yo guhuza';

  @override
  String get dashboard_kpi_finance_balance => 'Imari isigaye';

  @override
  String get sync_conflicts_title => 'Amakimbirane yo guhuza';

  @override
  String get sync_last_sync => 'Guhuza bwa nyuma';

  @override
  String sync_failed_count(int count) {
    return 'Byanze: $count';
  }

  @override
  String get sync_retry_action => 'Ongera ugerageze';

  @override
  String get sync_conflict_reason => 'Impamvu';

  @override
  String get attendance_bulk_title => 'Andika uko witabiriye benshi';

  @override
  String get attendance_bulk_save => 'Bika bose';

  @override
  String get assignment_validate_action => 'Genzura mbere';

  @override
  String get assignment_conflict_warning => 'Hari guhura kw\'amasaha';

  @override
  String get assignment_quota_warning => 'Umubare warengeje';

  @override
  String get member_availability_title => 'Kuboneka kw\'umunyamuryango';

  @override
  String get member_unavailable_dates_label => 'Iminsi adaboneka';

  @override
  String get common_create => 'Kurema';

  @override
  String get common_retry => 'Ongera ugerageze';

  @override
  String get nav_coverage => 'Coverage';

  @override
  String get attendance_governance_title => 'Gukurikirana attendance';

  @override
  String get attendance_mark_all_present => 'Bose bashyireho ko baje';

  @override
  String get attendance_excuse_review_title => 'Gusuzuma excuses';

  @override
  String get attendance_excuse_no_reason => 'Nta mpamvu yatanzwe';

  @override
  String get attendance_select_event_hint =>
      'Hitamo igikorwa kugira ngo urutonde rupakire';

  @override
  String get attendance_roster_empty => 'Nta munyamuryango ufite inshingano';

  @override
  String get attendance_reliability_title => 'Ubwitange';

  @override
  String attendance_reliability_subtitle(Object band, Object percentage) {
    return '$percentage% · $band';
  }

  @override
  String get attendance_excuse_request_title => 'Saba absence yemewe';

  @override
  String get attendance_excuse_request_subtitle =>
      'Ohereza excuse ku murimo uri imbere.';

  @override
  String get attendance_excuse_reason_label => 'Impamvu';

  @override
  String get attendance_excuse_submit_action => 'Ohereza excuse';

  @override
  String attendance_excuse_submitted(Object eventName) {
    return 'Excuse yoherejwe kuri $eventName';
  }

  @override
  String get attendance_recent_title => 'Attendance ya vuba';

  @override
  String get attendance_recent_empty => 'Nta mateka';

  @override
  String get attendance_status_attended => 'Yitabiriye';

  @override
  String get attendance_status_replacement => 'Yakuyemo undi';

  @override
  String get attendance_status_voluntary => 'Serivisi y\'ubushake';

  @override
  String get attendance_excuse_illness => 'Indwara';

  @override
  String get attendance_excuse_travel => 'Urugendo';

  @override
  String get attendance_excuse_work_school => 'Akazi cyangwa ishuri';

  @override
  String get attendance_excuse_emergency => 'Ubwoba';

  @override
  String get attendance_excuse_family => 'Umuryango';

  @override
  String get attendance_excuse_approved_leave => 'Uruhushya rwemewe';

  @override
  String get attendance_excuse_conflict => 'Impaka itiruka';

  @override
  String get attendance_excuse_unknown => 'Ntibizwi';

  @override
  String get coverage_analytics_title => 'Analytics za coverage';

  @override
  String get coverage_analytics_swaps => 'Swaps';

  @override
  String get coverage_analytics_replacements => 'Replacements';

  @override
  String get coverage_analytics_voluntary => 'Serivisi y\'ubushake';

  @override
  String get coverage_analytics_unresolved => 'Swaps zitarakemuka';

  @override
  String get coverage_readiness_title => 'Readiness';

  @override
  String get coverage_readiness_empty => 'Nta burira';

  @override
  String get coverage_team_head_title => 'Team head';

  @override
  String get coverage_team_head_empty => 'Nta ikibazo cya coverage';

  @override
  String get coverage_coordinator_title => 'Coordinator';

  @override
  String get coverage_coordinator_empty => 'Nta case y\'escalade';

  @override
  String get coverage_escalated_title => 'Escalade';

  @override
  String get coverage_open_swaps => 'Gucunga swaps';

  @override
  String get coverage_open_replacements => 'Gucunga replacements';

  @override
  String get coverage_swaps_empty => 'Nta swap';

  @override
  String get coverage_readiness_ready => 'Byiteguye';

  @override
  String get coverage_readiness_replacement_pending =>
      'Replacement itegekereje';

  @override
  String get coverage_readiness_attendance_risk => 'Risk ya attendance';

  @override
  String get coverage_readiness_staffing_shortage => 'Abantu bake';

  @override
  String get coverage_readiness_operational_danger => 'Danger';

  @override
  String get attendance_tab_marking => 'Gushyira ikimenyetso';

  @override
  String get attendance_tab_choir => 'Choir';

  @override
  String get attendance_tab_oversight => 'Kugenzura';

  @override
  String get attendance_choir_title => 'Attendance ya choir';

  @override
  String get attendance_choir_marked => 'Byashyizweho';

  @override
  String get attendance_choir_excused => 'Byirengagijwe';

  @override
  String get attendance_choir_unexcused => 'Nta mpamvu';

  @override
  String get attendance_choir_lateness => 'Gutinda';

  @override
  String get attendance_choir_pending_review => 'Bitegereje isuzuma';

  @override
  String get attendance_discipline_title => 'Ibyifuzo by\'ubunyangamugayo';

  @override
  String get attendance_discipline_subtitle =>
      'Isuzuma rya pastoral risaba — ntabwo ari ibihano byikora.';

  @override
  String get attendance_discipline_empty => 'Nta byifuzo ubu.';

  @override
  String get attendance_discipline_create =>
      'Fungura urubanza rw\'ubunyangamugayo';

  @override
  String get attendance_discipline_created =>
      'Urubanza rw\'ubunyangamugayo rwashyizweho.';

  @override
  String get coverage_escalate_team_head => 'Ohereza ku team head';

  @override
  String get coverage_escalate_coordinator => 'Ohereza ku coordinator';

  @override
  String get coverage_escalate_president => 'Ohereza ku president';

  @override
  String get phoneRequired =>
      'Nimero ya telefoni irakenewe kugira ngo ukomeze.';

  @override
  String get updatePhoneNow => 'Hindura nonaha';

  @override
  String get restrictedUntilPhoneAdded =>
      'Nimero ya telefoni irakenewe kugira ngo ukomeze imirimo y\'umurimo.';

  @override
  String get warningPhoneIncomplete =>
      'Uzuze nimero ya telefoni kugira ngo utazabura uburyo bwo gukoresha ibikoresho by\'umurimo.';

  @override
  String get my_contributions_title => 'Imisanzu yanjye';

  @override
  String get my_contributions_member_number => 'Nomero y\'umunyamuryango';

  @override
  String get my_contributions_history_title => 'Amateka y\'imisanzu';

  @override
  String get my_contributions_total => 'Imisanzu yose';

  @override
  String get my_contributions_outstanding => 'Amafaranga asigaye';

  @override
  String get my_contributions_ack_sent => 'Imurakoze yoherejwe';

  @override
  String get my_contributions_ack_pending => 'Bitegereje';

  @override
  String get my_contributions_ack_failed => 'Byanze';

  @override
  String get operational_units_title => 'Ibice bikora';

  @override
  String get operational_unit_detail_title => 'Igice';

  @override
  String get ministries_title => 'Ministéri';

  @override
  String get ministry_detail_title => 'Ministéri';

  @override
  String get families_title => 'Imiryango';

  @override
  String get search_group_welfare_cases => 'Ubusabane';

  @override
  String get search_group_songs => 'Indirimbo';

  @override
  String get search_group_rehearsals => 'Imyitozo';

  @override
  String get welfare_title => 'Ubusabane';

  @override
  String get welfare_open_cases => 'Ubusabane bufunguye';

  @override
  String get welfare_funds_raised => 'Amafaranga yegeranyijwe';

  @override
  String get welfare_raised => 'Byegeranyijwe';

  @override
  String get welfare_remaining => 'Bisigaye';

  @override
  String get welfare_amount => 'Amafaranga';

  @override
  String get welfare_contribute => 'Tanga';

  @override
  String get music_title => 'Ububiko bw\'indirimbo';

  @override
  String get music_usage_count => 'Ikoreshwa';

  @override
  String get rehearsals_title => 'Imyitozo';

  @override
  String get rehearsals_readiness => 'Gutegura';

  @override
  String get rehearsals_attendance => 'Kwitabira';

  @override
  String get rehearsals_plan => 'Gahunda';

  @override
  String get rehearsals_reports => 'Raporo';

  @override
  String get rehearsals_prep_score => 'Gutegura gusenga';

  @override
  String get welfare_create_title => 'Fungura ubusabane';

  @override
  String get welfare_field_title => 'Umutwe';

  @override
  String get welfare_field_description => 'Ibisobanuro';

  @override
  String get welfare_field_member_id => 'ID y\'umunyamuryango';

  @override
  String get welfare_category => 'Icyiciro';

  @override
  String get welfare_submit_case => 'Ohereza';

  @override
  String get welfare_assistance_title => 'Andika ubufasha';

  @override
  String get welfare_assistance_type => 'Ubwoko bw\'ubufasha';

  @override
  String get welfare_record_assistance => 'Andika ubufasha';

  @override
  String get welfare_reports_title => 'Raporo z\'ubusabane';

  @override
  String get welfare_assistance_total => 'Ubufasha bwose';

  @override
  String get welfare_tab_overview => 'Incamake';

  @override
  String get welfare_timeline => 'Amateka';

  @override
  String get welfare_timeline_empty => 'Nta makuru y\'amateka.';

  @override
  String get welfare_contributions => 'Imisanzu';

  @override
  String get welfare_offline_banner =>
      'Amakuru abitswe. Kura hasi kugira ngo usubiremo kuri interineti.';

  @override
  String get music_favorites => 'Ibikunzwe';

  @override
  String get music_favorite => 'Ongeraho mu bikunzwe';

  @override
  String get music_unfavorite => 'Kuraho mu bikunzwe';

  @override
  String get music_recent => 'Byasuzumwe vuba';

  @override
  String get music_lyrics => 'Amagambo';

  @override
  String get music_assets => 'Dosiye';

  @override
  String get common_back => 'Subira inyuma';

  @override
  String get common_next => 'Ibikurikira';

  @override
  String get search_group_welfare_categories => 'Ibyiciro by\'ubusabane';

  @override
  String get search_group_choir_documents => 'Inyandiko z\'ikorali';

  @override
  String get search_group_choir_meetings => 'Inama z\'ikorali';

  @override
  String get search_group_welfare_assistance => 'Ubufasha bw\'ubusabane';
}

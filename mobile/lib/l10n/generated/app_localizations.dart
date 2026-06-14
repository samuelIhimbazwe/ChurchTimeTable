import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [
    Locale('rw'),
    Locale('en'),
    Locale('fr'),
  ];

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _catalog = {
    'rw': {
      'app_title': 'CMMS',
      'app_tagline': 'Sisitemu yo gucunga itorero',
      'nav_home': 'Ahabanza',
      'nav_members': 'Abanyamuryango',
      'nav_events': 'Ibirori',
      'nav_more': 'Ibindi',
      'members_title': 'Abanyamuryango',
      'member_profile_title': 'Umwirondoro w\'umunyamuryango',
      'member_profile_timeline': 'Ibikorwa by\'umunyamuryango',
      'member_profile_timeline_empty': 'Nta bikorwa biraboneka.',
      'member_profile_status': 'Imiterere',
      'member_profile_voice': 'Ijwi',
      'member_profile_family': 'Umuryango',
      'member_profile_welfare': 'Dosiye z\'ubufasha zifunguye',
      'members_empty': 'Nta banyamuryango babonetse.',
      'dashboard_welcome': 'Murakaza neza, {name}',
      'auth_email_label': 'Imeri',
      'auth_password_label': 'Ijambo banga',
      'auth_email_invalid': 'Andika imeri yemewe',
      'auth_password_min_length': 'Ijambo banga rigomba kugira inyuguti 6',
      'auth_login_failed': 'Kwinjira byanze',
      'validation_required': 'Uyu murandiko urakeneka',
      'onboarding_signup_title': 'Kwiyandikisha mu murimo',
      'onboarding_signup_first_name': "Izina ry'ibanze",
      'onboarding_signup_last_name': "Izina ry'umuryango",
      'onboarding_signup_phone': 'Telefone',
      'onboarding_signup_national_id': 'Indangamuntu',
      'onboarding_signup_national_id_hint': "Nomero y'indangamuntu (imibare 16)",
      'onboarding_signup_terms_label': "Nemera amategeko n'amabwiriza",
      'onboarding_signup_terms_required': 'Ugomba kwemera amategeko kugira ngo wiyandikishe',
      'onboarding_signup_ministry': 'Umurimo',
      'onboarding_signup_ministry_choir': 'Korali',
      'onboarding_signup_ministry_protocol': 'Protocol',
      'onboarding_signup_ministry_both': 'Imirimo ibiri',
      'onboarding_signup_ministry_choir_desc': 'Gukorera mu gusenga binyuze mu ndirimbo n\'imyiteguro.',
      'onboarding_signup_ministry_protocol_desc': 'Kwakira no gukurikirana serivisi z\'itorero.',
      'onboarding_signup_ministry_both_desc': 'Ukora mu korali na protocol.',
      'onboarding_signup_confirm_password': 'Emeza ijambo banga',
      'onboarding_signup_password_mismatch': 'Amagambo y\'ibanga ntahura.',
      'onboarding_signup_approval_note': 'Nyuma yo kohereza, umuyobozi azasuzuma kwiyandikisha kwawe.',
      'onboarding_signup_back': 'Subira inyuma',
      'onboarding_signup_continue': 'Komeza',
      'onboarding_signup_submit': 'Ohereza kwiyandikisha',
      'onboarding_signup_have_account': 'Usanzwe ufite konti? Injira',
      'onboarding_pending_eyebrow': 'Kwiyandikisha kwakiriwe',
      'onboarding_pending_title': 'Icyifuzo cyawe gisuzumwa',
      'onboarding_pending_greeting': 'Murakoze, {name}.',
      'onboarding_pending_body': 'Kwiyandikisha kwawe mu murimo kwakiriwe.',
      'onboarding_pending_step_review': 'Umuyobozi azasuzuma amakuru yawe.',
      'onboarding_pending_step_notify': 'Uzakira ubutumwa igihe icyemezo cyakozwe.',
      'onboarding_pending_step_access': 'Niyo wemewe, uzabona gahunda n\'amakuru y\'umurimo.',
      'onboarding_pending_help': 'Vugana n\'umuyobozi wa korali cyangwa wa protocol niba ukeneye ubufasha.',
      'dashboard_member_title': 'Ikibaho cyanjye',
      'dashboard_leader_title': "Ikibaho cy'umuyobozi",
      'nav_calendar': "Kalendari y'ibikorwa",
      'nav_attendance': 'Uko witabiriye',
      'nav_swaps': 'Gusimburana',
      'nav_replacements': 'Gusimbura',
      'nav_discipline': 'Imyitwarire',
      'nav_finance': 'Imari ya Korali',
      'nav_notifications': 'Amakuru',
      'nav_sync': 'Guhuza amakuru',
      'nav_assignments': 'Gushyira ku gikorwa',
      'nav_choir_rotation': 'Guhinduranya muri Korali',
      'nav_budgets': "Ingengo y'imari",
      'nav_settings': 'Igenamiterere',
      'member_attendance_label': 'Uko witabiriye',
      'attendance_status_present': 'Yitabiriye',
      'attendance_status_absent': 'Ntiyitabiriye',
      'attendance_status_late': 'Yakererewe',
      'attendance_status_excused': 'Yasobanuye impamvu',
      'attendance_status_unexcused': 'Nta mpamvu yumvikana',
      'attendance_save_action': 'Bika uko witabiriye',
      'attendance_saved_success': 'Uko witabiriye kwawe cyabitswe',
      'attendance_queued_offline': 'Byateguwe kwoherezwa nta murandasi',
      'attendance_notes_label': 'Inyandiko',
      'event_picker_label': 'Hitamo igikorwa',
      'member_picker_label': 'Hitamo umunyamuryango',
      'swap_list_title': 'Gusimburana',
      'swap_request_action': 'Saba gusimburana',
      'swap_accept_action': 'Emera gusimburana',
      'swap_reject_action': 'Wanga',
      'swap_leader_approve_action': "Emera n'umuyobozi",
      'swap_finalize_action': 'Sohora gusimburana',
      'replacement_title': 'Gusimbura',
      'replacement_request_action': 'Saba gusimbura',
      'discipline_title': 'Imyitwarire',
      'finance_summary_title': 'Imari ya Korali',
      'sync_title': 'Guhuza amakuru',
      'sync_now_action': 'Huza ubu',
      'sync_pending_count': 'Ibitegereje guhuza',
      'settings_title': 'Igenamiterere',
      'settings_language_title': 'Ururimi',
      'settings_language_subtitle': 'Hitamo ururimi ukoresha mu gikorwa',
      'language_kinyarwanda': 'Ikinyarwanda',
      'language_english': 'Icyongereza',
      'language_french': 'Igifaransa',
      'language_changed_success': 'Ururimi rwahinduwe',
      'common_refresh': 'Ongera',
      'common_save': 'Bika',
      'common_cancel': 'Hagarika',
      'common_logout': 'Sohoka',
      'common_loading': 'Tegereza...',
      'error_conflict': "Habonetse ikibazo cyo guhura kw'amasaha cyangwa gahunda",
      'error_unauthorized': 'Ntushobora kwinjira',
      'error_forbidden': 'Nta burenganzira',
      'error_not_found': 'Ntibibonetse',
      'error_validation': 'Amakuru si yo',
      'error_business_rule': 'Iki gikorwa nticyemewe',
      'error_network': 'Imiyoboro nta murandasi',
      'error_unknown': 'Habaye ikosa',
      'member_name_fallback': 'Umunyamuryango',
      'sync_pending_hint': 'Ibitegereje mu murongo',
      'sync_queued_items_title': 'Ibitegereje',
      'sync_offline_skipped': 'Nta murandasi',
      'sync_queue_empty_skipped': 'Nta kintu mu murongo',
      'notifications_title': 'Amakuru',
      'assignments_title': 'Gushyira ku gikorwa',
      'choir_rotation_title': 'Guhinduranya aboro',
      'budgets_title': "Ingengo y'imari",
      'calendar_selected_day': "Ibikorwa by'uyu munsi",
      'replacement_event_id_label': "ID y'igikorwa",
      'replacement_absent_member_label': 'Umunyamuryango adahari (si ngombwa)',
      'replacement_cover_member_label': 'Umusimbura (si ngombwa)',
      'replacement_requested_success': 'Gusimbura byasabwe',
      'swap_with_member_label': 'Guhindurana na',
      'swap_details_title': "Amakuru y'guhindurana",
      'common_approve': 'Emera',
      'common_finalize': 'Sohora',
      'finance_income_label': 'Inyungu',
      'finance_expense_label': 'Amafaranga yasohotse',
      'finance_balance_label': 'Asigaye',
      'finance_unpaid_label': 'Ideni risigaye',
      'budget_name_label': "Izina ry'ingengo",
      'budget_amount_label': 'Amafaranga',
      'budget_create_action': 'Kurema ingengo',
      'choir_refresh_pool_action': 'Ongera urutonde',
      'choir_auto_assign_action': 'Gushyira mu buryo bwikora',
      'assignment_manual_override_label': "Guhindura mu buryo bw'umuntu",
      'assignment_override_reason_label': 'Impamvu yo guhindura',
      'assignment_add_member_label': 'Ongeraho umunyamuryango',
      'assignment_bulk_assign_action': 'Gushyira benshi',
      'term_choir': 'Korali',
      'term_protocol': 'Protocol',
      'term_attendance': 'Uko witabiriye',
      'term_discipline': 'Imyitwarire',
      'term_rehearsal': 'Imyitozo',
      'term_worship_service': 'Iteraniro',
      'term_member': 'Umunyamuryango',
      'term_announcement': 'Itangazo',
      'term_schedule': 'Gahunda',
      'term_responsibility': 'Inshingano',
      'term_replacement': 'Gusimbura',
      'term_swap': 'Gusimburana',
      'term_event': 'Igikorwa',
      'term_leader': 'Umuyobozi',
      'term_committee': 'Komite',
      'term_treasurer': 'Umubitsi',
      'term_secretary': 'Umunyamabanga',
      'swap_request_sent': '{memberName} yasabye ko musimburana',
      'swap_status_updated': 'Impinduka ku gusimburana: {statusLabel}',
      'swap_list_item_subtitle': '{eventName} · {statusLabel}',
      'attendance_marked_for_event':
          'Uko witabiriye kwawe kuri {eventName} byanditswe',
      'discipline_case_opened':
          "Ikibazo cy'imyitwarire cyafunguwe: {caseTitle}",
      'dues_remaining': 'Asigaye: {amount}',
      'event_assigned_to_you': 'Washyizwe ku gikorwa: {eventName}',
      'replacement_requested_for_event':
          'Gusimbura byasabwe kuri {eventName}',
      'replacement_list_title': 'Urutonde rwa gusimbura',
      'replacement_list_empty': 'Nta gusimbura kuri ubu',
      'replacement_list_item_subtitle':
          '{eventName} · {absentName} → {coverName}',
      'swap_status_requested': 'Byasabwe',
      'swap_status_target_accepted': "Byemewe n'uwusimburwa",
      'swap_status_target_rejected': "Byanze n'uwusimburwa",
      'swap_status_leader_pending': 'Bitegereje umuyobozi',
      'swap_status_approved': "Byemewe n'umuyobozi",
      'swap_status_rejected': 'Byanze',
      'swap_status_finalized': 'Byarangiye',
      'swap_status_cancelled': 'Byahagaritswe',
      'replacement_status_requested': 'Byasabwe',
      'replacement_status_leader_pending': 'Bitegereje umuyobozi',
      'replacement_status_approved': 'Byemewe',
      'replacement_status_rejected': 'Byanze',
      'replacement_status_finalized': 'Byarangiye',
      'discipline_stage_reported': 'Byatangajwe',
      'discipline_stage_under_review': 'Birasuzumwa',
      'discipline_stage_decision_pending': 'Icyemezo gitegerejwe',
      'discipline_stage_actioned': 'Byafatiwe icyemezo',
      'discipline_stage_closed': 'Byarangiye',
      'enum_status_unknown': 'Ntibisobanutse',
      'settings_appearance_title': 'Isura',
      'settings_theme_system': 'Ukurikije sisitemu',
      'settings_theme_light': 'Urumuri',
      'settings_theme_dark': 'Umwijima',
      'event_detail_title': "Amakuru y'igikorwa",
      'event_create_title': 'Kurema igikorwa',
      'event_assign_action': 'Gushyira ku gikorwa',
      'event_mark_attendance_action': 'Andika uko witabiriye',
      'event_audit_title': "Inyandiko z'igenzura",
      'event_type_choir_service': 'Iteraniro rya Korali',
      'event_type_concert': 'Ikinamico',
      'event_type_protocol_service': 'Serivisi ya Protocol',
      'event_type_church_event': "Igikorwa cy'itorero",
      'event_ministry_both': 'Byombi',
      'event_filter_all_types': 'Ubwoko bwose',
      'event_filter_ministry_all': 'Amatorero yose',
      'event_view_month': 'Ukwezi',
      'event_view_week': 'Icyumweru',
      'event_start_label': 'Itangira',
      'event_end_label': 'Irangira',
      'event_location_label': 'Aho bibera',
      'event_description_label': 'Ibisobanuro',
      'event_recurrence_label': 'Gusubiramo',
      'event_conflict_error': 'Amasaha ntahura',
      'event_created_success': 'Igikorwa cyaremwe',
      'event_assigned_members_title': 'Abashyizwe ku gikorwa',
      'event_attendance_title': 'Uko witabiriye',
      'dashboard_section_overview': 'Incamake',
      'dashboard_kpi_upcoming_events': 'Ibikorwa biri imbere',
      'dashboard_kpi_upcoming_assignments': 'Imirimo iri imbere',
      'dashboard_kpi_pending_swaps': 'Gusimburana bitegereje',
      'dashboard_kpi_pending_replacements': 'Gusimbura bitegereje',
      'dashboard_kpi_attendance_rate': "Igipimo cy'uko witabiriye",
      'dashboard_kpi_active_discipline': 'Imyitwarire ikomeje',
      'dashboard_kpi_sync_conflicts': 'Amakimbirane yo guhuza',
      'dashboard_kpi_finance_balance': 'Imari isigaye',
      'sync_conflicts_title': 'Amakimbirane yo guhuza',
      'sync_last_sync': 'Guhuza bwa nyuma',
      'sync_failed_count': 'Byanze: {count}',
      'sync_retry_action': 'Ongera ugerageze',
      'sync_conflict_reason': 'Impamvu',
      'attendance_bulk_title': 'Andika uko witabiriye benshi',
      'attendance_bulk_save': 'Bika bose',
      'assignment_validate_action': 'Genzura mbere',
      'assignment_conflict_warning': "Hari guhura kw'amasaha",
      'member_availability_title': "Kuboneka kw'umunyamuryango",
      'member_unavailable_dates_label': 'Iminsi adaboneka',
      'common_create': 'Kurema',
      'common_retry': 'Ongera ugerageze',
      'sync_result_applied': 'Byakoreshejwe: {applied}, Byanze: {rejected}',
      'budget_amount_subtitle': 'Amafaranga: {amount}',
      'choir_eligible_members_label': 'Abemerewe: {count}',
      'choir_slot_subtitle': 'Umurongo #{slot}',
      'choir_assigned_count_message':
          'Byashyizwe ku banyamuryango {count}',
      'assignment_queue_title': 'Urutonde ({count})',
      'assignment_members_assigned_message':
          'Byashyizwe ku banyamuryango {count}',
      'nav_coverage': 'Coverage',
      'attendance_governance_title': 'Gukurikirana attendance',
      'attendance_mark_all_present': 'Bose bashyireho ko baje',
      'attendance_excuse_review_title': 'Gusuzuma excuses',
      'attendance_excuse_no_reason': 'Nta mpamvu yatanzwe',
      'attendance_select_event_hint': 'Hitamo igikorwa kugira ngo urutonde rupakire',
      'attendance_roster_empty': 'Nta munyamuryango ufite inshingano',
      'attendance_reliability_title': 'Ubwitange',
      'attendance_reliability_subtitle': '{percentage}% · {band}',
      'attendance_excuse_request_title': 'Saba absence yemewe',
      'attendance_excuse_request_subtitle': 'Ohereza excuse ku murimo uri imbere.',
      'attendance_excuse_reason_label': 'Impamvu',
      'attendance_excuse_submit_action': 'Ohereza excuse',
      'attendance_excuse_submitted': 'Excuse yoherejwe kuri {eventName}',
      'attendance_recent_title': 'Attendance ya vuba',
      'attendance_recent_empty': 'Nta mateka',
      'attendance_status_attended': 'Yitabiriye',
      'attendance_status_replacement': 'Yakuyemo undi',
      'attendance_status_voluntary': "Serivisi y'ubushake",
      'attendance_excuse_illness': 'Indwara',
      'attendance_excuse_travel': 'Urugendo',
      'attendance_excuse_work_school': 'Akazi cyangwa ishuri',
      'attendance_excuse_emergency': 'Ubwoba',
      'attendance_excuse_family': 'Umuryango',
      'attendance_excuse_approved_leave': 'Uruhushya rwemewe',
      'attendance_excuse_conflict': 'Impaka itiruka',
      'attendance_excuse_unknown': 'Ntibizwi',
      'coverage_analytics_title': 'Analytics za coverage',
      'coverage_analytics_swaps': 'Swaps',
      'coverage_analytics_replacements': 'Replacements',
      'coverage_analytics_voluntary': "Serivisi y'ubushake",
      'coverage_analytics_unresolved': 'Swaps zitarakemuka',
      'coverage_readiness_title': 'Readiness',
      'coverage_readiness_empty': 'Nta burira',
      'coverage_team_head_title': 'Team head',
      'coverage_team_head_empty': 'Nta ikibazo cya coverage',
      'coverage_coordinator_title': 'Coordinator',
      'coverage_coordinator_empty': 'Nta case y\'escalade',
      'coverage_escalated_title': 'Escalade',
      'coverage_open_swaps': 'Gucunga swaps',
      'coverage_open_replacements': 'Gucunga replacements',
      'coverage_swaps_empty': 'Nta swap',
      'coverage_readiness_ready': 'Byiteguye',
      'coverage_readiness_replacement_pending': 'Replacement itegekereje',
      'coverage_readiness_attendance_risk': 'Risk ya attendance',
      'coverage_readiness_staffing_shortage': 'Abantu bake',
      'coverage_readiness_operational_danger': 'Danger',
      'attendance_tab_marking': 'Gushyira ikimenyetso',
      'attendance_tab_choir': 'Choir',
      'attendance_tab_oversight': 'Kugenzura',
      'attendance_choir_title': 'Attendance ya choir',
      'attendance_choir_marked': 'Byashyizweho',
      'attendance_choir_excused': 'Byirengagijwe',
      'attendance_choir_unexcused': 'Nta mpamvu',
      'attendance_choir_lateness': 'Gutinda',
      'attendance_choir_pending_review': 'Bitegereje isuzuma',
      'attendance_discipline_title': 'Ibyifuzo by\'ubunyangamugayo',
      'attendance_discipline_subtitle':
          'Isuzuma rya pastoral risaba — ntabwo ari ibihano byikora.',
      'attendance_discipline_empty': 'Nta byifuzo ubu.',
      'attendance_discipline_create': 'Fungura urubanza rw\'ubunyangamugayo',
      'attendance_discipline_created':
          'Urubanza rw\'ubunyangamugayo rwashyizweho.',
      'coverage_escalate_team_head': 'Ohereza ku team head',
      'coverage_escalate_coordinator': 'Ohereza ku coordinator',
      'coverage_escalate_president': 'Ohereza ku president',
      'phoneRequired': 'Nimero ya telefoni irakenewe kugira ngo ukomeze.',
      'updatePhoneNow': 'Hindura nonaha',
      'restrictedUntilPhoneAdded':
          'Nimero ya telefoni irakenewe kugira ngo ukomeze imirimo y\'umurimo.',
      'warningPhoneIncomplete':
          'Uzuze nimero ya telefoni kugira ngo utazabura uburyo bwo gukoresha ibikoresho by\'umurimo.',
      'my_contributions_title': 'Imisanzu yanjye',
      'my_contributions_member_number': 'Nomero y\'umunyamuryango',
      'my_contributions_history_title': 'Amateka y\'imisanzu',
      'my_contributions_total': 'Imisanzu yose',
      'my_contributions_outstanding': 'Amafaranga asigaye',
      'my_contributions_ack_sent': 'Imurakoze yoherejwe',
      'my_contributions_ack_pending': 'Bitegereje',
      'my_contributions_ack_failed': 'Byanze',
      'operational_units_title': 'Ibice bikora',
      'operational_unit_detail_title': 'Igice',
      'ministries_title': 'Ministéri',
      'ministry_detail_title': 'Ministéri',
      'families_title': 'Imiryango',
      'families_head': 'Umutwe',
      'families_member_count': 'Abanyamuryango',
      'families_health_score': 'Amanota y\'ubuzima',
      'families_attendance': 'Kwitabira',
      'families_contributions': 'Umusanzu',
      'families_participation': 'Urugendo',
      'search_title': 'Shakisha',
      'search_placeholder': 'Shakisha abanyamuryango, imiryango, ibikorwa…',
      'search_group_members': 'Abanyamuryango',
      'search_group_families': 'Imiryango',
      'search_group_events': 'Ibikorwa',
      'search_group_assignments': 'Inshingano',
      'search_group_contributions': 'Umusanzu',
      'search_group_welfare_cases': 'Ubusabane',
      'search_group_songs': 'Indirimbo',
      'search_group_rehearsals': 'Imyitozo',
      'welfare_title': 'Ubusabane',
      'welfare_open_cases': 'Ubusabane bufunguye',
      'welfare_funds_raised': 'Amafaranga yegeranyijwe',
      'welfare_raised': 'Byegeranyijwe',
      'welfare_remaining': 'Bisigaye',
      'welfare_amount': 'Amafaranga',
      'welfare_contribute': 'Tanga',
      'music_title': 'Ububiko bw\'indirimbo',
      'music_usage_count': 'Ikoreshwa',
      'rehearsals_title': 'Imyitozo',
      'rehearsals_readiness': 'Gutegura',
      'rehearsals_attendance': 'Kwitabira',
      'rehearsals_plan': 'Gahunda',
      'rehearsals_reports': 'Raporo',
      'rehearsals_prep_score': 'Gutegura gusenga',
      'welfare_create_title': 'Fungura ubusabane',
      'welfare_field_title': 'Umutwe',
      'welfare_field_description': 'Ibisobanuro',
      'welfare_field_member_id': 'ID y\'umunyamuryango',
      'welfare_category': 'Icyiciro',
      'welfare_submit_case': 'Ohereza',
      'welfare_assistance_title': 'Andika ubufasha',
      'welfare_assistance_type': 'Ubwoko bw\'ubufasha',
      'welfare_record_assistance': 'Andika ubufasha',
      'welfare_reports_title': 'Raporo z\'ubusabane',
      'welfare_assistance_total': 'Ubufasha bwose',
      'welfare_tab_overview': 'Incamake',
      'welfare_timeline': 'Amateka',
      'welfare_timeline_empty': 'Nta makuru y\'amateka.',
      'welfare_contributions': 'Imisanzu',
      'welfare_offline_banner': 'Amakuru abitswe. Kura hasi kugira ngo usubiremo kuri interineti.',
      'music_favorites': 'Ibikunzwe',
      'music_favorite': 'Ongeraho mu bikunzwe',
      'music_unfavorite': 'Kuraho mu bikunzwe',
      'music_recent': 'Byasuzumwe vuba',
      'music_lyrics': 'Amagambo',
      'music_assets': 'Dosiye',
      'common_back': 'Subira inyuma',
      'common_next': 'Ibikurikira',
      'common_retry': 'Ongera ugerageze',
      'search_group_welfare_categories': 'Ibyiciro by\'ubusabane',
      'search_group_choir_documents': 'Inyandiko z\'ikorali',
      'search_group_choir_meetings': 'Inama z\'ikorali',
      'search_group_welfare_assistance': 'Ubufasha bw\'ubusabane',
      'nav_operational': 'Operational center',
      'operational_title': 'Operational center',
      'operational_unauthorized': 'Nta burenganzira bwo kuyobora ufite.',
      'operational_subtitle_president': 'Protocol president — incamake y\'ubuyobozi.',
      'operational_subtitle_coordinator': 'Protocol coordinator — imikorere y\'amatsinda.',
      'operational_subtitle_team_head': 'Protocol team head — urwego rw\'itsinda ryawe.',
      'operational_subtitle_choir_leader': 'Choir operations — koresha attendance.',
      'operational_workflows_title': 'Imikorere y\'ingenzi',
      'operational_open_attendance': 'Attendance governance',
      'operational_open_coverage': 'Coverage management',
      'operational_choir_summary_title': 'Imikorere ya Korali',
      'operational_choir_summary_hint': 'Fungura attendance kugira ngo ubone incamake.',
      'operational_stat_active_teams': 'Amatsinda akora',
      'operational_stat_escalated': 'Ibyatevye imbere',
      'operational_stat_pending_replacements': 'Replacements zitegereje',
      'operational_stat_discipline_risk': 'Ibyago bya discipline',
      'operational_stat_readiness': 'Iburira rya readiness',
      'operational_stat_teams': 'Amatsinda yawe',
      'operational_stat_pending_absences': 'Absences zitegereje',
      'devotion_center_title': 'Ikigo cy\'Imyizerere',
      'devotion_pinned': 'Ubutumwa buhambaye',
      'devotion_verse_of_day': 'Icyanditswe cy\'umunsi',
      'devotion_encouragement': 'Inkuru y\'ibyishimo',
      'devotion_share': 'Sangiza',
      'devotion_open_center': 'Fungura ikigo cy\'imyizerere',
    },
    'en': {
      'app_title': 'CMMS',
      'app_tagline': 'Church management system',
      'nav_home': 'Home',
      'nav_members': 'Members',
      'nav_events': 'Events',
      'nav_more': 'More',
      'members_title': 'Members',
      'member_profile_title': 'Member profile',
      'member_profile_timeline': 'Activity timeline',
      'member_profile_timeline_empty': 'No activity recorded yet.',
      'member_profile_status': 'Status',
      'member_profile_voice': 'Voice section',
      'member_profile_family': 'Family',
      'member_profile_welfare': 'Open welfare cases',
      'members_empty': 'No members found yet.',
      'dashboard_welcome': 'Welcome back, {name}',
      'auth_email_label': 'Email',
      'auth_password_label': 'Password',
      'auth_email_invalid': 'Enter a valid email address',
      'auth_password_min_length': 'Password must be at least 6 characters',
      'auth_login_failed': 'Sign in failed',
      'auth_create_account': 'Create an account',
      'validation_required': 'This field is required',
      'onboarding_signup_title': 'Ministry registration',
      'onboarding_signup_first_name': 'First name',
      'onboarding_signup_last_name': 'Last name',
      'onboarding_signup_phone': 'Phone',
      'onboarding_signup_national_id': 'National ID',
      'onboarding_signup_national_id_hint': '16-digit Rwanda national ID',
      'onboarding_signup_terms_label': 'I agree to the terms and conditions',
      'onboarding_signup_terms_required': 'You must accept the terms to register',
      'onboarding_signup_ministry': 'Ministry',
      'onboarding_signup_ministry_choir': 'Choir',
      'onboarding_signup_ministry_protocol': 'Protocol',
      'onboarding_signup_ministry_both': 'Both ministries',
      'onboarding_signup_ministry_choir_desc': 'Serve in worship through singing, rehearsals, and scheduled services.',
      'onboarding_signup_ministry_protocol_desc': 'Welcome, guide, and coordinate hospitality during church services.',
      'onboarding_signup_ministry_both_desc': 'You participate in both choir and protocol ministries.',
      'onboarding_signup_confirm_password': 'Confirm password',
      'onboarding_signup_password_mismatch': 'Passwords do not match.',
      'onboarding_signup_approval_note': 'After you submit, a leader will review your registration before full access is granted.',
      'onboarding_signup_back': 'Back',
      'onboarding_signup_continue': 'Continue',
      'onboarding_signup_submit': 'Submit registration',
      'onboarding_signup_have_account': 'Already have an account? Sign in',
      'onboarding_pending_eyebrow': 'Registration received',
      'onboarding_pending_title': 'Your request is being reviewed',
      'onboarding_pending_greeting': 'Thank you, {name}.',
      'onboarding_pending_body': 'Your ministry registration has been received. Leaders are reviewing your request.',
      'onboarding_pending_step_review': 'A ministry leader will review your details.',
      'onboarding_pending_step_notify': 'You will receive a notification when a decision is made.',
      'onboarding_pending_step_access': 'Once approved, you can view schedules and ministry updates.',
      'onboarding_pending_help': 'If you need help, contact your choir or protocol leader.',
      'dashboard_member_title': 'My dashboard',
      'dashboard_leader_title': 'Leader dashboard',
      'nav_calendar': 'Event calendar',
      'nav_attendance': 'Attendance',
      'nav_swaps': 'Swaps',
      'nav_replacements': 'Replacements',
      'nav_discipline': 'Discipline',
      'nav_finance': 'Choir finance',
      'nav_notifications': 'Notifications',
      'nav_sync': 'Offline sync',
      'nav_assignments': 'Assignments',
      'nav_choir_rotation': 'Choir rotation',
      'nav_budgets': 'Budgets',
      'nav_settings': 'Settings',
      'member_attendance_label': 'Attendance',
      'attendance_status_present': 'Present',
      'attendance_status_absent': 'Absent',
      'attendance_status_late': 'Late',
      'attendance_save_action': 'Save attendance',
      'attendance_saved_success': 'Attendance saved',
      'attendance_queued_offline': 'Queued for offline sync',
      'attendance_notes_label': 'Notes',
      'event_picker_label': 'Select event',
      'member_picker_label': 'Select member',
      'swap_list_title': 'Swaps',
      'swap_request_action': 'Request swap',
      'swap_accept_action': 'Accept swap',
      'swap_reject_action': 'Reject',
      'swap_leader_approve_action': 'Leader approve',
      'swap_finalize_action': 'Finalize swap',
      'replacement_title': 'Replacements',
      'replacement_request_action': 'Request replacement',
      'discipline_title': 'Discipline',
      'finance_summary_title': 'Choir finance',
      'sync_title': 'Offline sync',
      'sync_now_action': 'Sync now',
      'sync_pending_count': 'Pending items',
      'settings_title': 'Settings',
      'settings_language_title': 'Language',
      'settings_language_subtitle': 'Choose your preferred app language',
      'language_kinyarwanda': 'Kinyarwanda',
      'language_english': 'English',
      'language_french': 'French',
      'language_changed_success': 'Language updated',
      'common_refresh': 'Refresh',
      'common_save': 'Save',
      'common_cancel': 'Cancel',
      'common_logout': 'Sign out',
      'common_loading': 'Please wait...',
      'error_conflict': 'Schedule conflict detected',
      'error_unauthorized': 'Invalid credentials',
      'error_forbidden': 'Access denied',
      'error_not_found': 'Not found',
      'error_validation': 'Validation failed',
      'error_business_rule': 'Action not allowed',
      'error_network': 'Network unavailable',
      'error_unknown': 'Something went wrong',
      'member_name_fallback': 'Member',
      'sync_pending_hint': 'Pending items in queue',
      'sync_queued_items_title': 'Queued items',
      'sync_offline_skipped': 'Offline',
      'sync_queue_empty_skipped': 'Queue empty',
      'notifications_title': 'Notifications',
      'assignments_title': 'Assignments',
      'choir_rotation_title': 'Choir rotation',
      'budgets_title': 'Budgets',
      'calendar_selected_day': 'Events on this day',
      'replacement_event_id_label': 'Event ID',
      'replacement_absent_member_label': 'Absent member ID (optional)',
      'replacement_cover_member_label': 'Cover member ID (optional)',
      'replacement_requested_success': 'Replacement requested',
      'swap_with_member_label': 'Swap with',
      'swap_details_title': 'Swap details',
      'common_approve': 'Approve',
      'common_finalize': 'Finalize',
      'finance_income_label': 'Income',
      'finance_expense_label': 'Expense',
      'finance_balance_label': 'Balance',
      'finance_unpaid_label': 'Outstanding',
      'budget_name_label': 'Budget name',
      'budget_amount_label': 'Amount',
      'budget_create_action': 'Create budget',
      'choir_refresh_pool_action': 'Refresh pool',
      'choir_auto_assign_action': 'Auto assign',
      'assignment_manual_override_label': 'Manual override',
      'assignment_override_reason_label': 'Override reason',
      'assignment_add_member_label': 'Add member',
      'assignment_bulk_assign_action': 'Bulk assign',
      'attendance_status_excused': 'Excused',
      'attendance_status_unexcused': 'Unexcused',
      'term_choir': 'Choir',
      'term_protocol': 'Protocol',
      'term_attendance': 'Attendance',
      'term_discipline': 'Discipline',
      'term_rehearsal': 'Rehearsal',
      'term_worship_service': 'Worship service',
      'term_member': 'Member',
      'term_announcement': 'Announcement',
      'term_schedule': 'Schedule',
      'term_responsibility': 'Assignment',
      'term_replacement': 'Replacement',
      'term_swap': 'Swap',
      'term_event': 'Event',
      'term_leader': 'Leader',
      'term_committee': 'Committee',
      'term_treasurer': 'Treasurer',
      'term_secretary': 'Secretary',
      'swap_request_sent': '{memberName} requested to swap with you',
      'swap_status_updated': 'Swap update: {statusLabel}',
      'swap_list_item_subtitle': '{eventName} · {statusLabel}',
      'attendance_marked_for_event':
          'Your attendance for {eventName} was recorded',
      'discipline_case_opened':
          'A discipline case was opened: {caseTitle}',
      'dues_remaining': 'Remaining balance: {amount}',
      'event_assigned_to_you': 'You were assigned to: {eventName}',
      'replacement_requested_for_event':
          'Replacement requested for {eventName}',
      'replacement_list_title': 'Replacement requests',
      'replacement_list_empty': 'No replacement requests yet',
      'replacement_list_item_subtitle':
          '{eventName} · {absentName} → {coverName}',
      'swap_status_requested': 'Requested',
      'swap_status_target_accepted': 'Accepted by partner',
      'swap_status_target_rejected': 'Declined by partner',
      'swap_status_leader_pending': 'Awaiting leader',
      'swap_status_approved': 'Leader approved',
      'swap_status_rejected': 'Rejected',
      'swap_status_finalized': 'Finalized',
      'swap_status_cancelled': 'Cancelled',
      'replacement_status_requested': 'Requested',
      'replacement_status_leader_pending': 'Awaiting leader',
      'replacement_status_approved': 'Approved',
      'replacement_status_rejected': 'Rejected',
      'replacement_status_finalized': 'Finalized',
      'discipline_stage_reported': 'Reported',
      'discipline_stage_under_review': 'Under review',
      'discipline_stage_decision_pending': 'Decision pending',
      'discipline_stage_actioned': 'Actioned',
      'discipline_stage_closed': 'Closed',
      'enum_status_unknown': 'Unknown status',
      'sync_result_applied': 'Applied: {applied}, Rejected: {rejected}',
      'budget_amount_subtitle': 'Amount: {amount}',
      'choir_eligible_members_label': 'Eligible members: {count}',
      'choir_slot_subtitle': 'Slot #{slot}',
      'choir_assigned_count_message': 'Assigned {count} members',
      'assignment_queue_title': 'Queue ({count})',
      'assignment_members_assigned_message': 'Assigned {count} members',
      'event_detail_title': 'Event details',
      'event_create_title': 'Create event',
      'event_assign_action': 'Assign members',
      'event_mark_attendance_action': 'Mark attendance',
      'event_audit_title': 'Audit trail',
      'event_type_choir_service': 'Choir service',
      'event_type_concert': 'Concert',
      'event_type_protocol_service': 'Protocol service',
      'event_type_church_event': 'Church event',
      'event_ministry_both': 'Both ministries',
      'event_filter_all_types': 'All types',
      'event_filter_ministry_all': 'All ministries',
      'event_view_month': 'Month',
      'event_view_week': 'Week',
      'event_start_label': 'Starts',
      'event_end_label': 'Ends',
      'event_location_label': 'Location',
      'event_description_label': 'Description',
      'event_recurrence_label': 'Recurrence',
      'event_conflict_error': 'End time must be after start time',
      'event_created_success': 'Event created',
      'event_assigned_members_title': 'Assigned members',
      'event_attendance_title': 'Attendance',
      'dashboard_section_overview': 'Overview',
      'dashboard_kpi_upcoming_events': 'Upcoming events',
      'dashboard_kpi_upcoming_assignments': 'Upcoming assignments',
      'dashboard_kpi_pending_swaps': 'Pending swaps',
      'dashboard_kpi_pending_replacements': 'Pending replacements',
      'dashboard_kpi_attendance_rate': 'Attendance rate',
      'dashboard_kpi_active_discipline': 'Active discipline',
      'dashboard_kpi_sync_conflicts': 'Sync conflicts',
      'dashboard_kpi_finance_balance': 'Finance balance',
      'sync_conflicts_title': 'Sync conflicts',
      'sync_last_sync': 'Last sync',
      'sync_failed_count': 'Failed: {count}',
      'sync_retry_action': 'Retry',
      'sync_conflict_reason': 'Reason',
      'attendance_bulk_title': 'Bulk attendance',
      'attendance_bulk_save': 'Save all',
      'assignment_validate_action': 'Validate assignment',
      'assignment_conflict_warning': 'Schedule conflict detected',
      'member_availability_title': 'Member availability',
      'member_unavailable_dates_label': 'Unavailable dates',
      'common_create': 'Create',
      'common_retry': 'Retry',
      'nav_coverage': 'Coverage',
      'attendance_governance_title': 'Attendance governance',
      'attendance_mark_all_present': 'Mark all present',
      'attendance_excuse_review_title': 'Excuse review',
      'attendance_excuse_no_reason': 'No reason provided',
      'attendance_select_event_hint': 'Select an event to load the roster',
      'attendance_roster_empty': 'No members assigned to this event',
      'attendance_reliability_title': 'Reliability score',
      'attendance_reliability_subtitle': '{percentage}% · {band}',
      'attendance_excuse_request_title': 'Request excused absence',
      'attendance_excuse_request_subtitle':
          'Submit an excuse for an upcoming assignment. A leader will review it.',
      'attendance_excuse_reason_label': 'Reason',
      'attendance_excuse_submit_action': 'Submit excuse',
      'attendance_excuse_submitted': 'Excuse submitted for {eventName}',
      'attendance_recent_title': 'Recent attendance',
      'attendance_recent_empty': 'No attendance history yet',
      'attendance_status_attended': 'Attended',
      'attendance_status_replacement': 'Replacement served',
      'attendance_status_voluntary': 'Voluntary service',
      'attendance_excuse_illness': 'Illness',
      'attendance_excuse_travel': 'Travel',
      'attendance_excuse_work_school': 'Work or school',
      'attendance_excuse_emergency': 'Emergency',
      'attendance_excuse_family': 'Family issue',
      'attendance_excuse_approved_leave': 'Approved leave',
      'attendance_excuse_conflict': 'Unavoidable conflict',
      'attendance_excuse_unknown': 'Unknown',
      'coverage_analytics_title': 'Coverage analytics',
      'coverage_analytics_swaps': 'Swaps',
      'coverage_analytics_replacements': 'Replacements',
      'coverage_analytics_voluntary': 'Voluntary service',
      'coverage_analytics_unresolved': 'Unresolved swaps',
      'coverage_readiness_title': 'Readiness',
      'coverage_readiness_empty': 'No readiness warnings',
      'coverage_team_head_title': 'Team head',
      'coverage_team_head_empty': 'No pending coverage issues',
      'coverage_coordinator_title': 'Coordinator',
      'coverage_coordinator_empty': 'No escalated coverage cases',
      'coverage_escalated_title': 'Escalated',
      'coverage_open_swaps': 'Manage swaps',
      'coverage_open_replacements': 'Manage replacements',
      'coverage_swaps_empty': 'No swap requests',
      'coverage_readiness_ready': 'Fully ready',
      'coverage_readiness_replacement_pending': 'Replacement pending',
      'coverage_readiness_attendance_risk': 'Attendance risk',
      'coverage_readiness_staffing_shortage': 'Staffing shortage',
      'coverage_readiness_operational_danger': 'Operational danger',
      'attendance_tab_marking': 'Marking',
      'attendance_tab_choir': 'Choir',
      'attendance_tab_oversight': 'Oversight',
      'attendance_choir_title': 'Choir attendance',
      'attendance_choir_marked': 'Marked',
      'attendance_choir_excused': 'Excused',
      'attendance_choir_unexcused': 'Unexcused',
      'attendance_choir_lateness': 'Lateness',
      'attendance_choir_pending_review': 'Pending review',
      'attendance_discipline_title': 'Discipline recommendations',
      'attendance_discipline_subtitle':
          'Pastoral review suggested — not automatic discipline.',
      'attendance_discipline_empty': 'No recommendations right now.',
      'attendance_discipline_create': 'Open discipline case',
      'attendance_discipline_created': 'Discipline case created.',
      'coverage_escalate_team_head': 'Escalate to team head',
      'coverage_escalate_coordinator': 'Escalate to coordinator',
      'coverage_escalate_president': 'Escalate to president',
      'phoneRequired': 'Phone number required to continue.',
      'updatePhoneNow': 'Update now',
      'restrictedUntilPhoneAdded':
          'Phone number required to continue ministry operations.',
      'warningPhoneIncomplete':
          'Complete your phone number to avoid losing access to ministry tools.',
      'my_contributions_title': 'My contributions',
      'my_contributions_member_number': 'Member number',
      'my_contributions_history_title': 'Contribution history',
      'my_contributions_total': 'Total contributed',
      'my_contributions_outstanding': 'Outstanding balance',
      'my_contributions_ack_sent': 'Thank-you sent',
      'my_contributions_ack_pending': 'Acknowledgment pending',
      'my_contributions_ack_failed': 'Acknowledgment failed',
      'operational_units_title': 'Operational units',
      'operational_unit_detail_title': 'Unit',
      'ministries_title': 'Ministries',
      'ministry_detail_title': 'Ministry',
      'families_title': 'Families',
      'families_head': 'Head',
      'families_member_count': 'Members',
      'families_health_score': 'Health score',
      'families_attendance': 'Attendance',
      'families_contributions': 'Contributions',
      'families_participation': 'Participation',
      'search_title': 'Search',
      'search_placeholder': 'Search members, families, events…',
      'search_group_members': 'Members',
      'search_group_families': 'Families',
      'search_group_events': 'Events',
      'search_group_assignments': 'Assignments',
      'search_group_contributions': 'Contributions',
      'search_group_welfare_cases': 'Welfare cases',
      'search_group_songs': 'Songs',
      'search_group_rehearsals': 'Rehearsals',
      'welfare_title': 'Welfare',
      'welfare_open_cases': 'Open cases',
      'welfare_funds_raised': 'Funds raised',
      'welfare_raised': 'Raised',
      'welfare_remaining': 'Remaining',
      'welfare_amount': 'Amount',
      'welfare_contribute': 'Contribute',
      'music_title': 'Music library',
      'music_usage_count': 'Uses',
      'rehearsals_title': 'Rehearsals',
      'rehearsals_readiness': 'Readiness',
      'rehearsals_attendance': 'Attendance',
      'rehearsals_plan': 'Plan',
      'rehearsals_reports': 'Reports',
      'rehearsals_prep_score': 'Preparation score',
      'welfare_create_title': 'Open welfare case',
      'welfare_field_title': 'Title',
      'welfare_field_description': 'Description',
      'welfare_field_member_id': 'Member ID',
      'welfare_category': 'Category',
      'welfare_submit_case': 'Submit case',
      'welfare_assistance_title': 'Record assistance',
      'welfare_assistance_type': 'Assistance type',
      'welfare_record_assistance': 'Record assistance',
      'welfare_reports_title': 'Welfare reports',
      'welfare_assistance_total': 'Assistance total',
      'welfare_tab_overview': 'Overview',
      'welfare_timeline': 'Timeline',
      'welfare_timeline_empty': 'No timeline events yet.',
      'welfare_contributions': 'Contributions',
      'welfare_offline_banner': 'Showing cached data. Pull to refresh when online.',
      'music_favorites': 'Favorites',
      'music_favorite': 'Add to favorites',
      'music_unfavorite': 'Remove from favorites',
      'music_recent': 'Recently viewed',
      'music_lyrics': 'Lyrics',
      'music_assets': 'Assets',
      'common_back': 'Back',
      'common_next': 'Next',
      'common_retry': 'Retry',
      'search_group_welfare_categories': 'Welfare categories',
      'search_group_choir_documents': 'Choir documents',
      'search_group_choir_meetings': 'Choir meetings',
      'search_group_welfare_assistance': 'Welfare assistance',
      'nav_operational': 'Operational center',
      'operational_title': 'Operational center',
      'operational_unauthorized': 'You do not have operational governance access.',
      'operational_subtitle_president': 'Protocol president — ministry-wide executive summary.',
      'operational_subtitle_coordinator': 'Protocol coordinator — team operations overview.',
      'operational_subtitle_team_head': 'Protocol team head — your team scope.',
      'operational_subtitle_choir_leader': 'Choir operations — use attendance for detail.',
      'operational_workflows_title': 'Operational workflows',
      'operational_open_attendance': 'Attendance governance',
      'operational_open_coverage': 'Coverage management',
      'operational_choir_summary_title': 'Choir operations',
      'operational_choir_summary_hint': 'Open attendance for choir marking and summaries.',
      'operational_stat_active_teams': 'Active teams',
      'operational_stat_escalated': 'Escalated',
      'operational_stat_pending_replacements': 'Pending replacements',
      'operational_stat_discipline_risk': 'Discipline risks',
      'operational_stat_readiness': 'Readiness warnings',
      'operational_stat_teams': 'Your teams',
      'operational_stat_pending_absences': 'Pending absences',
      'devotion_center_title': 'Devotion Center',
      'devotion_pinned': 'Pinned message',
      'devotion_verse_of_day': 'Verse of the day',
      'devotion_encouragement': 'Encouragement',
      'devotion_share': 'Share',
      'devotion_open_center': 'Open devotion center',
    },
    'fr': {
      'app_title': 'CMMS',
      'app_tagline': 'Système de gestion d\'église',
      'nav_home': 'Accueil',
      'nav_members': 'Membres',
      'nav_events': 'Événements',
      'nav_more': 'Plus',
      'members_title': 'Membres',
      'member_profile_title': 'Profil membre',
      'member_profile_timeline': 'Chronologie',
      'member_profile_timeline_empty': 'Aucune activité pour le moment.',
      'member_profile_status': 'Statut',
      'member_profile_voice': 'Section vocale',
      'member_profile_family': 'Famille',
      'member_profile_welfare': 'Dossiers bien-être ouverts',
      'members_empty': 'Aucun membre trouvé.',
      'dashboard_welcome': 'Bon retour, {name}',
      'auth_email_label': 'E-mail',
      'auth_password_label': 'Mot de passe',
      'auth_email_invalid': 'Saisissez une adresse e-mail valide',
      'auth_password_min_length':
          'Le mot de passe doit contenir au moins 6 caractères',
      'auth_login_failed': 'Échec de la connexion',
      'validation_required': 'Ce champ est obligatoire',
      'onboarding_signup_title': 'Inscription au ministère',
      'onboarding_signup_first_name': 'Prénom',
      'onboarding_signup_last_name': 'Nom',
      'onboarding_signup_phone': 'Téléphone',
      'onboarding_signup_national_id': 'Identité nationale',
      'onboarding_signup_national_id_hint': "Numéro d'identité rwandais (16 chiffres)",
      'onboarding_signup_terms_label': "J'accepte les conditions d'utilisation",
      'onboarding_signup_terms_required': 'Vous devez accepter les conditions',
      'onboarding_signup_ministry': 'Ministère',
      'onboarding_signup_ministry_choir': 'Chorale',
      'onboarding_signup_ministry_protocol': 'Protocol',
      'onboarding_signup_ministry_both': 'Les deux ministères',
      'onboarding_signup_ministry_choir_desc': 'Servir dans la louange par le chant, les répétitions et les offices.',
      'onboarding_signup_ministry_protocol_desc': 'Accueillir, guider et coordonner l\'hospitalité pendant les offices.',
      'onboarding_signup_ministry_both_desc': 'Vous participez à la chorale et au protocol.',
      'onboarding_signup_confirm_password': 'Confirmer le mot de passe',
      'onboarding_signup_password_mismatch': 'Les mots de passe ne correspondent pas.',
      'onboarding_signup_approval_note': 'Après envoi, un responsable examinera votre inscription.',
      'onboarding_signup_back': 'Retour',
      'onboarding_signup_continue': 'Continuer',
      'onboarding_signup_submit': 'Envoyer l\'inscription',
      'onboarding_signup_have_account': 'Déjà un compte ? Se connecter',
      'onboarding_pending_eyebrow': 'Inscription reçue',
      'onboarding_pending_title': 'Votre demande est en cours d\'examen',
      'onboarding_pending_greeting': 'Merci, {name}.',
      'onboarding_pending_body': 'Votre inscription au ministère a bien été reçue.',
      'onboarding_pending_step_review': 'Un responsable examinera vos informations.',
      'onboarding_pending_step_notify': 'Vous recevrez une notification lors de la décision.',
      'onboarding_pending_step_access': 'Une fois approuvé, vous pourrez consulter horaires et actualités.',
      'onboarding_pending_help': 'Contactez votre responsable de chorale ou de protocol si besoin.',
      'dashboard_member_title': 'Mon tableau de bord',
      'dashboard_leader_title': 'Tableau de bord responsable',
      'nav_calendar': 'Calendrier des événements',
      'nav_attendance': 'Présence',
      'nav_swaps': 'Échanges',
      'nav_replacements': 'Remplacements',
      'nav_discipline': 'Discipline',
      'nav_finance': 'Finances de la chorale',
      'nav_notifications': 'Notifications',
      'nav_sync': 'Synchronisation hors ligne',
      'nav_assignments': 'Affectations',
      'nav_choir_rotation': 'Rotation chorale',
      'nav_budgets': 'Budgets',
      'nav_settings': 'Paramètres',
      'member_attendance_label': 'Présence',
      'attendance_status_present': 'Présent',
      'attendance_status_absent': 'Absent',
      'attendance_status_late': 'En retard',
      'attendance_save_action': 'Enregistrer la présence',
      'attendance_saved_success': 'Présence enregistrée',
      'attendance_queued_offline':
          'Mis en file pour synchronisation hors ligne',
      'attendance_notes_label': 'Notes',
      'event_picker_label': 'Sélectionner un événement',
      'member_picker_label': 'Sélectionner un membre',
      'swap_list_title': 'Échanges',
      'swap_request_action': 'Demander un échange',
      'swap_accept_action': "Accepter l'échange",
      'swap_reject_action': 'Refuser',
      'swap_leader_approve_action': 'Approuver (responsable)',
      'swap_finalize_action': "Finaliser l'échange",
      'replacement_title': 'Remplacements',
      'replacement_request_action': 'Demander un remplacement',
      'discipline_title': 'Discipline',
      'finance_summary_title': 'Finances de la chorale',
      'sync_title': 'Synchronisation hors ligne',
      'sync_now_action': 'Synchroniser',
      'sync_pending_count': 'Éléments en attente',
      'settings_title': 'Paramètres',
      'settings_language_title': 'Langue',
      'settings_language_subtitle': "Choisissez la langue de l'application",
      'language_kinyarwanda': 'Kinyarwanda',
      'language_english': 'Anglais',
      'language_french': 'Français',
      'language_changed_success': 'Langue mise à jour',
      'common_refresh': 'Actualiser',
      'common_save': 'Enregistrer',
      'common_cancel': 'Annuler',
      'common_logout': 'Déconnexion',
      'common_loading': 'Veuillez patienter...',
      'error_conflict': "Conflit d'horaire détecté",
      'error_unauthorized': 'Identifiants invalides',
      'error_forbidden': 'Accès refusé',
      'error_not_found': 'Introuvable',
      'error_validation': 'Échec de la validation',
      'error_business_rule': 'Action non autorisée',
      'error_network': 'Réseau indisponible',
      'error_unknown': "Une erreur s'est produite",
      'member_name_fallback': 'Membre',
      'sync_pending_hint': 'Éléments en attente dans la file',
      'sync_queued_items_title': 'Éléments en file',
      'sync_offline_skipped': 'Hors ligne',
      'sync_queue_empty_skipped': 'File vide',
      'notifications_title': 'Notifications',
      'assignments_title': 'Affectations',
      'choir_rotation_title': 'Rotation chorale',
      'budgets_title': 'Budgets',
      'calendar_selected_day': 'Événements ce jour',
      'replacement_event_id_label': "ID de l'événement",
      'replacement_absent_member_label': 'ID membre absent (facultatif)',
      'replacement_cover_member_label': 'ID remplaçant (facultatif)',
      'replacement_requested_success': 'Remplacement demandé',
      'swap_with_member_label': 'Échanger avec',
      'swap_details_title': "Détails de l'échange",
      'common_approve': 'Approuver',
      'common_finalize': 'Finaliser',
      'finance_income_label': 'Revenus',
      'finance_expense_label': 'Dépenses',
      'finance_balance_label': 'Solde',
      'finance_unpaid_label': 'Impaye',
      'budget_name_label': 'Nom du budget',
      'budget_amount_label': 'Montant',
      'budget_create_action': 'Créer un budget',
      'choir_refresh_pool_action': 'Actualiser la liste',
      'choir_auto_assign_action': 'Affectation auto',
      'assignment_manual_override_label': 'Dérogation manuelle',
      'assignment_override_reason_label': 'Motif de dérogation',
      'assignment_add_member_label': 'Ajouter un membre',
      'assignment_bulk_assign_action': 'Affectation groupée',
      'attendance_status_excused': 'Excusé',
      'attendance_status_unexcused': 'Non excusé',
      'term_choir': 'Chorale',
      'term_protocol': 'Protocole',
      'term_attendance': 'Présence',
      'term_discipline': 'Discipline',
      'term_rehearsal': 'Répétition',
      'term_worship_service': 'Célébration',
      'term_member': 'Membre',
      'term_announcement': 'Annonce',
      'term_schedule': 'Planning',
      'term_responsibility': 'Affectation',
      'term_replacement': 'Remplacement',
      'term_swap': 'Échange de service',
      'term_event': 'Événement',
      'term_leader': 'Responsable',
      'term_committee': 'Comité',
      'term_treasurer': 'Trésorier',
      'term_secretary': 'Secrétaire',
      'swap_request_sent':
          '{memberName} a demandé un échange de service avec vous',
      'swap_status_updated': "Mise à jour d'échange : {statusLabel}",
      'swap_list_item_subtitle': '{eventName} · {statusLabel}',
      'attendance_marked_for_event':
          'Votre présence pour {eventName} a été enregistrée',
      'discipline_case_opened':
          'Un dossier disciplinaire a été ouvert : {caseTitle}',
      'dues_remaining': 'Solde restant : {amount}',
      'event_assigned_to_you': 'Vous êtes affecté à : {eventName}',
      'replacement_requested_for_event':
          'Remplacement demandé pour {eventName}',
      'replacement_list_title': 'Demandes de remplacement',
      'replacement_list_empty': 'Aucune demande de remplacement',
      'replacement_list_item_subtitle':
          '{eventName} · {absentName} → {coverName}',
      'swap_status_requested': 'Demandé',
      'swap_status_target_accepted': 'Accepté par le partenaire',
      'swap_status_target_rejected': 'Refusé par le partenaire',
      'swap_status_leader_pending': 'En attente du responsable',
      'swap_status_approved': 'Approuvé par le responsable',
      'swap_status_rejected': 'Refusé',
      'swap_status_finalized': 'Finalisé',
      'swap_status_cancelled': 'Annulé',
      'replacement_status_requested': 'Demandé',
      'replacement_status_leader_pending': 'En attente du responsable',
      'replacement_status_approved': 'Approuvé',
      'replacement_status_rejected': 'Refusé',
      'replacement_status_finalized': 'Finalisé',
      'discipline_stage_reported': 'Signalé',
      'discipline_stage_under_review': "En cours d'examen",
      'discipline_stage_decision_pending': 'Décision en attente',
      'discipline_stage_actioned': 'Mesure prise',
      'discipline_stage_closed': 'Clôturé',
      'enum_status_unknown': 'Statut inconnu',
      'settings_appearance_title': 'Apparence',
      'settings_theme_system': 'Système',
      'settings_theme_light': 'Clair',
      'settings_theme_dark': 'Sombre',
      'event_detail_title': "Détails de l'événement",
      'event_create_title': 'Créer un événement',
      'event_assign_action': 'Affecter des membres',
      'event_mark_attendance_action': 'Enregistrer la présence',
      'event_audit_title': "Piste d'audit",
      'event_type_choir_service': 'Service de chorale',
      'event_type_concert': 'Concert',
      'event_type_protocol_service': 'Service protocol',
      'event_type_church_event': 'Événement paroissial',
      'event_ministry_both': 'Les deux ministères',
      'event_filter_all_types': 'Tous les types',
      'event_filter_ministry_all': 'Tous les ministères',
      'event_view_month': 'Mois',
      'event_view_week': 'Semaine',
      'event_start_label': 'Début',
      'event_end_label': 'Fin',
      'event_location_label': 'Lieu',
      'event_description_label': 'Description',
      'event_recurrence_label': 'Récurrence',
      'event_conflict_error': "L'heure de fin doit être après le début",
      'event_created_success': 'Événement créé',
      'event_assigned_members_title': 'Membres affectés',
      'event_attendance_title': 'Présence',
      'dashboard_section_overview': "Vue d'ensemble",
      'dashboard_kpi_upcoming_events': 'Événements à venir',
      'dashboard_kpi_upcoming_assignments': 'Affectations à venir',
      'dashboard_kpi_pending_swaps': 'Échanges en attente',
      'dashboard_kpi_pending_replacements': 'Remplacements en attente',
      'dashboard_kpi_attendance_rate': 'Taux de présence',
      'dashboard_kpi_active_discipline': 'Discipline active',
      'dashboard_kpi_sync_conflicts': 'Conflits de sync',
      'dashboard_kpi_finance_balance': 'Solde financier',
      'sync_conflicts_title': 'Conflits de synchronisation',
      'sync_last_sync': 'Dernière sync',
      'sync_failed_count': 'Échecs : {count}',
      'sync_retry_action': 'Réessayer',
      'sync_conflict_reason': 'Motif',
      'attendance_bulk_title': 'Présence groupée',
      'attendance_bulk_save': 'Tout enregistrer',
      'assignment_validate_action': "Valider l'affectation",
      'assignment_conflict_warning': "Conflit d'horaire détecté",
      'member_availability_title': 'Disponibilité du membre',
      'member_unavailable_dates_label': 'Dates indisponibles',
      'common_create': 'Créer',
      'common_retry': 'Réessayer',
      'sync_result_applied': 'Appliqués : {applied}, Rejetés : {rejected}',
      'budget_amount_subtitle': 'Montant : {amount}',
      'choir_eligible_members_label': 'Membres éligibles : {count}',
      'choir_slot_subtitle': 'Place n°{slot}',
      'choir_assigned_count_message': '{count} membres affectés',
      'assignment_queue_title': 'File ({count})',
      'assignment_members_assigned_message': '{count} membres affectés',
      'nav_coverage': 'Couverture',
      'attendance_governance_title': 'Gouvernance de présence',
      'attendance_mark_all_present': 'Tout marquer présent',
      'attendance_excuse_review_title': 'Revue des excuses',
      'attendance_excuse_no_reason': 'Aucune raison fournie',
      'attendance_select_event_hint':
          'Sélectionnez un événement pour charger la liste',
      'attendance_roster_empty': 'Aucun membre affecté à cet événement',
      'attendance_reliability_title': 'Score de fiabilité',
      'attendance_reliability_subtitle': '{percentage}% · {band}',
      'attendance_excuse_request_title': 'Demander une absence excusée',
      'attendance_excuse_request_subtitle':
          'Soumettez une excuse pour une affectation à venir.',
      'attendance_excuse_reason_label': 'Motif',
      'attendance_excuse_submit_action': "Envoyer l'excuse",
      'attendance_excuse_submitted': 'Excuse envoyée pour {eventName}',
      'attendance_recent_title': 'Présence récente',
      'attendance_recent_empty': 'Aucun historique de présence',
      'attendance_status_attended': 'Présent',
      'attendance_status_replacement': 'Remplacement servi',
      'attendance_status_voluntary': 'Service volontaire',
      'attendance_excuse_illness': 'Maladie',
      'attendance_excuse_travel': 'Voyage',
      'attendance_excuse_work_school': 'Travail ou école',
      'attendance_excuse_emergency': 'Urgence',
      'attendance_excuse_family': 'Famille',
      'attendance_excuse_approved_leave': 'Congé approuvé',
      'attendance_excuse_conflict': 'Conflit inévitable',
      'attendance_excuse_unknown': 'Inconnu',
      'coverage_analytics_title': 'Analyses de couverture',
      'coverage_analytics_swaps': 'Échanges',
      'coverage_analytics_replacements': 'Remplacements',
      'coverage_analytics_voluntary': 'Service volontaire',
      'coverage_analytics_unresolved': 'Échanges non résolus',
      'coverage_readiness_title': 'Préparation',
      'coverage_readiness_empty': 'Aucune alerte de préparation',
      'coverage_team_head_title': "Chef d'équipe",
      'coverage_team_head_empty': 'Aucun problème de couverture',
      'coverage_coordinator_title': 'Coordinateur',
      'coverage_coordinator_empty': 'Aucun cas escaladé',
      'coverage_escalated_title': 'Escaladé',
      'coverage_open_swaps': 'Gérer les échanges',
      'coverage_open_replacements': 'Gérer les remplacements',
      'coverage_swaps_empty': 'Aucun échange',
      'coverage_readiness_ready': 'Prêt',
      'coverage_readiness_replacement_pending': 'Remplacement en attente',
      'coverage_readiness_attendance_risk': 'Risque de présence',
      'coverage_readiness_staffing_shortage': 'Effectif insuffisant',
      'coverage_readiness_operational_danger': 'Danger opérationnel',
      'attendance_tab_marking': 'Marquage',
      'attendance_tab_choir': 'Chœur',
      'attendance_tab_oversight': 'Supervision',
      'attendance_choir_title': 'Présence du chœur',
      'attendance_choir_marked': 'Marqué',
      'attendance_choir_excused': 'Excusé',
      'attendance_choir_unexcused': 'Non excusé',
      'attendance_choir_lateness': 'Retard',
      'attendance_choir_pending_review': 'En attente de révision',
      'attendance_discipline_title': 'Recommandations disciplinaires',
      'attendance_discipline_subtitle':
          'Révision pastorale suggérée — pas de discipline automatique.',
      'attendance_discipline_empty': 'Aucune recommandation pour le moment.',
      'attendance_discipline_create': 'Ouvrir un dossier disciplinaire',
      'attendance_discipline_created': 'Dossier disciplinaire créé.',
      'coverage_escalate_team_head': 'Escalader au chef d\'équipe',
      'coverage_escalate_coordinator': 'Escalader au coordinateur',
      'coverage_escalate_president': 'Escalader au président',
      'phoneRequired': 'Un numéro de téléphone est requis pour continuer.',
      'updatePhoneNow': 'Mettre à jour',
      'restrictedUntilPhoneAdded':
          'Un numéro de téléphone est requis pour continuer les opérations ministérielles.',
      'warningPhoneIncomplete':
          'Complétez votre numéro de téléphone pour éviter de perdre l\'accès aux outils ministériels.',
      'my_contributions_title': 'Mes contributions',
      'my_contributions_member_number': 'Numéro de membre',
      'my_contributions_history_title': 'Historique des contributions',
      'my_contributions_total': 'Total contribué',
      'my_contributions_outstanding': 'Solde restant',
      'my_contributions_ack_sent': 'Remerciement envoye',
      'my_contributions_ack_pending': 'Accuse en attente',
      'my_contributions_ack_failed': 'Accuse echoue',
      'operational_units_title': 'Unités opérationnelles',
      'operational_unit_detail_title': 'Unité',
      'ministries_title': 'Ministères',
      'ministry_detail_title': 'Ministère',
      'families_title': 'Familles',
      'families_head': 'Chef',
      'families_member_count': 'Membres',
      'families_health_score': 'Score de santé',
      'families_attendance': 'Présence',
      'families_contributions': 'Contributions',
      'families_participation': 'Participation',
      'search_title': 'Recherche',
      'search_placeholder': 'Rechercher membres, familles, evenements…',
      'search_group_members': 'Membres',
      'search_group_families': 'Familles',
      'search_group_events': 'Evenements',
      'search_group_assignments': 'Affectations',
      'search_group_contributions': 'Contributions',
      'search_group_welfare_cases': 'Dossiers bien-être',
      'search_group_songs': 'Chants',
      'search_group_rehearsals': 'Répétitions',
      'welfare_title': 'Bien-être',
      'welfare_open_cases': 'Dossiers ouverts',
      'welfare_funds_raised': 'Fonds collectés',
      'welfare_raised': 'Collecté',
      'welfare_remaining': 'Restant',
      'welfare_amount': 'Montant',
      'welfare_contribute': 'Contribuer',
      'music_title': 'Bibliothèque musicale',
      'music_usage_count': 'Utilisations',
      'rehearsals_title': 'Répétitions',
      'rehearsals_readiness': 'Préparation',
      'rehearsals_attendance': 'Présence',
      'rehearsals_plan': 'Plan',
      'rehearsals_reports': 'Rapports',
      'rehearsals_prep_score': 'Préparation au culte',
      'welfare_create_title': 'Ouvrir un dossier',
      'welfare_field_title': 'Titre',
      'welfare_field_description': 'Description',
      'welfare_field_member_id': 'ID membre',
      'welfare_category': 'Catégorie',
      'welfare_submit_case': 'Soumettre',
      'welfare_assistance_title': 'Enregistrer une assistance',
      'welfare_assistance_type': 'Type d\'assistance',
      'welfare_record_assistance': 'Enregistrer',
      'welfare_reports_title': 'Rapports bien-être',
      'welfare_assistance_total': 'Total assistance',
      'welfare_tab_overview': 'Aperçu',
      'welfare_timeline': 'Chronologie',
      'welfare_timeline_empty': 'Aucun événement pour l\'instant.',
      'welfare_contributions': 'Contributions',
      'welfare_offline_banner': 'Données en cache. Tirez pour actualiser en ligne.',
      'music_favorites': 'Favoris',
      'music_favorite': 'Ajouter aux favoris',
      'music_unfavorite': 'Retirer des favoris',
      'music_recent': 'Consultés récemment',
      'music_lyrics': 'Paroles',
      'music_assets': 'Fichiers',
      'common_back': 'Retour',
      'common_next': 'Suivant',
      'common_retry': 'Réessayer',
      'search_group_welfare_categories': 'Catégories bien-être',
      'search_group_choir_documents': 'Documents du chœur',
      'search_group_choir_meetings': 'Réunions du chœur',
      'search_group_welfare_assistance': 'Assistance bien-être',
      'nav_operational': 'Centre opérationnel',
      'operational_title': 'Centre opérationnel',
      'operational_unauthorized': 'Accès opérationnel refusé.',
      'operational_subtitle_president': 'Président protocol — vue exécutive.',
      'operational_subtitle_coordinator': 'Coordinateur protocol — vue équipes.',
      'operational_subtitle_team_head': 'Chef d\'équipe protocol — votre périmètre.',
      'operational_subtitle_choir_leader': 'Opérations chorales — voir présence.',
      'operational_workflows_title': 'Flux opérationnels',
      'operational_open_attendance': 'Gouvernance de présence',
      'operational_open_coverage': 'Gestion de couverture',
      'operational_choir_summary_title': 'Opérations chorales',
      'operational_choir_summary_hint': 'Ouvrez la présence pour le détail.',
      'operational_stat_active_teams': 'Équipes actives',
      'operational_stat_escalated': 'Escaladés',
      'operational_stat_pending_replacements': 'Remplacements en attente',
      'operational_stat_discipline_risk': 'Risques discipline',
      'operational_stat_readiness': 'Alertes préparation',
      'operational_stat_teams': 'Vos équipes',
      'operational_stat_pending_absences': 'Absences en attente',
      'devotion_center_title': 'Centre de dévotion',
      'devotion_pinned': 'Message épinglé',
      'devotion_verse_of_day': 'Verset du jour',
      'devotion_encouragement': 'Encouragement',
      'devotion_share': 'Partager',
      'devotion_open_center': 'Ouvrir le centre de dévotion',
    },
  };

  String _t(String key) {
    final lang = locale.languageCode;
    return _catalog[lang]?[key] ?? _catalog['rw']![key] ?? key;
  }

  String _p(String key, Map<String, String> params) {
    var message = _t(key);
    for (final entry in params.entries) {
      message = message.replaceAll('{${entry.key}}', entry.value);
    }
    return message;
  }

  String swap_request_sent(String memberName) =>
      _p('swap_request_sent', {'memberName': memberName});

  String swap_status_updated(String statusLabel) =>
      _p('swap_status_updated', {'statusLabel': statusLabel});

  String swap_list_item_subtitle(String eventName, String statusLabel) =>
      _p('swap_list_item_subtitle', {
        'eventName': eventName,
        'statusLabel': statusLabel,
      });

  String attendance_marked_for_event(String eventName) =>
      _p('attendance_marked_for_event', {'eventName': eventName});

  String discipline_case_opened(String caseTitle) =>
      _p('discipline_case_opened', {'caseTitle': caseTitle});

  String dues_remaining(String amount) =>
      _p('dues_remaining', {'amount': amount});

  String event_assigned_to_you(String eventName) =>
      _p('event_assigned_to_you', {'eventName': eventName});

  String replacement_requested_for_event(String eventName) =>
      _p('replacement_requested_for_event', {'eventName': eventName});
  String get replacement_list_title => _t('replacement_list_title');
  String get replacement_list_empty => _t('replacement_list_empty');
  String replacement_list_item_subtitle(
    String eventName,
    String absentName,
    String coverName,
  ) =>
      _p('replacement_list_item_subtitle', {
        'eventName': eventName,
        'absentName': absentName,
        'coverName': coverName,
      });

  String budget_amount_subtitle(Object amount) =>
      _p('budget_amount_subtitle', {'amount': amount.toString()});

  String choir_eligible_members_label(int count) =>
      _p('choir_eligible_members_label', {'count': count.toString()});

  String choir_slot_subtitle(Object slot) =>
      _p('choir_slot_subtitle', {'slot': slot.toString()});

  String choir_assigned_count_message(int count) =>
      _p('choir_assigned_count_message', {'count': count.toString()});

  String assignment_queue_title(int count) =>
      _p('assignment_queue_title', {'count': count.toString()});

  String assignment_members_assigned_message(int count) =>
      _p('assignment_members_assigned_message', {'count': count.toString()});

  String sync_result_applied(int applied, int rejected) => _p(
        'sync_result_applied',
        {'applied': applied.toString(), 'rejected': rejected.toString()},
      );

  String get app_title => _t('app_title');
  String get app_tagline => _t('app_tagline');
  String get nav_home => _t('nav_home');
  String get nav_members => _t('nav_members');
  String get nav_events => _t('nav_events');
  String get nav_more => _t('nav_more');
  String get members_title => _t('members_title');
  String get member_profile_title => _t('member_profile_title');
  String get member_profile_timeline => _t('member_profile_timeline');
  String get member_profile_timeline_empty => _t('member_profile_timeline_empty');
  String get member_profile_status => _t('member_profile_status');
  String get member_profile_voice => _t('member_profile_voice');
  String get member_profile_family => _t('member_profile_family');
  String get member_profile_welfare => _t('member_profile_welfare');
  String get members_empty => _t('members_empty');
  String dashboard_welcome(String name) =>
      _t('dashboard_welcome').replaceAll('{name}', name);
  String get auth_sign_in_action => _t('auth_sign_in_action');
  String get auth_email_label => _t('auth_email_label');
  String get auth_password_label => _t('auth_password_label');
  String get auth_email_invalid => _t('auth_email_invalid');
  String get auth_password_min_length => _t('auth_password_min_length');
  String get auth_login_failed => _t('auth_login_failed');
  String get auth_create_account => _t('auth_create_account');
  String get validation_required => _t('validation_required');
  String get onboarding_signup_title => _t('onboarding_signup_title');
  String get onboarding_signup_first_name => _t('onboarding_signup_first_name');
  String get onboarding_signup_last_name => _t('onboarding_signup_last_name');
  String get onboarding_signup_phone => _t('onboarding_signup_phone');
  String get onboarding_signup_national_id => _t('onboarding_signup_national_id');
  String get onboarding_signup_national_id_hint => _t('onboarding_signup_national_id_hint');
  String get onboarding_signup_terms_label => _t('onboarding_signup_terms_label');
  String get onboarding_signup_terms_required => _t('onboarding_signup_terms_required');
  String get onboarding_signup_ministry => _t('onboarding_signup_ministry');
  String get onboarding_signup_ministry_choir => _t('onboarding_signup_ministry_choir');
  String get onboarding_signup_ministry_protocol => _t('onboarding_signup_ministry_protocol');
  String get onboarding_signup_ministry_both => _t('onboarding_signup_ministry_both');
  String get onboarding_signup_ministry_choir_desc => _t('onboarding_signup_ministry_choir_desc');
  String get onboarding_signup_ministry_protocol_desc => _t('onboarding_signup_ministry_protocol_desc');
  String get onboarding_signup_ministry_both_desc => _t('onboarding_signup_ministry_both_desc');
  String get onboarding_signup_confirm_password => _t('onboarding_signup_confirm_password');
  String get onboarding_signup_password_mismatch => _t('onboarding_signup_password_mismatch');
  String get onboarding_signup_approval_note => _t('onboarding_signup_approval_note');
  String get onboarding_signup_back => _t('onboarding_signup_back');
  String get onboarding_signup_continue => _t('onboarding_signup_continue');
  String get onboarding_signup_submit => _t('onboarding_signup_submit');
  String get onboarding_signup_have_account => _t('onboarding_signup_have_account');
  String get onboarding_pending_eyebrow => _t('onboarding_pending_eyebrow');
  String get onboarding_pending_title => _t('onboarding_pending_title');
  String onboarding_pending_greeting(String name) =>
      _p('onboarding_pending_greeting', {'name': name});
  String get onboarding_pending_body => _t('onboarding_pending_body');
  String get onboarding_pending_step_review => _t('onboarding_pending_step_review');
  String get onboarding_pending_step_notify => _t('onboarding_pending_step_notify');
  String get onboarding_pending_step_access => _t('onboarding_pending_step_access');
  String get onboarding_pending_help => _t('onboarding_pending_help');
  String get dashboard_member_title => _t('dashboard_member_title');
  String get dashboard_leader_title => _t('dashboard_leader_title');
  String get nav_calendar => _t('nav_calendar');
  String get nav_attendance => _t('nav_attendance');
  String get nav_swaps => _t('nav_swaps');
  String get nav_replacements => _t('nav_replacements');
  String get nav_discipline => _t('nav_discipline');
  String get nav_finance => _t('nav_finance');
  String get nav_notifications => _t('nav_notifications');
  String get nav_sync => _t('nav_sync');
  String get nav_assignments => _t('nav_assignments');
  String get nav_choir_rotation => _t('nav_choir_rotation');
  String get nav_budgets => _t('nav_budgets');
  String get nav_settings => _t('nav_settings');
  String get member_attendance_label => _t('member_attendance_label');
  String get attendance_status_present => _t('attendance_status_present');
  String get attendance_status_absent => _t('attendance_status_absent');
  String get attendance_status_late => _t('attendance_status_late');
  String get attendance_status_excused => _t('attendance_status_excused');
  String get attendance_status_unexcused => _t('attendance_status_unexcused');
  String get attendance_save_action => _t('attendance_save_action');
  String get attendance_saved_success => _t('attendance_saved_success');
  String get attendance_queued_offline => _t('attendance_queued_offline');
  String get attendance_notes_label => _t('attendance_notes_label');
  String get event_picker_label => _t('event_picker_label');
  String get member_picker_label => _t('member_picker_label');
  String get swap_list_title => _t('swap_list_title');
  String get swap_request_action => _t('swap_request_action');
  String get swap_accept_action => _t('swap_accept_action');
  String get swap_reject_action => _t('swap_reject_action');
  String get swap_leader_approve_action => _t('swap_leader_approve_action');
  String get swap_finalize_action => _t('swap_finalize_action');
  String get replacement_title => _t('replacement_title');
  String get replacement_request_action => _t('replacement_request_action');
  String get discipline_title => _t('discipline_title');
  String get finance_summary_title => _t('finance_summary_title');
  String get sync_title => _t('sync_title');
  String get sync_now_action => _t('sync_now_action');
  String get sync_pending_count => _t('sync_pending_count');
  String get settings_title => _t('settings_title');
  String get settings_language_title => _t('settings_language_title');
  String get settings_language_subtitle => _t('settings_language_subtitle');
  String get language_kinyarwanda => _t('language_kinyarwanda');
  String get language_english => _t('language_english');
  String get language_french => _t('language_french');
  String get language_changed_success => _t('language_changed_success');
  String get common_refresh => _t('common_refresh');
  String get common_save => _t('common_save');
  String get common_cancel => _t('common_cancel');
  String get common_logout => _t('common_logout');
  String get common_loading => _t('common_loading');
  String get error_conflict => _t('error_conflict');
  String get error_unauthorized => _t('error_unauthorized');
  String get error_forbidden => _t('error_forbidden');
  String get error_not_found => _t('error_not_found');
  String get error_validation => _t('error_validation');
  String get error_business_rule => _t('error_business_rule');
  String get error_network => _t('error_network');
  String get error_unknown => _t('error_unknown');
  String get member_name_fallback => _t('member_name_fallback');
  String get sync_pending_hint => _t('sync_pending_hint');
  String get sync_queued_items_title => _t('sync_queued_items_title');
  String get sync_offline_skipped => _t('sync_offline_skipped');
  String get sync_queue_empty_skipped => _t('sync_queue_empty_skipped');
  String get notifications_title => _t('notifications_title');
  String get assignments_title => _t('assignments_title');
  String get choir_rotation_title => _t('choir_rotation_title');
  String get budgets_title => _t('budgets_title');
  String get calendar_selected_day => _t('calendar_selected_day');
  String get replacement_event_id_label => _t('replacement_event_id_label');
  String get replacement_absent_member_label =>
      _t('replacement_absent_member_label');
  String get replacement_cover_member_label =>
      _t('replacement_cover_member_label');
  String get replacement_requested_success =>
      _t('replacement_requested_success');
  String get swap_with_member_label => _t('swap_with_member_label');
  String get swap_details_title => _t('swap_details_title');
  String get common_approve => _t('common_approve');
  String get common_finalize => _t('common_finalize');
  String get finance_income_label => _t('finance_income_label');
  String get finance_expense_label => _t('finance_expense_label');
  String get finance_balance_label => _t('finance_balance_label');
  String get finance_unpaid_label => _t('finance_unpaid_label');
  String get budget_name_label => _t('budget_name_label');
  String get budget_amount_label => _t('budget_amount_label');
  String get budget_create_action => _t('budget_create_action');
  String get choir_refresh_pool_action => _t('choir_refresh_pool_action');
  String get choir_auto_assign_action => _t('choir_auto_assign_action');
  String get assignment_manual_override_label =>
      _t('assignment_manual_override_label');
  String get assignment_override_reason_label =>
      _t('assignment_override_reason_label');
  String get assignment_add_member_label => _t('assignment_add_member_label');
  String get assignment_bulk_assign_action =>
      _t('assignment_bulk_assign_action');
  String get term_choir => _t('term_choir');
  String get term_protocol => _t('term_protocol');
  String get term_attendance => _t('term_attendance');
  String get term_discipline => _t('term_discipline');
  String get term_rehearsal => _t('term_rehearsal');
  String get term_worship_service => _t('term_worship_service');
  String get term_member => _t('term_member');
  String get term_announcement => _t('term_announcement');
  String get term_schedule => _t('term_schedule');
  String get term_responsibility => _t('term_responsibility');
  String get term_replacement => _t('term_replacement');
  String get term_swap => _t('term_swap');
  String get term_event => _t('term_event');
  String get term_leader => _t('term_leader');
  String get term_committee => _t('term_committee');
  String get term_treasurer => _t('term_treasurer');
  String get term_secretary => _t('term_secretary');
  String get swap_status_requested => _t('swap_status_requested');
  String get swap_status_target_accepted => _t('swap_status_target_accepted');
  String get swap_status_target_rejected => _t('swap_status_target_rejected');
  String get swap_status_leader_pending => _t('swap_status_leader_pending');
  String get swap_status_approved => _t('swap_status_approved');
  String get swap_status_rejected => _t('swap_status_rejected');
  String get swap_status_finalized => _t('swap_status_finalized');
  String get swap_status_cancelled => _t('swap_status_cancelled');
  String get replacement_status_requested => _t('replacement_status_requested');
  String get replacement_status_leader_pending =>
      _t('replacement_status_leader_pending');
  String get replacement_status_approved => _t('replacement_status_approved');
  String get replacement_status_rejected => _t('replacement_status_rejected');
  String get replacement_status_finalized => _t('replacement_status_finalized');
  String get discipline_stage_reported => _t('discipline_stage_reported');
  String get discipline_stage_under_review =>
      _t('discipline_stage_under_review');
  String get discipline_stage_decision_pending =>
      _t('discipline_stage_decision_pending');
  String get discipline_stage_actioned => _t('discipline_stage_actioned');
  String get discipline_stage_closed => _t('discipline_stage_closed');
  String get enum_status_unknown => _t('enum_status_unknown');
  String get settings_appearance_title => _t('settings_appearance_title');
  String get settings_theme_system => _t('settings_theme_system');
  String get settings_theme_light => _t('settings_theme_light');
  String get settings_theme_dark => _t('settings_theme_dark');
  String get event_detail_title => _t('event_detail_title');
  String get event_create_title => _t('event_create_title');
  String get event_assign_action => _t('event_assign_action');
  String get event_mark_attendance_action => _t('event_mark_attendance_action');
  String get event_audit_title => _t('event_audit_title');
  String get event_type_choir_service => _t('event_type_choir_service');
  String get event_type_concert => _t('event_type_concert');
  String get event_type_protocol_service => _t('event_type_protocol_service');
  String get event_type_church_event => _t('event_type_church_event');
  String get event_ministry_both => _t('event_ministry_both');
  String get event_filter_all_types => _t('event_filter_all_types');
  String get event_filter_ministry_all => _t('event_filter_ministry_all');
  String get event_view_month => _t('event_view_month');
  String get event_view_week => _t('event_view_week');
  String get event_start_label => _t('event_start_label');
  String get event_end_label => _t('event_end_label');
  String get event_location_label => _t('event_location_label');
  String get event_description_label => _t('event_description_label');
  String get event_recurrence_label => _t('event_recurrence_label');
  String get event_conflict_error => _t('event_conflict_error');
  String get event_created_success => _t('event_created_success');
  String get event_assigned_members_title => _t('event_assigned_members_title');
  String get event_attendance_title => _t('event_attendance_title');
  String get dashboard_section_overview => _t('dashboard_section_overview');
  String get dashboard_kpi_upcoming_events => _t('dashboard_kpi_upcoming_events');
  String get dashboard_kpi_upcoming_assignments =>
      _t('dashboard_kpi_upcoming_assignments');
  String get dashboard_kpi_pending_swaps => _t('dashboard_kpi_pending_swaps');
  String get dashboard_kpi_pending_replacements =>
      _t('dashboard_kpi_pending_replacements');
  String get dashboard_kpi_attendance_rate => _t('dashboard_kpi_attendance_rate');
  String get dashboard_kpi_active_discipline =>
      _t('dashboard_kpi_active_discipline');
  String get dashboard_kpi_sync_conflicts => _t('dashboard_kpi_sync_conflicts');
  String get dashboard_kpi_finance_balance => _t('dashboard_kpi_finance_balance');
  String get sync_conflicts_title => _t('sync_conflicts_title');
  String get sync_last_sync => _t('sync_last_sync');
  String sync_failed_count(int count) =>
      _t('sync_failed_count').replaceAll('{count}', '$count');
  String get sync_retry_action => _t('sync_retry_action');
  String get sync_conflict_reason => _t('sync_conflict_reason');
  String get attendance_bulk_title => _t('attendance_bulk_title');
  String get attendance_bulk_save => _t('attendance_bulk_save');
  String get assignment_validate_action => _t('assignment_validate_action');
  String get assignment_conflict_warning => _t('assignment_conflict_warning');
  String get member_availability_title => _t('member_availability_title');
  String get member_unavailable_dates_label =>
      _t('member_unavailable_dates_label');
  String get common_create => _t('common_create');
  String get common_back => _t('common_back');
  String get common_next => _t('common_next');
  String get common_retry => _t('common_retry');
  String get nav_coverage => _t('nav_coverage');
  String get attendance_governance_title => _t('attendance_governance_title');
  String get attendance_mark_all_present => _t('attendance_mark_all_present');
  String get attendance_excuse_review_title =>
      _t('attendance_excuse_review_title');
  String get attendance_excuse_no_reason => _t('attendance_excuse_no_reason');
  String get attendance_select_event_hint => _t('attendance_select_event_hint');
  String get attendance_roster_empty => _t('attendance_roster_empty');
  String get attendance_reliability_title => _t('attendance_reliability_title');
  String attendance_reliability_subtitle(String percentage, String band) =>
      _p('attendance_reliability_subtitle', {
        'percentage': percentage,
        'band': band,
      });
  String get attendance_excuse_request_title =>
      _t('attendance_excuse_request_title');
  String get attendance_excuse_request_subtitle =>
      _t('attendance_excuse_request_subtitle');
  String get attendance_excuse_reason_label =>
      _t('attendance_excuse_reason_label');
  String get attendance_excuse_submit_action =>
      _t('attendance_excuse_submit_action');
  String attendance_excuse_submitted(String eventName) =>
      _p('attendance_excuse_submitted', {'eventName': eventName});
  String get attendance_recent_title => _t('attendance_recent_title');
  String get attendance_recent_empty => _t('attendance_recent_empty');
  String get attendance_status_attended => _t('attendance_status_attended');
  String get attendance_status_replacement =>
      _t('attendance_status_replacement');
  String get attendance_status_voluntary => _t('attendance_status_voluntary');
  String get attendance_excuse_illness => _t('attendance_excuse_illness');
  String get attendance_excuse_travel => _t('attendance_excuse_travel');
  String get attendance_excuse_work_school => _t('attendance_excuse_work_school');
  String get attendance_excuse_emergency => _t('attendance_excuse_emergency');
  String get attendance_excuse_family => _t('attendance_excuse_family');
  String get attendance_excuse_approved_leave =>
      _t('attendance_excuse_approved_leave');
  String get attendance_excuse_conflict => _t('attendance_excuse_conflict');
  String get attendance_excuse_unknown => _t('attendance_excuse_unknown');
  String get coverage_analytics_title => _t('coverage_analytics_title');
  String get coverage_analytics_swaps => _t('coverage_analytics_swaps');
  String get coverage_analytics_replacements =>
      _t('coverage_analytics_replacements');
  String get coverage_analytics_voluntary => _t('coverage_analytics_voluntary');
  String get coverage_analytics_unresolved => _t('coverage_analytics_unresolved');
  String get coverage_readiness_title => _t('coverage_readiness_title');
  String get coverage_readiness_empty => _t('coverage_readiness_empty');
  String get coverage_team_head_title => _t('coverage_team_head_title');
  String get coverage_team_head_empty => _t('coverage_team_head_empty');
  String get coverage_coordinator_title => _t('coverage_coordinator_title');
  String get coverage_coordinator_empty => _t('coverage_coordinator_empty');
  String get coverage_escalated_title => _t('coverage_escalated_title');
  String get coverage_open_swaps => _t('coverage_open_swaps');
  String get coverage_open_replacements => _t('coverage_open_replacements');
  String get coverage_swaps_empty => _t('coverage_swaps_empty');
  String get coverage_readiness_ready => _t('coverage_readiness_ready');
  String get coverage_readiness_replacement_pending =>
      _t('coverage_readiness_replacement_pending');
  String get coverage_readiness_attendance_risk =>
      _t('coverage_readiness_attendance_risk');
  String get coverage_readiness_staffing_shortage =>
      _t('coverage_readiness_staffing_shortage');
  String get coverage_readiness_operational_danger =>
      _t('coverage_readiness_operational_danger');
  String get attendance_tab_marking => _t('attendance_tab_marking');
  String get attendance_tab_choir => _t('attendance_tab_choir');
  String get attendance_tab_oversight => _t('attendance_tab_oversight');
  String get attendance_choir_title => _t('attendance_choir_title');
  String get attendance_choir_marked => _t('attendance_choir_marked');
  String get attendance_choir_excused => _t('attendance_choir_excused');
  String get attendance_choir_unexcused => _t('attendance_choir_unexcused');
  String get attendance_choir_lateness => _t('attendance_choir_lateness');
  String get attendance_choir_pending_review =>
      _t('attendance_choir_pending_review');
  String get attendance_discipline_title => _t('attendance_discipline_title');
  String get attendance_discipline_subtitle =>
      _t('attendance_discipline_subtitle');
  String get attendance_discipline_empty => _t('attendance_discipline_empty');
  String get attendance_discipline_create => _t('attendance_discipline_create');
  String get attendance_discipline_created =>
      _t('attendance_discipline_created');
  String get coverage_escalate_team_head => _t('coverage_escalate_team_head');
  String get coverage_escalate_coordinator =>
      _t('coverage_escalate_coordinator');
  String get coverage_escalate_president => _t('coverage_escalate_president');
  String get nav_operational => _t('nav_operational');
  String get operational_title => _t('operational_title');
  String get operational_unauthorized => _t('operational_unauthorized');
  String get operational_subtitle_president => _t('operational_subtitle_president');
  String get operational_subtitle_coordinator =>
      _t('operational_subtitle_coordinator');
  String get operational_subtitle_team_head => _t('operational_subtitle_team_head');
  String get operational_subtitle_choir_leader =>
      _t('operational_subtitle_choir_leader');
  String get operational_workflows_title => _t('operational_workflows_title');
  String get operational_open_attendance => _t('operational_open_attendance');
  String get operational_open_coverage => _t('operational_open_coverage');
  String get operational_choir_summary_title => _t('operational_choir_summary_title');
  String get operational_choir_summary_hint => _t('operational_choir_summary_hint');
  String get operational_stat_active_teams => _t('operational_stat_active_teams');
  String get operational_stat_escalated => _t('operational_stat_escalated');
  String get operational_stat_pending_replacements =>
      _t('operational_stat_pending_replacements');
  String get operational_stat_discipline_risk => _t('operational_stat_discipline_risk');
  String get operational_stat_readiness => _t('operational_stat_readiness');
  String get operational_stat_teams => _t('operational_stat_teams');
  String get operational_stat_pending_absences =>
      _t('operational_stat_pending_absences');
  String get phoneRequired => _t('phoneRequired');
  String get updatePhoneNow => _t('updatePhoneNow');
  String get restrictedUntilPhoneAdded => _t('restrictedUntilPhoneAdded');
  String get warningPhoneIncomplete => _t('warningPhoneIncomplete');
  String get my_contributions_title => _t('my_contributions_title');
  String get my_contributions_member_number => _t('my_contributions_member_number');
  String get my_contributions_history_title => _t('my_contributions_history_title');
  String get my_contributions_total => _t('my_contributions_total');
  String get my_contributions_outstanding => _t('my_contributions_outstanding');
  String get my_contributions_ack_sent => _t('my_contributions_ack_sent');
  String get my_contributions_ack_pending => _t('my_contributions_ack_pending');
  String get my_contributions_ack_failed => _t('my_contributions_ack_failed');
  String get operational_units_title => _t('operational_units_title');
  String get operational_unit_detail_title => _t('operational_unit_detail_title');
  String get ministries_title => _t('ministries_title');
  String get ministry_detail_title => _t('ministry_detail_title');
  String get families_title => _t('families_title');
  String get families_head => _t('families_head');
  String get families_member_count => _t('families_member_count');
  String get families_health_score => _t('families_health_score');
  String get families_attendance => _t('families_attendance');
  String get families_contributions => _t('families_contributions');
  String get families_participation => _t('families_participation');
  String get search_title => _t('search_title');
  String get search_placeholder => _t('search_placeholder');
  String get search_group_members => _t('search_group_members');
  String get search_group_families => _t('search_group_families');
  String get search_group_events => _t('search_group_events');
  String get search_group_assignments => _t('search_group_assignments');
  String get search_group_contributions => _t('search_group_contributions');
  String get search_group_welfare_cases => _t('search_group_welfare_cases');
  String get search_group_songs => _t('search_group_songs');
  String get search_group_rehearsals => _t('search_group_rehearsals');
  String get welfare_title => _t('welfare_title');
  String get welfare_open_cases => _t('welfare_open_cases');
  String get welfare_funds_raised => _t('welfare_funds_raised');
  String get welfare_raised => _t('welfare_raised');
  String get welfare_remaining => _t('welfare_remaining');
  String get welfare_amount => _t('welfare_amount');
  String get welfare_contribute => _t('welfare_contribute');
  String get music_title => _t('music_title');
  String get music_usage_count => _t('music_usage_count');
  String get rehearsals_title => _t('rehearsals_title');
  String get rehearsals_readiness => _t('rehearsals_readiness');
  String get rehearsals_attendance => _t('rehearsals_attendance');
  String get rehearsals_plan => _t('rehearsals_plan');
  String get rehearsals_reports => _t('rehearsals_reports');
  String get rehearsals_prep_score => _t('rehearsals_prep_score');
  String get welfare_create_title => _t('welfare_create_title');
  String get welfare_field_title => _t('welfare_field_title');
  String get welfare_field_description => _t('welfare_field_description');
  String get welfare_field_member_id => _t('welfare_field_member_id');
  String get welfare_category => _t('welfare_category');
  String get welfare_submit_case => _t('welfare_submit_case');
  String get welfare_assistance_title => _t('welfare_assistance_title');
  String get welfare_assistance_type => _t('welfare_assistance_type');
  String get welfare_record_assistance => _t('welfare_record_assistance');
  String get welfare_reports_title => _t('welfare_reports_title');
  String get welfare_assistance_total => _t('welfare_assistance_total');
  String get welfare_tab_overview => _t('welfare_tab_overview');
  String get welfare_timeline => _t('welfare_timeline');
  String get welfare_timeline_empty => _t('welfare_timeline_empty');
  String get welfare_contributions => _t('welfare_contributions');
  String get welfare_offline_banner => _t('welfare_offline_banner');
  String get music_favorites => _t('music_favorites');
  String get music_favorite => _t('music_favorite');
  String get music_unfavorite => _t('music_unfavorite');
  String get music_recent => _t('music_recent');
  String get music_lyrics => _t('music_lyrics');
  String get music_assets => _t('music_assets');
  String get search_group_welfare_categories => _t('search_group_welfare_categories');
  String get search_group_choir_documents => _t('search_group_choir_documents');
  String get search_group_choir_meetings => _t('search_group_choir_meetings');
  String get search_group_welfare_assistance => _t('search_group_welfare_assistance');
  String get devotion_center_title => _t('devotion_center_title');
  String get devotion_pinned => _t('devotion_pinned');
  String get devotion_verse_of_day => _t('devotion_verse_of_day');
  String get devotion_encouragement => _t('devotion_encouragement');
  String get devotion_share => _t('devotion_share');
  String get devotion_open_center => _t('devotion_open_center');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['rw', 'en', 'fr'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture(AppLocalizations(locale));
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}

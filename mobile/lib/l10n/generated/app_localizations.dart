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
      'auth_sign_in_action': 'Injira',
      'auth_email_label': 'Imeri',
      'auth_password_label': 'Ijambo banga',
      'auth_email_invalid': 'Andika imeri yemewe',
      'auth_password_min_length': 'Ijambo banga rigomba kugira inyuguti 6',
      'auth_login_failed': 'Kwinjira byanze',
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
      'sync_result_applied': 'Byakoreshejwe: {applied}, Byanze: {rejected}',
      'budget_amount_subtitle': 'Amafaranga: {amount}',
      'choir_eligible_members_label': 'Abemerewe: {count}',
      'choir_slot_subtitle': 'Umurongo #{slot}',
      'choir_assigned_count_message':
          'Byashyizwe ku banyamuryango {count}',
      'assignment_queue_title': 'Urutonde ({count})',
      'assignment_members_assigned_message':
          'Byashyizwe ku banyamuryango {count}',
    },
    'en': {
      'app_title': 'CMMS',
      'auth_sign_in_action': 'Sign in',
      'auth_email_label': 'Email',
      'auth_password_label': 'Password',
      'auth_email_invalid': 'Enter a valid email address',
      'auth_password_min_length': 'Password must be at least 6 characters',
      'auth_login_failed': 'Sign in failed',
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
    },
    'fr': {
      'app_title': 'CMMS',
      'auth_sign_in_action': 'Se connecter',
      'auth_email_label': 'E-mail',
      'auth_password_label': 'Mot de passe',
      'auth_email_invalid': 'Saisissez une adresse e-mail valide',
      'auth_password_min_length':
          'Le mot de passe doit contenir au moins 6 caractères',
      'auth_login_failed': 'Échec de la connexion',
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
      'sync_result_applied': 'Appliqués : {applied}, Rejetés : {rejected}',
      'budget_amount_subtitle': 'Montant : {amount}',
      'choir_eligible_members_label': 'Membres éligibles : {count}',
      'choir_slot_subtitle': 'Place n°{slot}',
      'choir_assigned_count_message': '{count} membres affectés',
      'assignment_queue_title': 'File ({count})',
      'assignment_members_assigned_message': '{count} membres affectés',
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
  String get auth_sign_in_action => _t('auth_sign_in_action');
  String get auth_email_label => _t('auth_email_label');
  String get auth_password_label => _t('auth_password_label');
  String get auth_email_invalid => _t('auth_email_invalid');
  String get auth_password_min_length => _t('auth_password_min_length');
  String get auth_login_failed => _t('auth_login_failed');
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

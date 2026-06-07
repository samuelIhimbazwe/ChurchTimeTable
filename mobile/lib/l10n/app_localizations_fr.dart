// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get app_title => 'CMMS';

  @override
  String get app_tagline => 'Système de gestion d\'église';

  @override
  String get nav_home => 'Accueil';

  @override
  String get nav_members => 'Membres';

  @override
  String get nav_events => 'Événements';

  @override
  String get nav_more => 'Plus';

  @override
  String get members_title => 'Membres';

  @override
  String get member_profile_title => 'Profil membre';

  @override
  String get member_profile_timeline => 'Chronologie';

  @override
  String get member_profile_timeline_empty => 'Aucune activité pour le moment.';

  @override
  String get member_profile_status => 'Statut';

  @override
  String get member_profile_voice => 'Section vocale';

  @override
  String get member_profile_family => 'Famille';

  @override
  String get member_profile_welfare => 'Dossiers bien-être ouverts';

  @override
  String get members_empty => 'Aucun membre trouvé.';

  @override
  String get auth_sign_in_action => 'Se connecter';

  @override
  String get auth_email_label => 'E-mail';

  @override
  String get auth_password_label => 'Mot de passe';

  @override
  String get auth_email_invalid => 'Saisissez une adresse e-mail valide';

  @override
  String get auth_password_min_length =>
      'Le mot de passe doit contenir au moins 6 caractères';

  @override
  String get auth_login_failed => 'Échec de la connexion';

  @override
  String get validation_required => 'Ce champ est obligatoire';

  @override
  String get onboarding_signup_title => 'Inscription au ministère';

  @override
  String get onboarding_signup_first_name => 'Prénom';

  @override
  String get onboarding_signup_last_name => 'Nom';

  @override
  String get onboarding_signup_phone => 'Téléphone (facultatif)';

  @override
  String get onboarding_signup_ministry => 'Ministère';

  @override
  String get onboarding_signup_ministry_choir => 'Chorale';

  @override
  String get onboarding_signup_ministry_protocol => 'Protocol';

  @override
  String get onboarding_signup_ministry_both => 'Les deux ministères';

  @override
  String get onboarding_signup_ministry_choir_desc =>
      'Servir dans la louange par le chant, les répétitions et les offices.';

  @override
  String get onboarding_signup_ministry_protocol_desc =>
      'Accueillir, guider et coordonner l\'hospitalité pendant les offices.';

  @override
  String get onboarding_signup_ministry_both_desc =>
      'Vous participez à la chorale et au protocol.';

  @override
  String get onboarding_signup_confirm_password => 'Confirmer le mot de passe';

  @override
  String get onboarding_signup_password_mismatch =>
      'Les mots de passe ne correspondent pas.';

  @override
  String get onboarding_signup_approval_note =>
      'Après envoi, un responsable examinera votre inscription.';

  @override
  String get onboarding_signup_back => 'Retour';

  @override
  String get onboarding_signup_continue => 'Continuer';

  @override
  String get onboarding_signup_submit => 'Envoyer l\'inscription';

  @override
  String get onboarding_signup_have_account => 'Déjà un compte ? Se connecter';

  @override
  String get onboarding_pending_eyebrow => 'Inscription reçue';

  @override
  String get onboarding_pending_title => 'Votre demande est en cours d\'examen';

  @override
  String onboarding_pending_greeting(String name) {
    return 'Merci, $name.';
  }

  @override
  String get onboarding_pending_body =>
      'Votre inscription au ministère a bien été reçue.';

  @override
  String get onboarding_pending_step_review =>
      'Un responsable examinera vos informations.';

  @override
  String get onboarding_pending_step_notify =>
      'Vous recevrez une notification lors de la décision.';

  @override
  String get onboarding_pending_step_access =>
      'Une fois approuvé, vous pourrez consulter horaires et actualités.';

  @override
  String get onboarding_pending_help =>
      'Contactez votre responsable de chorale ou de protocol si besoin.';

  @override
  String get dashboard_member_title => 'Mon tableau de bord';

  @override
  String dashboard_welcome(Object name) {
    return 'Bon retour, $name';
  }

  @override
  String get dashboard_leader_title => 'Tableau de bord responsable';

  @override
  String get nav_calendar => 'Calendrier des événements';

  @override
  String get nav_attendance => 'Présence';

  @override
  String get nav_swaps => 'Échanges';

  @override
  String get nav_replacements => 'Remplacements';

  @override
  String get nav_discipline => 'Discipline';

  @override
  String get nav_finance => 'Finances de la chorale';

  @override
  String get nav_notifications => 'Notifications';

  @override
  String get nav_sync => 'Synchronisation hors ligne';

  @override
  String get nav_assignments => 'Affectations';

  @override
  String get nav_choir_rotation => 'Rotation chorale';

  @override
  String get nav_budgets => 'Budgets';

  @override
  String get nav_settings => 'Paramètres';

  @override
  String get member_attendance_label => 'Présence';

  @override
  String get attendance_status_present => 'Présent';

  @override
  String get attendance_status_absent => 'Absent';

  @override
  String get attendance_status_late => 'En retard';

  @override
  String get attendance_status_excused => 'Excusé';

  @override
  String get attendance_status_unexcused => 'Non excusé';

  @override
  String get attendance_save_action => 'Enregistrer la présence';

  @override
  String get attendance_saved_success => 'Présence enregistrée';

  @override
  String get attendance_queued_offline =>
      'Mis en file pour synchronisation hors ligne';

  @override
  String get attendance_notes_label => 'Notes';

  @override
  String get event_picker_label => 'Sélectionner un événement';

  @override
  String get member_picker_label => 'Sélectionner un membre';

  @override
  String get swap_list_title => 'Échanges';

  @override
  String get swap_request_action => 'Demander un échange';

  @override
  String get swap_accept_action => 'Accepter l\'échange';

  @override
  String get swap_reject_action => 'Refuser';

  @override
  String get swap_leader_approve_action => 'Approuver (responsable)';

  @override
  String get swap_finalize_action => 'Finaliser l\'échange';

  @override
  String get replacement_title => 'Remplacements';

  @override
  String get replacement_request_action => 'Demander un remplacement';

  @override
  String get discipline_title => 'Discipline';

  @override
  String get finance_summary_title => 'Finances de la chorale';

  @override
  String get sync_title => 'Synchronisation hors ligne';

  @override
  String get sync_now_action => 'Synchroniser';

  @override
  String get sync_pending_count => 'Éléments en attente';

  @override
  String get settings_title => 'Paramètres';

  @override
  String get settings_language_title => 'Langue';

  @override
  String get settings_language_subtitle =>
      'Choisissez la langue de l\'application';

  @override
  String get language_kinyarwanda => 'Kinyarwanda';

  @override
  String get language_english => 'Anglais';

  @override
  String get language_french => 'Français';

  @override
  String get language_changed_success => 'Langue mise à jour';

  @override
  String get common_refresh => 'Actualiser';

  @override
  String get common_save => 'Enregistrer';

  @override
  String get common_cancel => 'Annuler';

  @override
  String get common_logout => 'Déconnexion';

  @override
  String get common_loading => 'Veuillez patienter...';

  @override
  String get error_conflict => 'Conflit d\'horaire détecté';

  @override
  String get error_unauthorized => 'Identifiants invalides';

  @override
  String get error_forbidden => 'Accès refusé';

  @override
  String get error_not_found => 'Introuvable';

  @override
  String get error_validation => 'Échec de la validation';

  @override
  String get error_business_rule => 'Action non autorisée';

  @override
  String get error_network => 'Réseau indisponible';

  @override
  String get error_unknown => 'Une erreur s\'est produite';

  @override
  String get member_name_fallback => 'Membre';

  @override
  String get sync_pending_hint => 'Éléments en attente dans la file';

  @override
  String get sync_queued_items_title => 'Éléments en file';

  @override
  String get sync_offline_skipped => 'Hors ligne';

  @override
  String get sync_queue_empty_skipped => 'File vide';

  @override
  String sync_result_applied(int applied, int rejected) {
    return 'Appliqués : $applied, Rejetés : $rejected';
  }

  @override
  String get notifications_title => 'Notifications';

  @override
  String get assignments_title => 'Affectations';

  @override
  String get choir_rotation_title => 'Rotation chorale';

  @override
  String get budgets_title => 'Budgets';

  @override
  String get calendar_selected_day => 'Événements ce jour';

  @override
  String get replacement_event_id_label => 'ID de l\'événement';

  @override
  String get replacement_absent_member_label => 'ID membre absent (facultatif)';

  @override
  String get replacement_cover_member_label => 'ID remplaçant (facultatif)';

  @override
  String get replacement_requested_success => 'Remplacement demandé';

  @override
  String get swap_with_member_label => 'Échanger avec';

  @override
  String get swap_details_title => 'Détails de l\'échange';

  @override
  String get common_approve => 'Approuver';

  @override
  String get common_finalize => 'Finaliser';

  @override
  String get finance_income_label => 'Revenus';

  @override
  String get finance_expense_label => 'Dépenses';

  @override
  String get finance_balance_label => 'Solde';

  @override
  String get finance_unpaid_label => 'Impaye';

  @override
  String get budget_name_label => 'Nom du budget';

  @override
  String get budget_amount_label => 'Montant';

  @override
  String get budget_create_action => 'Créer un budget';

  @override
  String budget_amount_subtitle(Object amount) {
    return 'Montant : $amount';
  }

  @override
  String get choir_refresh_pool_action => 'Actualiser la liste';

  @override
  String get choir_auto_assign_action => 'Affectation auto';

  @override
  String choir_eligible_members_label(int count) {
    return 'Membres éligibles : $count';
  }

  @override
  String choir_slot_subtitle(Object slot) {
    return 'Place n°$slot';
  }

  @override
  String choir_assigned_count_message(int count) {
    return '$count membres affectés';
  }

  @override
  String get assignment_manual_override_label => 'Dérogation manuelle';

  @override
  String get assignment_override_reason_label => 'Motif de dérogation';

  @override
  String get assignment_add_member_label => 'Ajouter un membre';

  @override
  String assignment_queue_title(int count) {
    return 'File ($count)';
  }

  @override
  String get assignment_bulk_assign_action => 'Affectation groupée';

  @override
  String assignment_members_assigned_message(int count) {
    return '$count membres affectés';
  }

  @override
  String get term_choir => 'Chorale';

  @override
  String get term_protocol => 'Protocole';

  @override
  String get term_attendance => 'Présence';

  @override
  String get term_discipline => 'Discipline';

  @override
  String get term_rehearsal => 'Répétition';

  @override
  String get term_worship_service => 'Célébration';

  @override
  String get term_member => 'Membre';

  @override
  String get term_announcement => 'Annonce';

  @override
  String get term_schedule => 'Planning';

  @override
  String get term_responsibility => 'Affectation';

  @override
  String get term_replacement => 'Remplacement';

  @override
  String get term_swap => 'Échange de service';

  @override
  String get term_event => 'Événement';

  @override
  String get term_leader => 'Responsable';

  @override
  String get term_committee => 'Comité';

  @override
  String get term_treasurer => 'Trésorier';

  @override
  String get term_secretary => 'Secrétaire';

  @override
  String swap_request_sent(Object memberName) {
    return '$memberName a demandé un échange de service avec vous';
  }

  @override
  String swap_status_updated(Object statusLabel) {
    return 'Mise à jour d\'échange : $statusLabel';
  }

  @override
  String swap_list_item_subtitle(Object eventName, Object statusLabel) {
    return '$eventName · $statusLabel';
  }

  @override
  String attendance_marked_for_event(Object eventName) {
    return 'Votre présence pour $eventName a été enregistrée';
  }

  @override
  String discipline_case_opened(Object caseTitle) {
    return 'Un dossier disciplinaire a été ouvert : $caseTitle';
  }

  @override
  String dues_remaining(Object amount) {
    return 'Solde restant : $amount';
  }

  @override
  String event_assigned_to_you(Object eventName) {
    return 'Vous êtes affecté à : $eventName';
  }

  @override
  String replacement_requested_for_event(Object eventName) {
    return 'Remplacement demandé pour $eventName';
  }

  @override
  String get replacement_list_title => 'Demandes de remplacement';

  @override
  String get replacement_list_empty => 'Aucune demande de remplacement';

  @override
  String replacement_list_item_subtitle(
      Object eventName, Object absentName, Object coverName) {
    return '$eventName · $absentName → $coverName';
  }

  @override
  String get swap_status_requested => 'Demandé';

  @override
  String get swap_status_target_accepted => 'Accepté par le partenaire';

  @override
  String get swap_status_target_rejected => 'Refusé par le partenaire';

  @override
  String get swap_status_leader_pending => 'En attente du responsable';

  @override
  String get swap_status_approved => 'Approuvé par le responsable';

  @override
  String get swap_status_rejected => 'Refusé';

  @override
  String get swap_status_finalized => 'Finalisé';

  @override
  String get swap_status_cancelled => 'Annulé';

  @override
  String get replacement_status_requested => 'Demandé';

  @override
  String get replacement_status_leader_pending => 'En attente du responsable';

  @override
  String get replacement_status_approved => 'Approuvé';

  @override
  String get replacement_status_rejected => 'Refusé';

  @override
  String get replacement_status_finalized => 'Finalisé';

  @override
  String get discipline_stage_reported => 'Signalé';

  @override
  String get discipline_stage_under_review => 'En cours d\'examen';

  @override
  String get discipline_stage_decision_pending => 'Décision en attente';

  @override
  String get discipline_stage_actioned => 'Mesure prise';

  @override
  String get discipline_stage_closed => 'Clôturé';

  @override
  String get enum_status_unknown => 'Statut inconnu';

  @override
  String get settings_appearance_title => 'Apparence';

  @override
  String get settings_theme_system => 'Système';

  @override
  String get settings_theme_light => 'Clair';

  @override
  String get settings_theme_dark => 'Sombre';

  @override
  String get event_detail_title => 'Détails de l\'événement';

  @override
  String get event_create_title => 'Créer un événement';

  @override
  String get event_edit_action => 'Modifier';

  @override
  String get event_assign_action => 'Affecter des membres';

  @override
  String get event_mark_attendance_action => 'Enregistrer la présence';

  @override
  String get event_notify_action => 'Notifier les membres';

  @override
  String get event_history_title => 'Historique';

  @override
  String get event_audit_title => 'Piste d\'audit';

  @override
  String get event_type_choir_service => 'Service de chorale';

  @override
  String get event_type_concert => 'Concert';

  @override
  String get event_type_protocol_service => 'Service protocol';

  @override
  String get event_type_church_event => 'Événement paroissial';

  @override
  String get event_ministry_both => 'Les deux ministères';

  @override
  String get event_filter_all_types => 'Tous les types';

  @override
  String get event_filter_ministry_all => 'Tous les ministères';

  @override
  String get event_view_month => 'Mois';

  @override
  String get event_view_week => 'Semaine';

  @override
  String get event_start_label => 'Début';

  @override
  String get event_end_label => 'Fin';

  @override
  String get event_location_label => 'Lieu';

  @override
  String get event_description_label => 'Description';

  @override
  String get event_recurrence_label => 'Récurrence';

  @override
  String get event_conflict_error => 'L\'heure de fin doit être après le début';

  @override
  String get event_created_success => 'Événement créé';

  @override
  String get event_assigned_members_title => 'Membres affectés';

  @override
  String get event_attendance_title => 'Présence';

  @override
  String get dashboard_section_overview => 'Vue d\'ensemble';

  @override
  String get dashboard_kpi_upcoming_events => 'Événements à venir';

  @override
  String get dashboard_kpi_upcoming_assignments => 'Affectations à venir';

  @override
  String get dashboard_kpi_pending_swaps => 'Échanges en attente';

  @override
  String get dashboard_kpi_pending_replacements => 'Remplacements en attente';

  @override
  String get dashboard_kpi_attendance_rate => 'Taux de présence';

  @override
  String get dashboard_kpi_active_discipline => 'Discipline active';

  @override
  String get dashboard_kpi_sync_conflicts => 'Conflits de sync';

  @override
  String get dashboard_kpi_finance_balance => 'Solde financier';

  @override
  String get sync_conflicts_title => 'Conflits de synchronisation';

  @override
  String get sync_last_sync => 'Dernière sync';

  @override
  String sync_failed_count(int count) {
    return 'Échecs : $count';
  }

  @override
  String get sync_retry_action => 'Réessayer';

  @override
  String get sync_conflict_reason => 'Motif';

  @override
  String get attendance_bulk_title => 'Présence groupée';

  @override
  String get attendance_bulk_save => 'Tout enregistrer';

  @override
  String get assignment_validate_action => 'Valider l\'affectation';

  @override
  String get assignment_conflict_warning => 'Conflit d\'horaire détecté';

  @override
  String get assignment_quota_warning => 'Quota dépassé';

  @override
  String get member_availability_title => 'Disponibilité du membre';

  @override
  String get member_unavailable_dates_label => 'Dates indisponibles';

  @override
  String get common_create => 'Créer';

  @override
  String get common_retry => 'Réessayer';

  @override
  String get nav_coverage => 'Couverture';

  @override
  String get attendance_governance_title => 'Gouvernance de présence';

  @override
  String get attendance_mark_all_present => 'Tout marquer présent';

  @override
  String get attendance_excuse_review_title => 'Revue des excuses';

  @override
  String get attendance_excuse_no_reason => 'Aucune raison fournie';

  @override
  String get attendance_select_event_hint =>
      'Sélectionnez un événement pour charger la liste';

  @override
  String get attendance_roster_empty => 'Aucun membre affecté à cet événement';

  @override
  String get attendance_reliability_title => 'Score de fiabilité';

  @override
  String attendance_reliability_subtitle(Object band, Object percentage) {
    return '$percentage% · $band';
  }

  @override
  String get attendance_excuse_request_title => 'Demander une absence excusée';

  @override
  String get attendance_excuse_request_subtitle =>
      'Soumettez une excuse pour une affectation à venir.';

  @override
  String get attendance_excuse_reason_label => 'Motif';

  @override
  String get attendance_excuse_submit_action => 'Envoyer l\'excuse';

  @override
  String attendance_excuse_submitted(Object eventName) {
    return 'Excuse envoyée pour $eventName';
  }

  @override
  String get attendance_recent_title => 'Présence récente';

  @override
  String get attendance_recent_empty => 'Aucun historique de présence';

  @override
  String get attendance_status_attended => 'Présent';

  @override
  String get attendance_status_replacement => 'Remplacement servi';

  @override
  String get attendance_status_voluntary => 'Service volontaire';

  @override
  String get attendance_excuse_illness => 'Maladie';

  @override
  String get attendance_excuse_travel => 'Voyage';

  @override
  String get attendance_excuse_work_school => 'Travail ou école';

  @override
  String get attendance_excuse_emergency => 'Urgence';

  @override
  String get attendance_excuse_family => 'Famille';

  @override
  String get attendance_excuse_approved_leave => 'Congé approuvé';

  @override
  String get attendance_excuse_conflict => 'Conflit inévitable';

  @override
  String get attendance_excuse_unknown => 'Inconnu';

  @override
  String get coverage_analytics_title => 'Analyses de couverture';

  @override
  String get coverage_analytics_swaps => 'Échanges';

  @override
  String get coverage_analytics_replacements => 'Remplacements';

  @override
  String get coverage_analytics_voluntary => 'Service volontaire';

  @override
  String get coverage_analytics_unresolved => 'Échanges non résolus';

  @override
  String get coverage_readiness_title => 'Préparation';

  @override
  String get coverage_readiness_empty => 'Aucune alerte de préparation';

  @override
  String get coverage_team_head_title => 'Chef d\'équipe';

  @override
  String get coverage_team_head_empty => 'Aucun problème de couverture';

  @override
  String get coverage_coordinator_title => 'Coordinateur';

  @override
  String get coverage_coordinator_empty => 'Aucun cas escaladé';

  @override
  String get coverage_escalated_title => 'Escaladé';

  @override
  String get coverage_open_swaps => 'Gérer les échanges';

  @override
  String get coverage_open_replacements => 'Gérer les remplacements';

  @override
  String get coverage_swaps_empty => 'Aucun échange';

  @override
  String get coverage_readiness_ready => 'Prêt';

  @override
  String get coverage_readiness_replacement_pending =>
      'Remplacement en attente';

  @override
  String get coverage_readiness_attendance_risk => 'Risque de présence';

  @override
  String get coverage_readiness_staffing_shortage => 'Effectif insuffisant';

  @override
  String get coverage_readiness_operational_danger => 'Danger opérationnel';

  @override
  String get attendance_tab_marking => 'Marquage';

  @override
  String get attendance_tab_choir => 'Chœur';

  @override
  String get attendance_tab_oversight => 'Supervision';

  @override
  String get attendance_choir_title => 'Présence du chœur';

  @override
  String get attendance_choir_marked => 'Marqué';

  @override
  String get attendance_choir_excused => 'Excusé';

  @override
  String get attendance_choir_unexcused => 'Non excusé';

  @override
  String get attendance_choir_lateness => 'Retard';

  @override
  String get attendance_choir_pending_review => 'En attente de révision';

  @override
  String get attendance_discipline_title => 'Recommandations disciplinaires';

  @override
  String get attendance_discipline_subtitle =>
      'Révision pastorale suggérée — pas de discipline automatique.';

  @override
  String get attendance_discipline_empty =>
      'Aucune recommandation pour le moment.';

  @override
  String get attendance_discipline_create => 'Ouvrir un dossier disciplinaire';

  @override
  String get attendance_discipline_created => 'Dossier disciplinaire créé.';

  @override
  String get coverage_escalate_team_head => 'Escalader au chef d\'équipe';

  @override
  String get coverage_escalate_coordinator => 'Escalader au coordinateur';

  @override
  String get coverage_escalate_president => 'Escalader au président';

  @override
  String get phoneRequired =>
      'Un numéro de téléphone est requis pour continuer.';

  @override
  String get updatePhoneNow => 'Mettre à jour';

  @override
  String get restrictedUntilPhoneAdded =>
      'Un numéro de téléphone est requis pour continuer les opérations ministérielles.';

  @override
  String get warningPhoneIncomplete =>
      'Complétez votre numéro de téléphone pour éviter de perdre l\'accès aux outils ministériels.';

  @override
  String get my_contributions_title => 'Mes contributions';

  @override
  String get my_contributions_member_number => 'Numéro de membre';

  @override
  String get my_contributions_history_title => 'Historique des contributions';

  @override
  String get my_contributions_total => 'Total contribué';

  @override
  String get my_contributions_outstanding => 'Solde restant';

  @override
  String get my_contributions_ack_sent => 'Remerciement envoye';

  @override
  String get my_contributions_ack_pending => 'Accuse en attente';

  @override
  String get my_contributions_ack_failed => 'Accuse echoue';

  @override
  String get operational_units_title => 'Unités opérationnelles';

  @override
  String get operational_unit_detail_title => 'Unité';

  @override
  String get ministries_title => 'Ministères';

  @override
  String get ministry_detail_title => 'Ministère';

  @override
  String get families_title => 'Familles';

  @override
  String get search_group_welfare_cases => 'Dossiers bien-être';

  @override
  String get search_group_songs => 'Chants';

  @override
  String get search_group_rehearsals => 'Répétitions';

  @override
  String get welfare_title => 'Bien-être';

  @override
  String get welfare_open_cases => 'Dossiers ouverts';

  @override
  String get welfare_funds_raised => 'Fonds collectés';

  @override
  String get welfare_raised => 'Collecté';

  @override
  String get welfare_remaining => 'Restant';

  @override
  String get welfare_amount => 'Montant';

  @override
  String get welfare_contribute => 'Contribuer';

  @override
  String get music_title => 'Bibliothèque musicale';

  @override
  String get music_usage_count => 'Utilisations';

  @override
  String get rehearsals_title => 'Répétitions';

  @override
  String get rehearsals_readiness => 'Préparation';

  @override
  String get rehearsals_attendance => 'Présence';

  @override
  String get rehearsals_plan => 'Plan';

  @override
  String get rehearsals_reports => 'Rapports';

  @override
  String get rehearsals_prep_score => 'Préparation au culte';

  @override
  String get welfare_create_title => 'Ouvrir un dossier';

  @override
  String get welfare_field_title => 'Titre';

  @override
  String get welfare_field_description => 'Description';

  @override
  String get welfare_field_member_id => 'ID membre';

  @override
  String get welfare_category => 'Catégorie';

  @override
  String get welfare_submit_case => 'Soumettre';

  @override
  String get welfare_assistance_title => 'Enregistrer une assistance';

  @override
  String get welfare_assistance_type => 'Type d\'assistance';

  @override
  String get welfare_record_assistance => 'Enregistrer';

  @override
  String get welfare_reports_title => 'Rapports bien-être';

  @override
  String get welfare_assistance_total => 'Total assistance';

  @override
  String get welfare_tab_overview => 'Aperçu';

  @override
  String get welfare_timeline => 'Chronologie';

  @override
  String get welfare_timeline_empty => 'Aucun événement pour l\'instant.';

  @override
  String get welfare_contributions => 'Contributions';

  @override
  String get welfare_offline_banner =>
      'Données en cache. Tirez pour actualiser en ligne.';

  @override
  String get music_favorites => 'Favoris';

  @override
  String get music_favorite => 'Ajouter aux favoris';

  @override
  String get music_unfavorite => 'Retirer des favoris';

  @override
  String get music_recent => 'Consultés récemment';

  @override
  String get music_lyrics => 'Paroles';

  @override
  String get music_assets => 'Fichiers';

  @override
  String get common_back => 'Retour';

  @override
  String get common_next => 'Suivant';

  @override
  String get search_group_welfare_categories => 'Catégories bien-être';

  @override
  String get search_group_choir_documents => 'Documents du chœur';

  @override
  String get search_group_choir_meetings => 'Réunions du chœur';

  @override
  String get search_group_welfare_assistance => 'Assistance bien-être';
}

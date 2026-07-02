import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_rw.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fr'),
  ];

  /// No description provided for @app_title.
  ///
  /// In rw, this message translates to:
  /// **'CMMS'**
  String get app_title;

  /// No description provided for @app_tagline.
  ///
  /// In rw, this message translates to:
  /// **'Sisitemu yo gucunga itorero'**
  String get app_tagline;

  /// No description provided for @nav_home.
  ///
  /// In rw, this message translates to:
  /// **'Ahabanza'**
  String get nav_home;

  /// No description provided for @nav_members.
  ///
  /// In rw, this message translates to:
  /// **'Abanyamuryango'**
  String get nav_members;

  /// No description provided for @nav_events.
  ///
  /// In rw, this message translates to:
  /// **'Ibirori'**
  String get nav_events;

  /// No description provided for @nav_more.
  ///
  /// In rw, this message translates to:
  /// **'Ibindi'**
  String get nav_more;

  /// No description provided for @members_title.
  ///
  /// In rw, this message translates to:
  /// **'Abanyamuryango'**
  String get members_title;

  /// No description provided for @member_profile_title.
  ///
  /// In rw, this message translates to:
  /// **'Umwirondoro w\'umunyamuryango'**
  String get member_profile_title;

  /// No description provided for @member_profile_timeline.
  ///
  /// In rw, this message translates to:
  /// **'Ibikorwa by\'umunyamuryango'**
  String get member_profile_timeline;

  /// No description provided for @member_profile_timeline_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta bikorwa biraboneka.'**
  String get member_profile_timeline_empty;

  /// No description provided for @member_profile_status.
  ///
  /// In rw, this message translates to:
  /// **'Imiterere'**
  String get member_profile_status;

  /// No description provided for @member_profile_voice.
  ///
  /// In rw, this message translates to:
  /// **'Ijwi'**
  String get member_profile_voice;

  /// No description provided for @member_profile_family.
  ///
  /// In rw, this message translates to:
  /// **'Umuryango'**
  String get member_profile_family;

  /// No description provided for @member_profile_welfare.
  ///
  /// In rw, this message translates to:
  /// **'Dosiye z\'ubufasha zifunguye'**
  String get member_profile_welfare;

  /// No description provided for @members_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta banyamuryango babonetse.'**
  String get members_empty;

  /// No description provided for @auth_sign_in_action.
  ///
  /// In rw, this message translates to:
  /// **'Injira'**
  String get auth_sign_in_action;

  /// No description provided for @auth_email_label.
  ///
  /// In rw, this message translates to:
  /// **'Imeri'**
  String get auth_email_label;

  /// No description provided for @auth_password_label.
  ///
  /// In rw, this message translates to:
  /// **'Ijambo banga'**
  String get auth_password_label;

  /// No description provided for @auth_email_invalid.
  ///
  /// In rw, this message translates to:
  /// **'Andika imeri yemewe'**
  String get auth_email_invalid;

  /// No description provided for @auth_password_min_length.
  ///
  /// In rw, this message translates to:
  /// **'Ijambo banga rigomba kugira inyuguti 6'**
  String get auth_password_min_length;

  /// No description provided for @auth_login_failed.
  ///
  /// In rw, this message translates to:
  /// **'Kwinjira byanze'**
  String get auth_login_failed;

  /// No description provided for @validation_required.
  ///
  /// In rw, this message translates to:
  /// **'Uyu murandiko urakeneka'**
  String get validation_required;

  /// No description provided for @onboarding_signup_title.
  ///
  /// In rw, this message translates to:
  /// **'Kwiyandikisha mu murimo'**
  String get onboarding_signup_title;

  /// No description provided for @onboarding_signup_first_name.
  ///
  /// In rw, this message translates to:
  /// **'Izina ry\'ibanze'**
  String get onboarding_signup_first_name;

  /// No description provided for @onboarding_signup_last_name.
  ///
  /// In rw, this message translates to:
  /// **'Izina ry\'umuryango'**
  String get onboarding_signup_last_name;

  /// No description provided for @onboarding_signup_phone.
  ///
  /// In rw, this message translates to:
  /// **'Telefone (si ngombwa)'**
  String get onboarding_signup_phone;

  /// No description provided for @onboarding_signup_ministry.
  ///
  /// In rw, this message translates to:
  /// **'Umurimo'**
  String get onboarding_signup_ministry;

  /// No description provided for @onboarding_signup_ministry_choir.
  ///
  /// In rw, this message translates to:
  /// **'Korali'**
  String get onboarding_signup_ministry_choir;

  /// No description provided for @onboarding_signup_ministry_protocol.
  ///
  /// In rw, this message translates to:
  /// **'Protocol'**
  String get onboarding_signup_ministry_protocol;

  /// No description provided for @onboarding_signup_ministry_both.
  ///
  /// In rw, this message translates to:
  /// **'Imirimo ibiri'**
  String get onboarding_signup_ministry_both;

  /// No description provided for @onboarding_signup_ministry_choir_desc.
  ///
  /// In rw, this message translates to:
  /// **'Gukorera mu gusenga binyuze mu ndirimbo n\'imyiteguro.'**
  String get onboarding_signup_ministry_choir_desc;

  /// No description provided for @onboarding_signup_ministry_protocol_desc.
  ///
  /// In rw, this message translates to:
  /// **'Kwakira no gukurikirana serivisi z\'itorero.'**
  String get onboarding_signup_ministry_protocol_desc;

  /// No description provided for @onboarding_signup_ministry_both_desc.
  ///
  /// In rw, this message translates to:
  /// **'Ukora mu korali na protocol.'**
  String get onboarding_signup_ministry_both_desc;

  /// No description provided for @onboarding_signup_confirm_password.
  ///
  /// In rw, this message translates to:
  /// **'Emeza ijambo banga'**
  String get onboarding_signup_confirm_password;

  /// No description provided for @onboarding_signup_password_mismatch.
  ///
  /// In rw, this message translates to:
  /// **'Amagambo y\'ibanga ntahura.'**
  String get onboarding_signup_password_mismatch;

  /// No description provided for @onboarding_signup_approval_note.
  ///
  /// In rw, this message translates to:
  /// **'Nyuma yo kohereza, umuyobozi azasuzuma kwiyandikisha kwawe.'**
  String get onboarding_signup_approval_note;

  /// No description provided for @onboarding_signup_back.
  ///
  /// In rw, this message translates to:
  /// **'Subira inyuma'**
  String get onboarding_signup_back;

  /// No description provided for @onboarding_signup_continue.
  ///
  /// In rw, this message translates to:
  /// **'Komeza'**
  String get onboarding_signup_continue;

  /// No description provided for @onboarding_signup_submit.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza kwiyandikisha'**
  String get onboarding_signup_submit;

  /// No description provided for @onboarding_signup_have_account.
  ///
  /// In rw, this message translates to:
  /// **'Usanzwe ufite konti? Injira'**
  String get onboarding_signup_have_account;

  /// No description provided for @onboarding_pending_eyebrow.
  ///
  /// In rw, this message translates to:
  /// **'Kwiyandikisha kwakiriwe'**
  String get onboarding_pending_eyebrow;

  /// No description provided for @onboarding_pending_title.
  ///
  /// In rw, this message translates to:
  /// **'Icyifuzo cyawe gisuzumwa'**
  String get onboarding_pending_title;

  /// No description provided for @onboarding_pending_greeting.
  ///
  /// In rw, this message translates to:
  /// **'Murakoze, {name}.'**
  String onboarding_pending_greeting(String name);

  /// No description provided for @onboarding_pending_body.
  ///
  /// In rw, this message translates to:
  /// **'Kwiyandikisha kwawe mu murimo kwakiriwe.'**
  String get onboarding_pending_body;

  /// No description provided for @onboarding_pending_step_review.
  ///
  /// In rw, this message translates to:
  /// **'Umuyobozi azasuzuma amakuru yawe.'**
  String get onboarding_pending_step_review;

  /// No description provided for @onboarding_pending_step_notify.
  ///
  /// In rw, this message translates to:
  /// **'Uzakira ubutumwa igihe icyemezo cyakozwe.'**
  String get onboarding_pending_step_notify;

  /// No description provided for @onboarding_pending_step_access.
  ///
  /// In rw, this message translates to:
  /// **'Niyo wemewe, uzabona gahunda n\'amakuru y\'umurimo.'**
  String get onboarding_pending_step_access;

  /// No description provided for @onboarding_pending_help.
  ///
  /// In rw, this message translates to:
  /// **'Vugana n\'umuyobozi wa korali cyangwa wa protocol niba ukeneye ubufasha.'**
  String get onboarding_pending_help;

  /// No description provided for @dashboard_member_title.
  ///
  /// In rw, this message translates to:
  /// **'Ikibaho cyanjye'**
  String get dashboard_member_title;

  /// No description provided for @dashboard_welcome.
  ///
  /// In rw, this message translates to:
  /// **'Murakaza neza, {name}'**
  String dashboard_welcome(Object name);

  /// No description provided for @dashboard_leader_title.
  ///
  /// In rw, this message translates to:
  /// **'Ikibaho cy\'umuyobozi'**
  String get dashboard_leader_title;

  /// No description provided for @nav_calendar.
  ///
  /// In rw, this message translates to:
  /// **'Kalendari y\'ibikorwa'**
  String get nav_calendar;

  /// No description provided for @nav_attendance.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye'**
  String get nav_attendance;

  /// No description provided for @nav_swaps.
  ///
  /// In rw, this message translates to:
  /// **'Gusimburana'**
  String get nav_swaps;

  /// No description provided for @nav_replacements.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura'**
  String get nav_replacements;

  /// No description provided for @nav_discipline.
  ///
  /// In rw, this message translates to:
  /// **'Imyitwarire'**
  String get nav_discipline;

  /// No description provided for @nav_finance.
  ///
  /// In rw, this message translates to:
  /// **'Imari ya Korali'**
  String get nav_finance;

  /// No description provided for @nav_notifications.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru'**
  String get nav_notifications;

  /// No description provided for @nav_sync.
  ///
  /// In rw, this message translates to:
  /// **'Guhuza amakuru'**
  String get nav_sync;

  /// No description provided for @nav_assignments.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira ku gikorwa'**
  String get nav_assignments;

  /// No description provided for @nav_choir_rotation.
  ///
  /// In rw, this message translates to:
  /// **'Guhinduranya muri Korali'**
  String get nav_choir_rotation;

  /// No description provided for @nav_budgets.
  ///
  /// In rw, this message translates to:
  /// **'Ingengo y\'imari'**
  String get nav_budgets;

  /// No description provided for @nav_settings.
  ///
  /// In rw, this message translates to:
  /// **'Igenamiterere'**
  String get nav_settings;

  /// No description provided for @member_attendance_label.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye'**
  String get member_attendance_label;

  /// No description provided for @attendance_status_present.
  ///
  /// In rw, this message translates to:
  /// **'Yitabiriye'**
  String get attendance_status_present;

  /// No description provided for @attendance_status_absent.
  ///
  /// In rw, this message translates to:
  /// **'Ntiyitabiriye'**
  String get attendance_status_absent;

  /// No description provided for @attendance_status_late.
  ///
  /// In rw, this message translates to:
  /// **'Yakererewe'**
  String get attendance_status_late;

  /// No description provided for @attendance_status_excused.
  ///
  /// In rw, this message translates to:
  /// **'Yasobanuye impamvu'**
  String get attendance_status_excused;

  /// No description provided for @attendance_status_unexcused.
  ///
  /// In rw, this message translates to:
  /// **'Nta mpamvu yumvikana'**
  String get attendance_status_unexcused;

  /// No description provided for @attendance_save_action.
  ///
  /// In rw, this message translates to:
  /// **'Bika uko witabiriye'**
  String get attendance_save_action;

  /// No description provided for @attendance_saved_success.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye kwawe cyabitswe'**
  String get attendance_saved_success;

  /// No description provided for @attendance_queued_offline.
  ///
  /// In rw, this message translates to:
  /// **'Byateguwe kwoherezwa nta murandasi'**
  String get attendance_queued_offline;

  /// No description provided for @attendance_notes_label.
  ///
  /// In rw, this message translates to:
  /// **'Inyandiko'**
  String get attendance_notes_label;

  /// No description provided for @event_picker_label.
  ///
  /// In rw, this message translates to:
  /// **'Hitamo igikorwa'**
  String get event_picker_label;

  /// No description provided for @member_picker_label.
  ///
  /// In rw, this message translates to:
  /// **'Hitamo umunyamuryango'**
  String get member_picker_label;

  /// No description provided for @swap_list_title.
  ///
  /// In rw, this message translates to:
  /// **'Gusimburana'**
  String get swap_list_title;

  /// No description provided for @swap_request_action.
  ///
  /// In rw, this message translates to:
  /// **'Saba gusimburana'**
  String get swap_request_action;

  /// No description provided for @swap_accept_action.
  ///
  /// In rw, this message translates to:
  /// **'Emera gusimburana'**
  String get swap_accept_action;

  /// No description provided for @swap_reject_action.
  ///
  /// In rw, this message translates to:
  /// **'Wanga'**
  String get swap_reject_action;

  /// No description provided for @swap_leader_approve_action.
  ///
  /// In rw, this message translates to:
  /// **'Emera n\'umuyobozi'**
  String get swap_leader_approve_action;

  /// No description provided for @swap_finalize_action.
  ///
  /// In rw, this message translates to:
  /// **'Sohora gusimburana'**
  String get swap_finalize_action;

  /// No description provided for @replacement_title.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura'**
  String get replacement_title;

  /// No description provided for @replacement_request_action.
  ///
  /// In rw, this message translates to:
  /// **'Saba gusimbura'**
  String get replacement_request_action;

  /// No description provided for @discipline_title.
  ///
  /// In rw, this message translates to:
  /// **'Imyitwarire'**
  String get discipline_title;

  /// No description provided for @finance_summary_title.
  ///
  /// In rw, this message translates to:
  /// **'Imari ya Korali'**
  String get finance_summary_title;

  /// No description provided for @sync_title.
  ///
  /// In rw, this message translates to:
  /// **'Guhuza amakuru'**
  String get sync_title;

  /// No description provided for @sync_now_action.
  ///
  /// In rw, this message translates to:
  /// **'Huza ubu'**
  String get sync_now_action;

  /// No description provided for @sync_pending_count.
  ///
  /// In rw, this message translates to:
  /// **'Ibitegereje guhuza'**
  String get sync_pending_count;

  /// No description provided for @settings_title.
  ///
  /// In rw, this message translates to:
  /// **'Igenamiterere'**
  String get settings_title;

  /// No description provided for @settings_language_title.
  ///
  /// In rw, this message translates to:
  /// **'Ururimi'**
  String get settings_language_title;

  /// No description provided for @settings_language_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'Hitamo ururimi ukoresha mu gikorwa'**
  String get settings_language_subtitle;

  /// No description provided for @language_kinyarwanda.
  ///
  /// In rw, this message translates to:
  /// **'Ikinyarwanda'**
  String get language_kinyarwanda;

  /// No description provided for @language_english.
  ///
  /// In rw, this message translates to:
  /// **'Icyongereza'**
  String get language_english;

  /// No description provided for @language_french.
  ///
  /// In rw, this message translates to:
  /// **'Igifaransa'**
  String get language_french;

  /// No description provided for @language_changed_success.
  ///
  /// In rw, this message translates to:
  /// **'Ururimi rwahinduwe'**
  String get language_changed_success;

  /// No description provided for @common_refresh.
  ///
  /// In rw, this message translates to:
  /// **'Ongera'**
  String get common_refresh;

  /// No description provided for @common_save.
  ///
  /// In rw, this message translates to:
  /// **'Bika'**
  String get common_save;

  /// No description provided for @common_cancel.
  ///
  /// In rw, this message translates to:
  /// **'Hagarika'**
  String get common_cancel;

  /// No description provided for @common_logout.
  ///
  /// In rw, this message translates to:
  /// **'Sohoka'**
  String get common_logout;

  /// No description provided for @common_loading.
  ///
  /// In rw, this message translates to:
  /// **'Tegereza...'**
  String get common_loading;

  /// No description provided for @error_conflict.
  ///
  /// In rw, this message translates to:
  /// **'Habonetse ikibazo cyo guhura kw\'amasaha cyangwa gahunda'**
  String get error_conflict;

  /// No description provided for @error_unauthorized.
  ///
  /// In rw, this message translates to:
  /// **'Ntushobora kwinjira'**
  String get error_unauthorized;

  /// No description provided for @error_forbidden.
  ///
  /// In rw, this message translates to:
  /// **'Nta burenganzira'**
  String get error_forbidden;

  /// No description provided for @error_not_found.
  ///
  /// In rw, this message translates to:
  /// **'Ntibibonetse'**
  String get error_not_found;

  /// No description provided for @error_validation.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru si yo'**
  String get error_validation;

  /// No description provided for @error_business_rule.
  ///
  /// In rw, this message translates to:
  /// **'Iki gikorwa nticyemewe'**
  String get error_business_rule;

  /// No description provided for @error_network.
  ///
  /// In rw, this message translates to:
  /// **'Imiyoboro nta murandasi'**
  String get error_network;

  /// No description provided for @error_unknown.
  ///
  /// In rw, this message translates to:
  /// **'Habaye ikosa'**
  String get error_unknown;

  /// No description provided for @member_name_fallback.
  ///
  /// In rw, this message translates to:
  /// **'Umunyamuryango'**
  String get member_name_fallback;

  /// No description provided for @sync_pending_hint.
  ///
  /// In rw, this message translates to:
  /// **'Ibitegereje mu murongo'**
  String get sync_pending_hint;

  /// No description provided for @sync_queued_items_title.
  ///
  /// In rw, this message translates to:
  /// **'Ibitegereje'**
  String get sync_queued_items_title;

  /// No description provided for @sync_offline_skipped.
  ///
  /// In rw, this message translates to:
  /// **'Nta murandasi'**
  String get sync_offline_skipped;

  /// No description provided for @sync_queue_empty_skipped.
  ///
  /// In rw, this message translates to:
  /// **'Nta kintu mu murongo'**
  String get sync_queue_empty_skipped;

  /// No description provided for @sync_result_applied.
  ///
  /// In rw, this message translates to:
  /// **'Byakoreshejwe: {applied}, Byanze: {rejected}'**
  String sync_result_applied(int applied, int rejected);

  /// No description provided for @notifications_title.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru'**
  String get notifications_title;

  /// No description provided for @assignments_title.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira ku gikorwa'**
  String get assignments_title;

  /// No description provided for @choir_rotation_title.
  ///
  /// In rw, this message translates to:
  /// **'Guhinduranya aboro'**
  String get choir_rotation_title;

  /// No description provided for @budgets_title.
  ///
  /// In rw, this message translates to:
  /// **'Ingengo y\'imari'**
  String get budgets_title;

  /// No description provided for @calendar_selected_day.
  ///
  /// In rw, this message translates to:
  /// **'Ibikorwa by\'uyu munsi'**
  String get calendar_selected_day;

  /// No description provided for @replacement_event_id_label.
  ///
  /// In rw, this message translates to:
  /// **'ID y\'igikorwa'**
  String get replacement_event_id_label;

  /// No description provided for @replacement_absent_member_label.
  ///
  /// In rw, this message translates to:
  /// **'Umunyamuryango adahari (si ngombwa)'**
  String get replacement_absent_member_label;

  /// No description provided for @replacement_cover_member_label.
  ///
  /// In rw, this message translates to:
  /// **'Umusimbura (si ngombwa)'**
  String get replacement_cover_member_label;

  /// No description provided for @replacement_requested_success.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura byasabwe'**
  String get replacement_requested_success;

  /// No description provided for @swap_with_member_label.
  ///
  /// In rw, this message translates to:
  /// **'Guhindurana na'**
  String get swap_with_member_label;

  /// No description provided for @swap_details_title.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru y\'guhindurana'**
  String get swap_details_title;

  /// No description provided for @common_approve.
  ///
  /// In rw, this message translates to:
  /// **'Emera'**
  String get common_approve;

  /// No description provided for @common_finalize.
  ///
  /// In rw, this message translates to:
  /// **'Sohora'**
  String get common_finalize;

  /// No description provided for @finance_income_label.
  ///
  /// In rw, this message translates to:
  /// **'Inyungu'**
  String get finance_income_label;

  /// No description provided for @finance_expense_label.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga yasohotse'**
  String get finance_expense_label;

  /// No description provided for @finance_balance_label.
  ///
  /// In rw, this message translates to:
  /// **'Asigaye'**
  String get finance_balance_label;

  /// No description provided for @finance_unpaid_label.
  ///
  /// In rw, this message translates to:
  /// **'Ideni risigaye'**
  String get finance_unpaid_label;

  /// No description provided for @budget_name_label.
  ///
  /// In rw, this message translates to:
  /// **'Izina ry\'ingengo'**
  String get budget_name_label;

  /// No description provided for @budget_amount_label.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga'**
  String get budget_amount_label;

  /// No description provided for @budget_create_action.
  ///
  /// In rw, this message translates to:
  /// **'Kurema ingengo'**
  String get budget_create_action;

  /// No description provided for @budget_amount_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga: {amount}'**
  String budget_amount_subtitle(Object amount);

  /// No description provided for @choir_refresh_pool_action.
  ///
  /// In rw, this message translates to:
  /// **'Ongera urutonde'**
  String get choir_refresh_pool_action;

  /// No description provided for @choir_auto_assign_action.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira mu buryo bwikora'**
  String get choir_auto_assign_action;

  /// No description provided for @choir_eligible_members_label.
  ///
  /// In rw, this message translates to:
  /// **'Abemerewe: {count}'**
  String choir_eligible_members_label(int count);

  /// No description provided for @choir_slot_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'Umurongo #{slot}'**
  String choir_slot_subtitle(Object slot);

  /// No description provided for @choir_assigned_count_message.
  ///
  /// In rw, this message translates to:
  /// **'Byashyizwe ku banyamuryango {count}'**
  String choir_assigned_count_message(int count);

  /// No description provided for @assignment_manual_override_label.
  ///
  /// In rw, this message translates to:
  /// **'Guhindura mu buryo bw\'umuntu'**
  String get assignment_manual_override_label;

  /// No description provided for @assignment_override_reason_label.
  ///
  /// In rw, this message translates to:
  /// **'Impamvu yo guhindura'**
  String get assignment_override_reason_label;

  /// No description provided for @assignment_add_member_label.
  ///
  /// In rw, this message translates to:
  /// **'Ongeraho umunyamuryango'**
  String get assignment_add_member_label;

  /// No description provided for @assignment_queue_title.
  ///
  /// In rw, this message translates to:
  /// **'Urutonde ({count})'**
  String assignment_queue_title(int count);

  /// No description provided for @assignment_bulk_assign_action.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira benshi'**
  String get assignment_bulk_assign_action;

  /// No description provided for @assignment_members_assigned_message.
  ///
  /// In rw, this message translates to:
  /// **'Byashyizwe ku banyamuryango {count}'**
  String assignment_members_assigned_message(int count);

  /// No description provided for @term_choir.
  ///
  /// In rw, this message translates to:
  /// **'Korali'**
  String get term_choir;

  /// No description provided for @term_protocol.
  ///
  /// In rw, this message translates to:
  /// **'Protocol'**
  String get term_protocol;

  /// No description provided for @term_attendance.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye'**
  String get term_attendance;

  /// No description provided for @term_discipline.
  ///
  /// In rw, this message translates to:
  /// **'Imyitwarire'**
  String get term_discipline;

  /// No description provided for @term_rehearsal.
  ///
  /// In rw, this message translates to:
  /// **'Imyitozo'**
  String get term_rehearsal;

  /// No description provided for @term_worship_service.
  ///
  /// In rw, this message translates to:
  /// **'Iteraniro'**
  String get term_worship_service;

  /// No description provided for @term_member.
  ///
  /// In rw, this message translates to:
  /// **'Umunyamuryango'**
  String get term_member;

  /// No description provided for @term_announcement.
  ///
  /// In rw, this message translates to:
  /// **'Itangazo'**
  String get term_announcement;

  /// No description provided for @term_schedule.
  ///
  /// In rw, this message translates to:
  /// **'Gahunda'**
  String get term_schedule;

  /// No description provided for @term_responsibility.
  ///
  /// In rw, this message translates to:
  /// **'Inshingano'**
  String get term_responsibility;

  /// No description provided for @term_replacement.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura'**
  String get term_replacement;

  /// No description provided for @term_swap.
  ///
  /// In rw, this message translates to:
  /// **'Gusimburana'**
  String get term_swap;

  /// No description provided for @term_event.
  ///
  /// In rw, this message translates to:
  /// **'Igikorwa'**
  String get term_event;

  /// No description provided for @term_leader.
  ///
  /// In rw, this message translates to:
  /// **'Umuyobozi'**
  String get term_leader;

  /// No description provided for @term_committee.
  ///
  /// In rw, this message translates to:
  /// **'Komite'**
  String get term_committee;

  /// No description provided for @term_treasurer.
  ///
  /// In rw, this message translates to:
  /// **'Umubitsi'**
  String get term_treasurer;

  /// No description provided for @term_secretary.
  ///
  /// In rw, this message translates to:
  /// **'Umunyamabanga'**
  String get term_secretary;

  /// No description provided for @swap_request_sent.
  ///
  /// In rw, this message translates to:
  /// **'{memberName} yasabye ko musimburana'**
  String swap_request_sent(Object memberName);

  /// No description provided for @swap_status_updated.
  ///
  /// In rw, this message translates to:
  /// **'Impinduka ku gusimburana: {statusLabel}'**
  String swap_status_updated(Object statusLabel);

  /// No description provided for @swap_list_item_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'{eventName} · {statusLabel}'**
  String swap_list_item_subtitle(Object eventName, Object statusLabel);

  /// No description provided for @attendance_marked_for_event.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye kwawe kuri {eventName} byanditswe'**
  String attendance_marked_for_event(Object eventName);

  /// No description provided for @discipline_case_opened.
  ///
  /// In rw, this message translates to:
  /// **'Ikibazo cy\'imyitwarire cyafunguwe: {caseTitle}'**
  String discipline_case_opened(Object caseTitle);

  /// No description provided for @dues_remaining.
  ///
  /// In rw, this message translates to:
  /// **'Asigaye: {amount}'**
  String dues_remaining(Object amount);

  /// No description provided for @event_assigned_to_you.
  ///
  /// In rw, this message translates to:
  /// **'Washyizwe ku gikorwa: {eventName}'**
  String event_assigned_to_you(Object eventName);

  /// No description provided for @replacement_requested_for_event.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura byasabwe kuri {eventName}'**
  String replacement_requested_for_event(Object eventName);

  /// No description provided for @replacement_list_title.
  ///
  /// In rw, this message translates to:
  /// **'Urutonde rwa gusimbura'**
  String get replacement_list_title;

  /// No description provided for @replacement_list_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta gusimbura kuri ubu'**
  String get replacement_list_empty;

  /// No description provided for @replacement_list_item_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'{eventName} · {absentName} → {coverName}'**
  String replacement_list_item_subtitle(
      Object eventName, Object absentName, Object coverName);

  /// No description provided for @swap_status_requested.
  ///
  /// In rw, this message translates to:
  /// **'Byasabwe'**
  String get swap_status_requested;

  /// No description provided for @swap_status_target_accepted.
  ///
  /// In rw, this message translates to:
  /// **'Byemewe n\'uwusimburwa'**
  String get swap_status_target_accepted;

  /// No description provided for @swap_status_target_rejected.
  ///
  /// In rw, this message translates to:
  /// **'Byanze n\'uwusimburwa'**
  String get swap_status_target_rejected;

  /// No description provided for @swap_status_leader_pending.
  ///
  /// In rw, this message translates to:
  /// **'Bitegereje umuyobozi'**
  String get swap_status_leader_pending;

  /// No description provided for @swap_status_approved.
  ///
  /// In rw, this message translates to:
  /// **'Byemewe n\'umuyobozi'**
  String get swap_status_approved;

  /// No description provided for @swap_status_rejected.
  ///
  /// In rw, this message translates to:
  /// **'Byanze'**
  String get swap_status_rejected;

  /// No description provided for @swap_status_finalized.
  ///
  /// In rw, this message translates to:
  /// **'Byarangiye'**
  String get swap_status_finalized;

  /// No description provided for @swap_status_cancelled.
  ///
  /// In rw, this message translates to:
  /// **'Byahagaritswe'**
  String get swap_status_cancelled;

  /// No description provided for @replacement_status_requested.
  ///
  /// In rw, this message translates to:
  /// **'Byasabwe'**
  String get replacement_status_requested;

  /// No description provided for @replacement_status_leader_pending.
  ///
  /// In rw, this message translates to:
  /// **'Bitegereje umuyobozi'**
  String get replacement_status_leader_pending;

  /// No description provided for @replacement_status_approved.
  ///
  /// In rw, this message translates to:
  /// **'Byemewe'**
  String get replacement_status_approved;

  /// No description provided for @replacement_status_rejected.
  ///
  /// In rw, this message translates to:
  /// **'Byanze'**
  String get replacement_status_rejected;

  /// No description provided for @replacement_status_finalized.
  ///
  /// In rw, this message translates to:
  /// **'Byarangiye'**
  String get replacement_status_finalized;

  /// No description provided for @discipline_stage_reported.
  ///
  /// In rw, this message translates to:
  /// **'Byatangajwe'**
  String get discipline_stage_reported;

  /// No description provided for @discipline_stage_under_review.
  ///
  /// In rw, this message translates to:
  /// **'Birasuzumwa'**
  String get discipline_stage_under_review;

  /// No description provided for @discipline_stage_decision_pending.
  ///
  /// In rw, this message translates to:
  /// **'Icyemezo gitegerejwe'**
  String get discipline_stage_decision_pending;

  /// No description provided for @discipline_stage_actioned.
  ///
  /// In rw, this message translates to:
  /// **'Byafatiwe icyemezo'**
  String get discipline_stage_actioned;

  /// No description provided for @discipline_stage_closed.
  ///
  /// In rw, this message translates to:
  /// **'Byarangiye'**
  String get discipline_stage_closed;

  /// No description provided for @enum_status_unknown.
  ///
  /// In rw, this message translates to:
  /// **'Ntibisobanutse'**
  String get enum_status_unknown;

  /// No description provided for @settings_appearance_title.
  ///
  /// In rw, this message translates to:
  /// **'Isura'**
  String get settings_appearance_title;

  /// No description provided for @settings_theme_system.
  ///
  /// In rw, this message translates to:
  /// **'Ukurikije sisitemu'**
  String get settings_theme_system;

  /// No description provided for @settings_theme_light.
  ///
  /// In rw, this message translates to:
  /// **'Urumuri'**
  String get settings_theme_light;

  /// No description provided for @settings_theme_dark.
  ///
  /// In rw, this message translates to:
  /// **'Umwijima'**
  String get settings_theme_dark;

  /// No description provided for @event_detail_title.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru y\'igikorwa'**
  String get event_detail_title;

  /// No description provided for @event_create_title.
  ///
  /// In rw, this message translates to:
  /// **'Kurema igikorwa'**
  String get event_create_title;

  /// No description provided for @event_edit_action.
  ///
  /// In rw, this message translates to:
  /// **'Hindura'**
  String get event_edit_action;

  /// No description provided for @event_assign_action.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira ku gikorwa'**
  String get event_assign_action;

  /// No description provided for @event_mark_attendance_action.
  ///
  /// In rw, this message translates to:
  /// **'Andika uko witabiriye'**
  String get event_mark_attendance_action;

  /// No description provided for @event_notify_action.
  ///
  /// In rw, this message translates to:
  /// **'Menyesha'**
  String get event_notify_action;

  /// No description provided for @event_history_title.
  ///
  /// In rw, this message translates to:
  /// **'Amateka'**
  String get event_history_title;

  /// No description provided for @event_audit_title.
  ///
  /// In rw, this message translates to:
  /// **'Inyandiko z\'igenzura'**
  String get event_audit_title;

  /// No description provided for @event_type_choir_service.
  ///
  /// In rw, this message translates to:
  /// **'Iteraniro rya Korali'**
  String get event_type_choir_service;

  /// No description provided for @event_type_concert.
  ///
  /// In rw, this message translates to:
  /// **'Ikinamico'**
  String get event_type_concert;

  /// No description provided for @event_type_protocol_service.
  ///
  /// In rw, this message translates to:
  /// **'Serivisi ya Protocol'**
  String get event_type_protocol_service;

  /// No description provided for @event_type_church_event.
  ///
  /// In rw, this message translates to:
  /// **'Igikorwa cy\'itorero'**
  String get event_type_church_event;

  /// No description provided for @event_ministry_both.
  ///
  /// In rw, this message translates to:
  /// **'Byombi'**
  String get event_ministry_both;

  /// No description provided for @event_filter_all_types.
  ///
  /// In rw, this message translates to:
  /// **'Ubwoko bwose'**
  String get event_filter_all_types;

  /// No description provided for @event_filter_ministry_all.
  ///
  /// In rw, this message translates to:
  /// **'Amatorero yose'**
  String get event_filter_ministry_all;

  /// No description provided for @event_view_month.
  ///
  /// In rw, this message translates to:
  /// **'Ukwezi'**
  String get event_view_month;

  /// No description provided for @event_view_week.
  ///
  /// In rw, this message translates to:
  /// **'Icyumweru'**
  String get event_view_week;

  /// No description provided for @event_start_label.
  ///
  /// In rw, this message translates to:
  /// **'Itangira'**
  String get event_start_label;

  /// No description provided for @event_end_label.
  ///
  /// In rw, this message translates to:
  /// **'Irangira'**
  String get event_end_label;

  /// No description provided for @event_location_label.
  ///
  /// In rw, this message translates to:
  /// **'Aho bibera'**
  String get event_location_label;

  /// No description provided for @event_description_label.
  ///
  /// In rw, this message translates to:
  /// **'Ibisobanuro'**
  String get event_description_label;

  /// No description provided for @event_recurrence_label.
  ///
  /// In rw, this message translates to:
  /// **'Gusubiramo'**
  String get event_recurrence_label;

  /// No description provided for @event_conflict_error.
  ///
  /// In rw, this message translates to:
  /// **'Amasaha ntahura'**
  String get event_conflict_error;

  /// No description provided for @event_created_success.
  ///
  /// In rw, this message translates to:
  /// **'Igikorwa cyaremwe'**
  String get event_created_success;

  /// No description provided for @event_assigned_members_title.
  ///
  /// In rw, this message translates to:
  /// **'Abashyizwe ku gikorwa'**
  String get event_assigned_members_title;

  /// No description provided for @event_attendance_title.
  ///
  /// In rw, this message translates to:
  /// **'Uko witabiriye'**
  String get event_attendance_title;

  /// No description provided for @dashboard_section_overview.
  ///
  /// In rw, this message translates to:
  /// **'Incamake'**
  String get dashboard_section_overview;

  /// No description provided for @dashboard_kpi_upcoming_events.
  ///
  /// In rw, this message translates to:
  /// **'Ibikorwa biri imbere'**
  String get dashboard_kpi_upcoming_events;

  /// No description provided for @dashboard_kpi_upcoming_assignments.
  ///
  /// In rw, this message translates to:
  /// **'Imirimo iri imbere'**
  String get dashboard_kpi_upcoming_assignments;

  /// No description provided for @dashboard_kpi_pending_swaps.
  ///
  /// In rw, this message translates to:
  /// **'Gusimburana bitegereje'**
  String get dashboard_kpi_pending_swaps;

  /// No description provided for @dashboard_kpi_pending_replacements.
  ///
  /// In rw, this message translates to:
  /// **'Gusimbura bitegereje'**
  String get dashboard_kpi_pending_replacements;

  /// No description provided for @dashboard_kpi_attendance_rate.
  ///
  /// In rw, this message translates to:
  /// **'Igipimo cy\'uko witabiriye'**
  String get dashboard_kpi_attendance_rate;

  /// No description provided for @dashboard_kpi_active_discipline.
  ///
  /// In rw, this message translates to:
  /// **'Imyitwarire ikomeje'**
  String get dashboard_kpi_active_discipline;

  /// No description provided for @dashboard_kpi_sync_conflicts.
  ///
  /// In rw, this message translates to:
  /// **'Amakimbirane yo guhuza'**
  String get dashboard_kpi_sync_conflicts;

  /// No description provided for @dashboard_kpi_finance_balance.
  ///
  /// In rw, this message translates to:
  /// **'Imari isigaye'**
  String get dashboard_kpi_finance_balance;

  /// No description provided for @sync_conflicts_title.
  ///
  /// In rw, this message translates to:
  /// **'Amakimbirane yo guhuza'**
  String get sync_conflicts_title;

  /// No description provided for @sync_last_sync.
  ///
  /// In rw, this message translates to:
  /// **'Guhuza bwa nyuma'**
  String get sync_last_sync;

  /// No description provided for @sync_failed_count.
  ///
  /// In rw, this message translates to:
  /// **'Byanze: {count}'**
  String sync_failed_count(int count);

  /// No description provided for @sync_retry_action.
  ///
  /// In rw, this message translates to:
  /// **'Ongera ugerageze'**
  String get sync_retry_action;

  /// No description provided for @sync_conflict_reason.
  ///
  /// In rw, this message translates to:
  /// **'Impamvu'**
  String get sync_conflict_reason;

  /// No description provided for @attendance_bulk_title.
  ///
  /// In rw, this message translates to:
  /// **'Andika uko witabiriye benshi'**
  String get attendance_bulk_title;

  /// No description provided for @attendance_bulk_save.
  ///
  /// In rw, this message translates to:
  /// **'Bika bose'**
  String get attendance_bulk_save;

  /// No description provided for @assignment_validate_action.
  ///
  /// In rw, this message translates to:
  /// **'Genzura mbere'**
  String get assignment_validate_action;

  /// No description provided for @assignment_conflict_warning.
  ///
  /// In rw, this message translates to:
  /// **'Hari guhura kw\'amasaha'**
  String get assignment_conflict_warning;

  /// No description provided for @assignment_quota_warning.
  ///
  /// In rw, this message translates to:
  /// **'Umubare warengeje'**
  String get assignment_quota_warning;

  /// No description provided for @member_availability_title.
  ///
  /// In rw, this message translates to:
  /// **'Kuboneka kw\'umunyamuryango'**
  String get member_availability_title;

  /// No description provided for @member_unavailable_dates_label.
  ///
  /// In rw, this message translates to:
  /// **'Iminsi adaboneka'**
  String get member_unavailable_dates_label;

  /// No description provided for @common_create.
  ///
  /// In rw, this message translates to:
  /// **'Kurema'**
  String get common_create;

  /// No description provided for @common_retry.
  ///
  /// In rw, this message translates to:
  /// **'Ongera ugerageze'**
  String get common_retry;

  /// No description provided for @nav_coverage.
  ///
  /// In rw, this message translates to:
  /// **'Coverage'**
  String get nav_coverage;

  /// No description provided for @attendance_governance_title.
  ///
  /// In rw, this message translates to:
  /// **'Gukurikirana attendance'**
  String get attendance_governance_title;

  /// No description provided for @attendance_mark_all_present.
  ///
  /// In rw, this message translates to:
  /// **'Bose bashyireho ko baje'**
  String get attendance_mark_all_present;

  /// No description provided for @attendance_excuse_review_title.
  ///
  /// In rw, this message translates to:
  /// **'Gusuzuma excuses'**
  String get attendance_excuse_review_title;

  /// No description provided for @attendance_excuse_no_reason.
  ///
  /// In rw, this message translates to:
  /// **'Nta mpamvu yatanzwe'**
  String get attendance_excuse_no_reason;

  /// No description provided for @attendance_select_event_hint.
  ///
  /// In rw, this message translates to:
  /// **'Hitamo igikorwa kugira ngo urutonde rupakire'**
  String get attendance_select_event_hint;

  /// No description provided for @attendance_roster_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta munyamuryango ufite inshingano'**
  String get attendance_roster_empty;

  /// No description provided for @attendance_reliability_title.
  ///
  /// In rw, this message translates to:
  /// **'Ubwitange'**
  String get attendance_reliability_title;

  /// No description provided for @attendance_reliability_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'{percentage}% · {band}'**
  String attendance_reliability_subtitle(Object band, Object percentage);

  /// No description provided for @attendance_excuse_request_title.
  ///
  /// In rw, this message translates to:
  /// **'Saba absence yemewe'**
  String get attendance_excuse_request_title;

  /// No description provided for @attendance_excuse_request_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza excuse ku murimo uri imbere.'**
  String get attendance_excuse_request_subtitle;

  /// No description provided for @attendance_excuse_reason_label.
  ///
  /// In rw, this message translates to:
  /// **'Impamvu'**
  String get attendance_excuse_reason_label;

  /// No description provided for @attendance_excuse_submit_action.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza excuse'**
  String get attendance_excuse_submit_action;

  /// No description provided for @attendance_excuse_submitted.
  ///
  /// In rw, this message translates to:
  /// **'Excuse yoherejwe kuri {eventName}'**
  String attendance_excuse_submitted(Object eventName);

  /// No description provided for @attendance_recent_title.
  ///
  /// In rw, this message translates to:
  /// **'Attendance ya vuba'**
  String get attendance_recent_title;

  /// No description provided for @attendance_recent_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta mateka'**
  String get attendance_recent_empty;

  /// No description provided for @attendance_status_attended.
  ///
  /// In rw, this message translates to:
  /// **'Yitabiriye'**
  String get attendance_status_attended;

  /// No description provided for @attendance_status_replacement.
  ///
  /// In rw, this message translates to:
  /// **'Yakuyemo undi'**
  String get attendance_status_replacement;

  /// No description provided for @attendance_status_voluntary.
  ///
  /// In rw, this message translates to:
  /// **'Serivisi y\'ubushake'**
  String get attendance_status_voluntary;

  /// No description provided for @attendance_excuse_illness.
  ///
  /// In rw, this message translates to:
  /// **'Indwara'**
  String get attendance_excuse_illness;

  /// No description provided for @attendance_excuse_travel.
  ///
  /// In rw, this message translates to:
  /// **'Urugendo'**
  String get attendance_excuse_travel;

  /// No description provided for @attendance_excuse_work_school.
  ///
  /// In rw, this message translates to:
  /// **'Akazi cyangwa ishuri'**
  String get attendance_excuse_work_school;

  /// No description provided for @attendance_excuse_emergency.
  ///
  /// In rw, this message translates to:
  /// **'Ubwoba'**
  String get attendance_excuse_emergency;

  /// No description provided for @attendance_excuse_family.
  ///
  /// In rw, this message translates to:
  /// **'Umuryango'**
  String get attendance_excuse_family;

  /// No description provided for @attendance_excuse_approved_leave.
  ///
  /// In rw, this message translates to:
  /// **'Uruhushya rwemewe'**
  String get attendance_excuse_approved_leave;

  /// No description provided for @attendance_excuse_conflict.
  ///
  /// In rw, this message translates to:
  /// **'Impaka itiruka'**
  String get attendance_excuse_conflict;

  /// No description provided for @attendance_excuse_unknown.
  ///
  /// In rw, this message translates to:
  /// **'Ntibizwi'**
  String get attendance_excuse_unknown;

  /// No description provided for @coverage_analytics_title.
  ///
  /// In rw, this message translates to:
  /// **'Analytics za coverage'**
  String get coverage_analytics_title;

  /// No description provided for @coverage_analytics_swaps.
  ///
  /// In rw, this message translates to:
  /// **'Swaps'**
  String get coverage_analytics_swaps;

  /// No description provided for @coverage_analytics_replacements.
  ///
  /// In rw, this message translates to:
  /// **'Replacements'**
  String get coverage_analytics_replacements;

  /// No description provided for @coverage_analytics_voluntary.
  ///
  /// In rw, this message translates to:
  /// **'Serivisi y\'ubushake'**
  String get coverage_analytics_voluntary;

  /// No description provided for @coverage_analytics_unresolved.
  ///
  /// In rw, this message translates to:
  /// **'Swaps zitarakemuka'**
  String get coverage_analytics_unresolved;

  /// No description provided for @coverage_readiness_title.
  ///
  /// In rw, this message translates to:
  /// **'Readiness'**
  String get coverage_readiness_title;

  /// No description provided for @coverage_readiness_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta burira'**
  String get coverage_readiness_empty;

  /// No description provided for @coverage_team_head_title.
  ///
  /// In rw, this message translates to:
  /// **'Team head'**
  String get coverage_team_head_title;

  /// No description provided for @coverage_team_head_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta ikibazo cya coverage'**
  String get coverage_team_head_empty;

  /// No description provided for @coverage_coordinator_title.
  ///
  /// In rw, this message translates to:
  /// **'Coordinator'**
  String get coverage_coordinator_title;

  /// No description provided for @coverage_coordinator_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta case y\'escalade'**
  String get coverage_coordinator_empty;

  /// No description provided for @coverage_escalated_title.
  ///
  /// In rw, this message translates to:
  /// **'Escalade'**
  String get coverage_escalated_title;

  /// No description provided for @coverage_open_swaps.
  ///
  /// In rw, this message translates to:
  /// **'Gucunga swaps'**
  String get coverage_open_swaps;

  /// No description provided for @coverage_open_replacements.
  ///
  /// In rw, this message translates to:
  /// **'Gucunga replacements'**
  String get coverage_open_replacements;

  /// No description provided for @coverage_swaps_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta swap'**
  String get coverage_swaps_empty;

  /// No description provided for @coverage_readiness_ready.
  ///
  /// In rw, this message translates to:
  /// **'Byiteguye'**
  String get coverage_readiness_ready;

  /// No description provided for @coverage_readiness_replacement_pending.
  ///
  /// In rw, this message translates to:
  /// **'Replacement itegekereje'**
  String get coverage_readiness_replacement_pending;

  /// No description provided for @coverage_readiness_attendance_risk.
  ///
  /// In rw, this message translates to:
  /// **'Risk ya attendance'**
  String get coverage_readiness_attendance_risk;

  /// No description provided for @coverage_readiness_staffing_shortage.
  ///
  /// In rw, this message translates to:
  /// **'Abantu bake'**
  String get coverage_readiness_staffing_shortage;

  /// No description provided for @coverage_readiness_operational_danger.
  ///
  /// In rw, this message translates to:
  /// **'Danger'**
  String get coverage_readiness_operational_danger;

  /// No description provided for @attendance_tab_marking.
  ///
  /// In rw, this message translates to:
  /// **'Gushyira ikimenyetso'**
  String get attendance_tab_marking;

  /// No description provided for @attendance_tab_choir.
  ///
  /// In rw, this message translates to:
  /// **'Choir'**
  String get attendance_tab_choir;

  /// No description provided for @attendance_tab_oversight.
  ///
  /// In rw, this message translates to:
  /// **'Kugenzura'**
  String get attendance_tab_oversight;

  /// No description provided for @attendance_choir_title.
  ///
  /// In rw, this message translates to:
  /// **'Attendance ya choir'**
  String get attendance_choir_title;

  /// No description provided for @attendance_choir_marked.
  ///
  /// In rw, this message translates to:
  /// **'Byashyizweho'**
  String get attendance_choir_marked;

  /// No description provided for @attendance_choir_excused.
  ///
  /// In rw, this message translates to:
  /// **'Byirengagijwe'**
  String get attendance_choir_excused;

  /// No description provided for @attendance_choir_unexcused.
  ///
  /// In rw, this message translates to:
  /// **'Nta mpamvu'**
  String get attendance_choir_unexcused;

  /// No description provided for @attendance_choir_lateness.
  ///
  /// In rw, this message translates to:
  /// **'Gutinda'**
  String get attendance_choir_lateness;

  /// No description provided for @attendance_choir_pending_review.
  ///
  /// In rw, this message translates to:
  /// **'Bitegereje isuzuma'**
  String get attendance_choir_pending_review;

  /// No description provided for @attendance_discipline_title.
  ///
  /// In rw, this message translates to:
  /// **'Ibyifuzo by\'ubunyangamugayo'**
  String get attendance_discipline_title;

  /// No description provided for @attendance_discipline_subtitle.
  ///
  /// In rw, this message translates to:
  /// **'Isuzuma rya pastoral risaba — ntabwo ari ibihano byikora.'**
  String get attendance_discipline_subtitle;

  /// No description provided for @attendance_discipline_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta byifuzo ubu.'**
  String get attendance_discipline_empty;

  /// No description provided for @attendance_discipline_create.
  ///
  /// In rw, this message translates to:
  /// **'Fungura urubanza rw\'ubunyangamugayo'**
  String get attendance_discipline_create;

  /// No description provided for @attendance_discipline_created.
  ///
  /// In rw, this message translates to:
  /// **'Urubanza rw\'ubunyangamugayo rwashyizweho.'**
  String get attendance_discipline_created;

  /// No description provided for @coverage_escalate_team_head.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza ku team head'**
  String get coverage_escalate_team_head;

  /// No description provided for @coverage_escalate_coordinator.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza ku coordinator'**
  String get coverage_escalate_coordinator;

  /// No description provided for @coverage_escalate_president.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza ku president'**
  String get coverage_escalate_president;

  /// No description provided for @phoneRequired.
  ///
  /// In rw, this message translates to:
  /// **'Nimero ya telefoni irakenewe kugira ngo ukomeze.'**
  String get phoneRequired;

  /// No description provided for @updatePhoneNow.
  ///
  /// In rw, this message translates to:
  /// **'Hindura nonaha'**
  String get updatePhoneNow;

  /// No description provided for @restrictedUntilPhoneAdded.
  ///
  /// In rw, this message translates to:
  /// **'Nimero ya telefoni irakenewe kugira ngo ukomeze imirimo y\'umurimo.'**
  String get restrictedUntilPhoneAdded;

  /// No description provided for @warningPhoneIncomplete.
  ///
  /// In rw, this message translates to:
  /// **'Uzuze nimero ya telefoni kugira ngo utazabura uburyo bwo gukoresha ibikoresho by\'umurimo.'**
  String get warningPhoneIncomplete;

  /// No description provided for @my_contributions_title.
  ///
  /// In rw, this message translates to:
  /// **'Imisanzu yanjye'**
  String get my_contributions_title;

  /// No description provided for @my_contributions_member_number.
  ///
  /// In rw, this message translates to:
  /// **'Nomero y\'umunyamuryango'**
  String get my_contributions_member_number;

  /// No description provided for @my_contributions_history_title.
  ///
  /// In rw, this message translates to:
  /// **'Amateka y\'imisanzu'**
  String get my_contributions_history_title;

  /// No description provided for @my_contributions_total.
  ///
  /// In rw, this message translates to:
  /// **'Imisanzu yose'**
  String get my_contributions_total;

  /// No description provided for @my_contributions_outstanding.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga asigaye'**
  String get my_contributions_outstanding;

  /// No description provided for @my_contributions_ack_sent.
  ///
  /// In rw, this message translates to:
  /// **'Imurakoze yoherejwe'**
  String get my_contributions_ack_sent;

  /// No description provided for @my_contributions_ack_pending.
  ///
  /// In rw, this message translates to:
  /// **'Bitegereje'**
  String get my_contributions_ack_pending;

  /// No description provided for @my_contributions_ack_failed.
  ///
  /// In rw, this message translates to:
  /// **'Byanze'**
  String get my_contributions_ack_failed;

  /// No description provided for @operational_units_title.
  ///
  /// In rw, this message translates to:
  /// **'Ibice bikora'**
  String get operational_units_title;

  /// No description provided for @operational_unit_detail_title.
  ///
  /// In rw, this message translates to:
  /// **'Igice'**
  String get operational_unit_detail_title;

  /// No description provided for @ministries_title.
  ///
  /// In rw, this message translates to:
  /// **'Ministéri'**
  String get ministries_title;

  /// No description provided for @ministry_detail_title.
  ///
  /// In rw, this message translates to:
  /// **'Ministéri'**
  String get ministry_detail_title;

  /// No description provided for @families_title.
  ///
  /// In rw, this message translates to:
  /// **'Imiryango'**
  String get families_title;

  /// No description provided for @search_group_welfare_cases.
  ///
  /// In rw, this message translates to:
  /// **'Ubusabane'**
  String get search_group_welfare_cases;

  /// No description provided for @search_group_songs.
  ///
  /// In rw, this message translates to:
  /// **'Indirimbo'**
  String get search_group_songs;

  /// No description provided for @search_group_rehearsals.
  ///
  /// In rw, this message translates to:
  /// **'Imyitozo'**
  String get search_group_rehearsals;

  /// No description provided for @welfare_title.
  ///
  /// In rw, this message translates to:
  /// **'Ubusabane'**
  String get welfare_title;

  /// No description provided for @welfare_open_cases.
  ///
  /// In rw, this message translates to:
  /// **'Ubusabane bufunguye'**
  String get welfare_open_cases;

  /// No description provided for @welfare_funds_raised.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga yegeranyijwe'**
  String get welfare_funds_raised;

  /// No description provided for @welfare_raised.
  ///
  /// In rw, this message translates to:
  /// **'Byegeranyijwe'**
  String get welfare_raised;

  /// No description provided for @welfare_remaining.
  ///
  /// In rw, this message translates to:
  /// **'Bisigaye'**
  String get welfare_remaining;

  /// No description provided for @welfare_amount.
  ///
  /// In rw, this message translates to:
  /// **'Amafaranga'**
  String get welfare_amount;

  /// No description provided for @welfare_contribute.
  ///
  /// In rw, this message translates to:
  /// **'Tanga'**
  String get welfare_contribute;

  /// No description provided for @music_title.
  ///
  /// In rw, this message translates to:
  /// **'Ububiko bw\'indirimbo'**
  String get music_title;

  /// No description provided for @music_usage_count.
  ///
  /// In rw, this message translates to:
  /// **'Ikoreshwa'**
  String get music_usage_count;

  /// No description provided for @rehearsals_title.
  ///
  /// In rw, this message translates to:
  /// **'Imyitozo'**
  String get rehearsals_title;

  /// No description provided for @rehearsals_readiness.
  ///
  /// In rw, this message translates to:
  /// **'Gutegura'**
  String get rehearsals_readiness;

  /// No description provided for @rehearsals_attendance.
  ///
  /// In rw, this message translates to:
  /// **'Kwitabira'**
  String get rehearsals_attendance;

  /// No description provided for @rehearsals_plan.
  ///
  /// In rw, this message translates to:
  /// **'Gahunda'**
  String get rehearsals_plan;

  /// No description provided for @rehearsals_reports.
  ///
  /// In rw, this message translates to:
  /// **'Raporo'**
  String get rehearsals_reports;

  /// No description provided for @rehearsals_prep_score.
  ///
  /// In rw, this message translates to:
  /// **'Gutegura gusenga'**
  String get rehearsals_prep_score;

  /// No description provided for @welfare_create_title.
  ///
  /// In rw, this message translates to:
  /// **'Fungura ubusabane'**
  String get welfare_create_title;

  /// No description provided for @welfare_field_title.
  ///
  /// In rw, this message translates to:
  /// **'Umutwe'**
  String get welfare_field_title;

  /// No description provided for @welfare_field_description.
  ///
  /// In rw, this message translates to:
  /// **'Ibisobanuro'**
  String get welfare_field_description;

  /// No description provided for @welfare_field_member_id.
  ///
  /// In rw, this message translates to:
  /// **'ID y\'umunyamuryango'**
  String get welfare_field_member_id;

  /// No description provided for @welfare_category.
  ///
  /// In rw, this message translates to:
  /// **'Icyiciro'**
  String get welfare_category;

  /// No description provided for @welfare_submit_case.
  ///
  /// In rw, this message translates to:
  /// **'Ohereza'**
  String get welfare_submit_case;

  /// No description provided for @welfare_assistance_title.
  ///
  /// In rw, this message translates to:
  /// **'Andika ubufasha'**
  String get welfare_assistance_title;

  /// No description provided for @welfare_assistance_type.
  ///
  /// In rw, this message translates to:
  /// **'Ubwoko bw\'ubufasha'**
  String get welfare_assistance_type;

  /// No description provided for @welfare_record_assistance.
  ///
  /// In rw, this message translates to:
  /// **'Andika ubufasha'**
  String get welfare_record_assistance;

  /// No description provided for @welfare_reports_title.
  ///
  /// In rw, this message translates to:
  /// **'Raporo z\'ubusabane'**
  String get welfare_reports_title;

  /// No description provided for @welfare_assistance_total.
  ///
  /// In rw, this message translates to:
  /// **'Ubufasha bwose'**
  String get welfare_assistance_total;

  /// No description provided for @welfare_tab_overview.
  ///
  /// In rw, this message translates to:
  /// **'Incamake'**
  String get welfare_tab_overview;

  /// No description provided for @welfare_timeline.
  ///
  /// In rw, this message translates to:
  /// **'Amateka'**
  String get welfare_timeline;

  /// No description provided for @welfare_timeline_empty.
  ///
  /// In rw, this message translates to:
  /// **'Nta makuru y\'amateka.'**
  String get welfare_timeline_empty;

  /// No description provided for @welfare_contributions.
  ///
  /// In rw, this message translates to:
  /// **'Imisanzu'**
  String get welfare_contributions;

  /// No description provided for @welfare_offline_banner.
  ///
  /// In rw, this message translates to:
  /// **'Amakuru abitswe. Kura hasi kugira ngo usubiremo kuri interineti.'**
  String get welfare_offline_banner;

  /// No description provided for @music_favorites.
  ///
  /// In rw, this message translates to:
  /// **'Ibikunzwe'**
  String get music_favorites;

  /// No description provided for @music_favorite.
  ///
  /// In rw, this message translates to:
  /// **'Ongeraho mu bikunzwe'**
  String get music_favorite;

  /// No description provided for @music_unfavorite.
  ///
  /// In rw, this message translates to:
  /// **'Kuraho mu bikunzwe'**
  String get music_unfavorite;

  /// No description provided for @music_recent.
  ///
  /// In rw, this message translates to:
  /// **'Byasuzumwe vuba'**
  String get music_recent;

  /// No description provided for @music_lyrics.
  ///
  /// In rw, this message translates to:
  /// **'Amagambo'**
  String get music_lyrics;

  /// No description provided for @music_assets.
  ///
  /// In rw, this message translates to:
  /// **'Dosiye'**
  String get music_assets;

  /// No description provided for @common_back.
  ///
  /// In rw, this message translates to:
  /// **'Subira inyuma'**
  String get common_back;

  /// No description provided for @common_next.
  ///
  /// In rw, this message translates to:
  /// **'Ibikurikira'**
  String get common_next;

  /// No description provided for @search_group_welfare_categories.
  ///
  /// In rw, this message translates to:
  /// **'Ibyiciro by\'ubusabane'**
  String get search_group_welfare_categories;

  /// No description provided for @search_group_choir_documents.
  ///
  /// In rw, this message translates to:
  /// **'Inyandiko z\'ikorali'**
  String get search_group_choir_documents;

  /// No description provided for @search_group_choir_meetings.
  ///
  /// In rw, this message translates to:
  /// **'Inama z\'ikorali'**
  String get search_group_choir_meetings;

  /// No description provided for @search_group_welfare_assistance.
  ///
  /// In rw, this message translates to:
  /// **'Ubufasha bw\'ubusabane'**
  String get search_group_welfare_assistance;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  return AppLocalizationsEn();
}

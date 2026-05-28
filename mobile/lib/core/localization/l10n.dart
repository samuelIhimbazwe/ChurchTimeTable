import 'package:flutter/widgets.dart';
import '../../l10n/generated/app_localizations.dart';

export 'church_localization.dart';

extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this)!;
}

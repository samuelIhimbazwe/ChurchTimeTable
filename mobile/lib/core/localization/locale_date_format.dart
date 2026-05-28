import 'package:intl/intl.dart';

class LocaleDateFormat {
  static String formatDate(DateTime date, String languageCode) {
    switch (languageCode) {
      case 'rw':
        return DateFormat('d MMMM y', 'rw').format(date);
      case 'fr':
        return DateFormat('d MMMM y', 'fr').format(date);
      default:
        return DateFormat('MMMM d, y', 'en').format(date);
    }
  }

  static String formatTime(DateTime date, String languageCode) {
    return DateFormat.Hm(languageCode).format(date);
  }

  static String formatDateTime(DateTime date, String languageCode) {
    return '${formatDate(date, languageCode)} ${formatTime(date, languageCode)}';
  }

  static String formatRelative(DateTime date, String languageCode) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (languageCode == 'rw') {
      if (diff.inDays > 0) return 'hashize iminsi ${diff.inDays}';
      if (diff.inHours > 0) return 'hashize amasaha ${diff.inHours}';
      return 'vuba aha';
    }
    if (languageCode == 'fr') {
      if (diff.inDays > 0) return 'il y a ${diff.inDays} j';
      if (diff.inHours > 0) return 'il y a ${diff.inHours} h';
      return 'à l\'instant';
    }
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    return 'just now';
  }
}

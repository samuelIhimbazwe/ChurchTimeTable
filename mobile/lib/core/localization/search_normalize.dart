/// Accent-insensitive and Kinyarwanda-friendly search normalization (offline).
class SearchNormalize {
  static String normalize(String input, {String? languageCode}) {
    var s = input.trim().toLowerCase();
    s = _stripAccents(s);
    if (languageCode == 'rw') {
      s = s
          .replaceAll('cy', 'c')
          .replaceAll('ny', 'n')
          .replaceAll('sh', 's')
          .replaceAll('ts', 't');
    }
    return s.replaceAll(RegExp(r'\s+'), ' ');
  }

  static bool matches(String haystack, String needle, {String? languageCode}) {
    if (needle.isEmpty) return true;
    return normalize(haystack, languageCode: languageCode)
        .contains(normalize(needle, languageCode: languageCode));
  }

  static String _stripAccents(String value) {
    const map = {
      'à': 'a',
      'á': 'a',
      'â': 'a',
      'ã': 'a',
      'ä': 'a',
      'å': 'a',
      'è': 'e',
      'é': 'e',
      'ê': 'e',
      'ë': 'e',
      'ì': 'i',
      'í': 'i',
      'î': 'i',
      'ï': 'i',
      'ò': 'o',
      'ó': 'o',
      'ô': 'o',
      'õ': 'o',
      'ö': 'o',
      'ù': 'u',
      'ú': 'u',
      'û': 'u',
      'ü': 'u',
      'ç': 'c',
      'œ': 'oe',
      'æ': 'ae',
    };
    final buffer = StringBuffer();
    for (final rune in value.runes) {
      final ch = String.fromCharCode(rune);
      buffer.write(map[ch] ?? ch);
    }
    return buffer.toString();
  }
}

import 'package:flutter/material.dart';
import '../tokens/typography.dart';

/// Overflow-safe text for multilingual UI — never truncates by default.
class LocalizedText extends StatelessWidget {
  const LocalizedText(
    this.data, {
    super.key,
    this.style,
    this.localeCode,
    this.semanticsLabel,
    this.maxLines,
    this.textAlign,
    this.fontWeight,
  });

  final String data;
  final TextStyle? style;
  final String? localeCode;
  final String? semanticsLabel;
  final int? maxLines;
  final TextAlign? textAlign;
  final FontWeight? fontWeight;

  @override
  Widget build(BuildContext context) {
    final locale = localeCode ?? Localizations.localeOf(context).languageCode;
    final base = style ?? Theme.of(context).textTheme.bodyMedium;
    final height = CmmsTypography.adaptiveLineHeight(locale);

    return Semantics(
      label: semanticsLabel ?? data,
      child: Text(
        data,
        style: base?.copyWith(
          height: height,
          fontWeight: fontWeight ?? base.fontWeight,
        ),
        softWrap: true,
        overflow: maxLines != null ? TextOverflow.ellipsis : null,
        maxLines: maxLines,
        textAlign: textAlign,
      ),
    );
  }
}

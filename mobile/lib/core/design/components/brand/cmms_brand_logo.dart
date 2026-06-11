import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../tokens/colors.dart';
import '../../tokens/typography.dart';

/// Web-aligned CMMS logo: gold square + navy "C".
class CmmsBrandLogo extends StatelessWidget {
  const CmmsBrandLogo({
    super.key,
    this.size = 40,
    this.showWordmark = false,
    this.subtitle,
    this.lightContext = false,
  });

  final double size;
  final bool showWordmark;
  final String? subtitle;
  /// When true (navy sidebar / login panel), wordmark uses inverse text.
  final bool lightContext;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = lightContext
        ? CmmsColors.textInverse
        : CmmsColors.textPrimary(isDark);
    final subtitleColor = lightContext
        ? CmmsColors.primary300
        : CmmsColors.textMuted(isDark);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: CmmsColors.gold500,
            borderRadius: BorderRadius.circular(size * 0.2),
          ),
          alignment: Alignment.center,
          child: Text(
            'C',
            style: GoogleFonts.cormorantGaramond(
              fontSize: size * 0.45,
              fontWeight: FontWeight.w700,
              color: CmmsColors.primary900,
              height: 1,
            ),
          ),
        ),
        if (showWordmark) ...[
          SizedBox(width: size * 0.3),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CMMS',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: size * 0.42,
                  fontWeight: FontWeight.w600,
                  color: titleColor,
                  height: 1.1,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: TextStyle(
                    fontFamily: CmmsTypography.bodyFamily,
                    fontSize: size * 0.28,
                    color: subtitleColor,
                    height: 1.2,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

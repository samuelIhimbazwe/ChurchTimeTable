import 'package:flutter/material.dart';

abstract final class CmmsRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double full = 999;

  static BorderRadius get card => BorderRadius.circular(md);
  static BorderRadius get button => BorderRadius.circular(md);
  static BorderRadius get chip => BorderRadius.circular(full);
  static BorderRadius get dialog => BorderRadius.circular(lg);
}

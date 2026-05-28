import 'package:flutter/material.dart';

/// Light ministry accent usage — chips, icons, indicators only.
enum CmmsMinistry {
  choir,
  protocol,
  finance,
  discipline,
  events,
  general,
}

abstract final class MinistryAccents {
  static const Color choir = Color(0xFFD4A017);
  static const Color protocol = Color(0xFF1E3A8A);
  static const Color finance = Color(0xFF059669);
  static const Color discipline = Color(0xFFDC2626);
  static const Color events = Color(0xFF7C3AED);
  static const Color general = Color(0xFF64748B);

  static Color colorFor(CmmsMinistry ministry) {
    switch (ministry) {
      case CmmsMinistry.choir:
        return choir;
      case CmmsMinistry.protocol:
        return protocol;
      case CmmsMinistry.finance:
        return finance;
      case CmmsMinistry.discipline:
        return discipline;
      case CmmsMinistry.events:
        return events;
      case CmmsMinistry.general:
        return general;
    }
  }

  static CmmsMinistry fromApi(String? value) {
    switch (value?.toUpperCase()) {
      case 'CHOIR':
        return CmmsMinistry.choir;
      case 'PROTOCOL':
        return CmmsMinistry.protocol;
      case 'FINANCE':
        return CmmsMinistry.finance;
      case 'DISCIPLINE':
        return CmmsMinistry.discipline;
      case 'EVENT':
      case 'EVENTS':
        return CmmsMinistry.events;
      default:
        return CmmsMinistry.general;
    }
  }

  static IconData iconFor(CmmsMinistry ministry) {
    switch (ministry) {
      case CmmsMinistry.choir:
        return Icons.music_note;
      case CmmsMinistry.protocol:
        return Icons.people;
      case CmmsMinistry.finance:
        return Icons.account_balance_wallet;
      case CmmsMinistry.discipline:
        return Icons.gavel;
      case CmmsMinistry.events:
        return Icons.event;
      case CmmsMinistry.general:
        return Icons.church;
    }
  }
}

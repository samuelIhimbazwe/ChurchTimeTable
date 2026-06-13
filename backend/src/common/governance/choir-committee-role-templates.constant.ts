import { PERMISSIONS } from '../constants/roles';

/** SAP GRC-style shared choir committee role templates (seeded globally). */
export const DEFAULT_CHOIR_COMMITTEE_ROLE_TEMPLATES = [
  {
    name: 'development_advisor',
    label: 'Development advisor',
    description: 'Reports, analytics, and growth planning read access.',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.CHOIR_OPS_REPORT,
      PERMISSIONS.CHOIR_OPS_VIEW,
    ],
  },
  {
    name: 'operations_advisor',
    label: 'Operations advisor',
    description: 'Scheduling, activities, and operational oversight.',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
      PERMISSIONS.CHOIR_OPS_VIEW,
      PERMISSIONS.CHOIR_OPS_SCHEDULE,
      PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,
    ],
  },
  {
    name: 'finance_read_advisor',
    label: 'Finance read advisor',
    description: 'Read-only stewardship and budget visibility (typical 7-day elevation).',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.MINISTRY_FINANCE_VIEW,
    ],
  },
  {
    name: 'spiritual_advisor',
    label: 'Spiritual life advisor',
    description: 'Devotions, care visibility, and spiritual coordination.',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
    ],
  },
  {
    name: 'counsel_advisor',
    label: 'Counsel advisor',
    description: 'Minimal portal and event read for advisory counsel seats.',
    permissions: [PERMISSIONS.EVENT_READ, PERMISSIONS.MEMBER_PORTAL_VIEW],
  },
] as const;

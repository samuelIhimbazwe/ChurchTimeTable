import { ResponseVisibilityService } from './response-visibility.service';
import { PERMISSIONS } from '../constants/roles';

describe('ResponseVisibilityService', () => {
  const service = new ResponseVisibilityService();

  const choirSecretaryPerms = [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_WRITE,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.SWAP_MANAGE,
    PERMISSIONS.DISCIPLINE_READ_ALL,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.MEMBER_READ,
  ];

  it('removes finance blocks for leaders without finance permissions', () => {
    const filtered = service.filterLeaderSummary(
      {
        financeSummary: { income: 1, expense: 0, balance: 1, count: 0 },
        intelligence: {
          financeAnalytics: { balance: 1 },
          ministryKpis: [],
        },
        widgets: [{ id: 'financeSnapshot' }, { id: 'kpiOverview' }],
        alerts: [],
      },
      choirSecretaryPerms,
    );

    expect(filtered.financeSummary).toBeUndefined();
    expect(
      (filtered.intelligence as Record<string, unknown>).financeAnalytics,
    ).toBeUndefined();
    expect(filtered.widgets).toEqual([{ id: 'kpiOverview' }]);
  });

  it('removes discipline analytics without discipline permissions', () => {
    const treasurerPerms = [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
    ];

    const filtered = service.filterLeaderSummary(
      {
        activeDiscipline: 3,
        intelligence: {
          disciplineAnalytics: { openCases: 3 },
        },
        widgets: [{ id: 'disciplinePanel' }],
        alerts: [],
      },
      treasurerPerms,
    );

    expect(filtered.activeDiscipline).toBeUndefined();
    expect(
      (filtered.intelligence as Record<string, unknown>).disciplineAnalytics,
    ).toBeUndefined();
    expect(filtered.widgets).toEqual([]);
  });

  it('filters finance compliance alerts without finance permission', () => {
    const filtered = service.filterAlerts(
      [
        {
          id: 'finance-compliance',
          type: 'finance_compliance',
          severity: 'info',
          title: 'Contribution follow-up',
          message: 'Unpaid dues',
        },
        {
          id: 'pending-swaps',
          type: 'unresolved_replacement',
          severity: 'warning',
          title: 'Pending swaps',
          message: 'Swaps pending',
        },
      ],
      choirSecretaryPerms,
    );

    expect(filtered.some((a) => a.type === 'finance_compliance')).toBe(false);
    expect(filtered.some((a) => a.type === 'unresolved_replacement')).toBe(true);
  });
});

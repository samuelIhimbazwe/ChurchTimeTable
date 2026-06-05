import { ContributionStatus } from '@prisma/client';
import { ParticipationOperationalStatus } from '../common/participation/participation.constants';
import {
  computeContributionScore,
  computeHealthScore,
  computeParticipationScore,
  FamilyMetricsService,
  mapHealthGrade,
} from './family-metrics.service';

describe('FamilyMetricsService helpers', () => {
  it('maps health grades', () => {
    expect(mapHealthGrade(95)).toBe('A');
    expect(mapHealthGrade(85)).toBe('B');
    expect(mapHealthGrade(75)).toBe('C');
    expect(mapHealthGrade(65)).toBe('D');
    expect(mapHealthGrade(40)).toBe('F');
  });

  it('computes contribution score from confirmed and pending totals', () => {
    expect(computeContributionScore(800, 200)).toBe(80);
    expect(computeContributionScore(0, 0)).toBe(100);
  });

  it('computes participation score from active members', () => {
    expect(computeParticipationScore(4, 3)).toBe(75);
    expect(computeParticipationScore(0, 0)).toBe(0);
  });

  it('computes weighted health score and grade', () => {
    const health = computeHealthScore(90, 80, 70);
    expect(health.score).toBe(81);
    expect(health.grade).toBe('B');
  });

  it('reweights health score when contribution data is hidden', () => {
    const health = computeHealthScore(80, null, 60);
    expect(health.score).toBe(71);
    expect(health.grade).toBe('C');
  });
});

describe('FamilyMetricsService', () => {
  const prisma = {
    member: { findMany: jest.fn() },
    contributionRecord: { findMany: jest.fn() },
    memberDues: { findMany: jest.fn() },
    financeTransaction: { findMany: jest.fn() },
    operationAssignment: { findMany: jest.fn() },
    choirCommitteeMember: { findMany: jest.fn() },
    protocolCommitteeMember: { findMany: jest.fn() },
    protocolServiceTeamMember: { findMany: jest.fn() },
    protocolServiceTeam: { findMany: jest.fn() },
    family: { findMany: jest.fn(), findUnique: jest.fn() },
  };
  const familiesService = {
    resolveScope: jest.fn(),
    ensureViewAccess: jest.fn(),
    ensureFamilyInScope: jest.fn(),
    buildScopeWhere: jest.fn(),
  };
  const participationScoring = {
    scoreRecords: jest.fn().mockReturnValue({ percentage: 85 }),
  };
  const participationRecords = {
    fetchRecords: jest.fn().mockResolvedValue([
      {
        memberId: 'member-1',
        operationalStatus: 'ATTENDED' as ParticipationOperationalStatus,
        voluntaryExtra: false,
        recordedAt: new Date(),
      },
      {
        memberId: 'member-1',
        operationalStatus: 'UNEXCUSED_ABSENCE' as ParticipationOperationalStatus,
        voluntaryExtra: false,
        recordedAt: new Date(),
      },
    ]),
  };
  const visibility = {
    filterFamilyMetrics: jest.fn((payload) => payload),
  };

  const service = new FamilyMetricsService(
    prisma as never,
    familiesService as never,
    participationScoring as never,
    participationRecords as never,
    visibility as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.member.findMany.mockResolvedValue([{ id: 'member-1' }]);
    prisma.operationAssignment.findMany.mockResolvedValue([{ memberId: 'member-1' }]);
    prisma.contributionRecord.findMany.mockResolvedValue([
      {
        memberId: 'member-1',
        amount: 1000,
        status: ContributionStatus.CONFIRMED,
      },
      {
        memberId: 'member-1',
        amount: 500,
        status: ContributionStatus.PENDING,
      },
    ]);
    prisma.memberDues.findMany.mockResolvedValue([]);
    prisma.financeTransaction.findMany.mockResolvedValue([]);
    prisma.choirCommitteeMember.findMany.mockResolvedValue([]);
    prisma.protocolCommitteeMember.findMany.mockResolvedValue([]);
    prisma.protocolServiceTeamMember.findMany.mockResolvedValue([]);
    prisma.protocolServiceTeam.findMany.mockResolvedValue([]);
  });

  it('aggregates attendance, contributions, and participation for a family', async () => {
    const payload = service.computeMetricsForMembers(
      { id: 'family-1', familyCode: 'FAM000001', familyName: 'Test Family' },
      ['member-1'],
      {
        memberIds: ['member-1'],
        activeMemberIds: new Set(['member-1']),
        attendanceRecords: [
          {
            memberId: 'member-1',
            operationalStatus: 'ATTENDED' as ParticipationOperationalStatus,
            voluntaryExtra: false,
          },
          {
            memberId: 'member-1',
            operationalStatus: 'UNEXCUSED_ABSENCE' as ParticipationOperationalStatus,
            voluntaryExtra: false,
          },
        ],
        contributions: [
          {
            memberId: 'member-1',
            amount: 1000 as never,
            status: ContributionStatus.CONFIRMED,
          },
          {
            memberId: 'member-1',
            amount: 500 as never,
            status: ContributionStatus.PENDING,
          },
        ],
        dues: [],
        financeTransactions: [],
        assignments: [{ memberId: 'member-1' }],
        choirCommittee: [],
        protocolCommittee: [],
        protocolTeams: [],
        protocolTeamHeads: [],
      },
      true,
    );

    expect(payload.attendance.attendanceCount).toBe(1);
    expect(payload.attendance.missedCount).toBe(1);
    expect(payload.contributions?.confirmedAmount).toBe(1000);
    expect(payload.contributions?.pendingAmount).toBe(500);
    expect(payload.contributions?.contributionCount).toBe(2);
    expect(payload.participation.activeAssignments).toBe(1);
    expect(payload.participation.activeMembers).toBe(1);
    expect(payload.health.grade).toMatch(/^[A-F]$/);
  });
});

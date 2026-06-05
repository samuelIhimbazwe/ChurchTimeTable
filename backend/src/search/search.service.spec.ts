import { MinistryScope } from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { SearchService } from './search.service';

function mockScope(overrides: Record<string, unknown> = {}) {
  return {
    actorUserId: 'user-1',
    memberId: 'member-1',
    permissions: [PERMISSIONS.MEMBER_READ, PERMISSIONS.EVENT_READ],
    ministryIds: [MinistryScope.CHOIR],
    protocolMinistryIds: [],
    choirScopeIds: [],
    teamIds: [],
    scopedMemberIds: [],
    canProtocolOversight: false,
    canProtocolCoordinate: false,
    canProtocolTeamHead: false,
    canChoirOperations: true,
    ...overrides,
  };
}

describe('SearchService', () => {
  const prisma = {
    member: { findMany: jest.fn() },
    family: { findMany: jest.fn() },
    operationOccurrence: { findMany: jest.fn() },
    operationAssignment: { findMany: jest.fn() },
    contributionRecord: { findMany: jest.fn() },
  };
  const operationalScope = {
    buildForUser: jest.fn().mockResolvedValue(mockScope()),
  };
  const familiesService = {
    ensureViewAccess: jest.fn(),
    buildScopeWhere: jest.fn().mockReturnValue({}),
  };
  const visibility = {
    filterSearchResponse: jest.fn((payload) => payload),
  };
  const ministryAccess = {
    ministryIdsVisibleTo: jest.fn().mockResolvedValue(null),
  };
  const assetAccess = {
    visibleAssetWhere: jest.fn().mockResolvedValue({}),
  };

  const service = new SearchService(
    prisma as never,
    operationalScope as never,
    familiesService as never,
    visibility as never,
    ministryAccess as never,
    assetAccess as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    operationalScope.buildForUser.mockResolvedValue(mockScope());
    prisma.member.findMany.mockResolvedValue([
      {
        id: 'member-1',
        memberNumber: 'CMMS000001',
        firstName: 'Alice',
        lastName: 'Mukamana',
      },
    ]);
    prisma.family.findMany.mockResolvedValue([]);
    prisma.operationOccurrence.findMany.mockResolvedValue([
      { id: 'event-1', title: 'Sunday Choir Service' },
    ]);
    prisma.operationAssignment.findMany.mockResolvedValue([]);
    prisma.contributionRecord.findMany.mockResolvedValue([]);
  });

  it('matches members by name and member number', async () => {
    const result = await service.search('user-1', 'Alice');

    expect(prisma.member.findMany).toHaveBeenCalled();
    expect(result.members).toEqual([
      {
        type: 'member',
        id: 'member-1',
        memberNumber: 'CMMS000001',
        displayName: 'Alice Mukamana',
      },
    ]);
  });

  it('matches events by title for scoped leaders', async () => {
    const result = await service.search('user-1', 'Choir');

    expect(result.events).toEqual([
      { type: 'event', id: 'event-1', title: 'Sunday Choir Service' },
    ]);
  });

  it('filters finance results without finance visibility', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockScope({
        permissions: [PERMISSIONS.MEMBER_READ, PERMISSIONS.EVENT_READ],
      }),
    );

    await service.search('user-1', 'CNT');

    expect(prisma.contributionRecord.findMany).not.toHaveBeenCalled();
  });

  it('scopes member search to team members for protocol team heads', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockScope({
        permissions: [PERMISSIONS.MEMBER_READ, PERMISSIONS.PROTOCOL_TEAM_HEAD],
        scopedMemberIds: ['member-9'],
        canProtocolTeamHead: true,
        canChoirOperations: false,
        ministryIds: [MinistryScope.PROTOCOL],
      }),
    );

    await service.search('user-1', 'Jean');

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              id: { in: ['member-9'] },
            }),
          ]),
        }),
      }),
    );
  });

  it('searches families only when family permission is granted', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockScope({
        permissions: [
          PERMISSIONS.MEMBER_READ,
          PERMISSIONS.FAMILY_VIEW,
        ],
      }),
    );
    prisma.family.findMany.mockResolvedValueOnce([
      {
        id: 'family-1',
        familyCode: 'FAM000001',
        familyName: 'Nkurunziza',
      },
    ]);

    const result = await service.search('user-1', 'Nkur');

    expect(familiesService.ensureViewAccess).toHaveBeenCalled();
    expect(result.families).toEqual([
      {
        type: 'family',
        id: 'family-1',
        familyCode: 'FAM000001',
        familyName: 'Nkurunziza',
      },
    ]);
  });

  it('limits suggestions to ten total results', async () => {
    prisma.member.findMany.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => ({
        id: `member-${index}`,
        memberNumber: null,
        firstName: 'Test',
        lastName: `Member ${index}`,
      })),
    );
    prisma.operationOccurrence.findMany.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => ({
        id: `event-${index}`,
        title: `Event ${index}`,
      })),
    );

    const result = await service.suggestions('user-1', 'Member');

    expect(result.members.length + result.events.length).toBeLessThanOrEqual(10);
  });
});

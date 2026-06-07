import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsResolver } from './permissions.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS } from '../common/constants/roles';

describe('PermissionsResolver', () => {
  let resolver: PermissionsResolver;
  let prisma: {
    user: { findUnique: jest.Mock };
    protocolTeamLeader: { findFirst: jest.Mock };
    choirCommitteeMember: { findMany: jest.Mock };
    protocolCommitteeMember: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      protocolTeamLeader: { findFirst: jest.fn().mockResolvedValue(null) },
      choirCommitteeMember: { findMany: jest.fn().mockResolvedValue([]) },
      protocolCommitteeMember: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsResolver,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    resolver = module.get(PermissionsResolver);
  });

  it('rebuilds permissions from role grants in the database', async () => {
    prisma.user.findUnique.mockResolvedValue({
      isActive: true,
      member: null,
      userRoles: [
        {
          role: {
            name: 'CHOIR_TREASURER',
            rolePermissions: [
              { permission: { code: PERMISSIONS.CHOIR_FINANCE_VIEW } },
              { permission: { code: PERMISSIONS.CHOIR_FINANCE_MANAGE } },
            ],
          },
        },
      ],
    });

    const resolved = await resolver.resolveForUser('user-1');

    expect(resolved.roles).toEqual(['CHOIR_TREASURER']);
    expect(resolved.permissions).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CHOIR_FINANCE_VIEW,
        PERMISSIONS.CHOIR_FINANCE_MANAGE,
      ]),
    );
    expect(resolved.permissions).not.toContain(PERMISSIONS.FINANCE_READ);
    expect(resolved.permissions).not.toContain(PERMISSIONS.FINANCE_WRITE);
  });

  it('merges committee-scoped claims for members', async () => {
    prisma.user.findUnique.mockResolvedValue({
      isActive: true,
      member: { id: 'member-1' },
      userRoles: [
        {
          role: {
            name: 'MEMBER',
            rolePermissions: [{ permission: { code: PERMISSIONS.EVENT_READ } }],
          },
        },
      ],
    });
    prisma.choirCommitteeMember.findMany.mockResolvedValue([
      {
        choirId: 'choir-1',
        role: { permissionsJson: [PERMISSIONS.CHOIR_FINANCE_VIEW] },
      },
    ]);

    const resolved = await resolver.resolveForUser('user-2');

    expect(resolved.permissions).toContain(PERMISSIONS.CHOIR_FINANCE_VIEW);
    expect(resolved.permissions).toContain(
      `committee:choir:choir-1:${PERMISSIONS.CHOIR_FINANCE_VIEW}`,
    );
  });
});

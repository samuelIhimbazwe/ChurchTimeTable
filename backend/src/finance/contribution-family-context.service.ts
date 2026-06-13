import { Injectable, NotFoundException } from '@nestjs/common';
import { FamilyMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';

const LEADERSHIP_ROLES: FamilyMemberRole[] = [
  FamilyMemberRole.HEAD,
  FamilyMemberRole.ASSISTANT_HEAD,
  FamilyMemberRole.SECRETARY,
];

@Injectable()
export class ContributionFamilyContextService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
  ) {}

  async getLeadershipContext(actorUserId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertNotChurchAdminAccountOnly(ctx);

    const leadership = ctx.familyMemberships.filter((m) =>
      LEADERSHIP_ROLES.includes(m.role),
    );

    if (!leadership.length && !this.scope.canViewAll(ctx)) {
      throw new NotFoundException('Not found');
    }

    const familyIds = leadership.map((m) => m.familyId);
    const families = familyIds.length
      ? await this.prisma.family.findMany({
          where: { id: { in: familyIds } },
          select: {
            id: true,
            familyCode: true,
            familyName: true,
            delegationEnabled: true,
            members: {
              where: { role: FamilyMemberRole.HEAD },
              take: 1,
              select: {
                member: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        })
      : [];

    const familyMeta = new Map(families.map((f) => [f.id, f]));

    return {
      families: leadership.map((m) => {
        const meta = familyMeta.get(m.familyId);
        const head = meta?.members[0]?.member;
        const headName = head
          ? `${head.firstName} ${head.lastName}`.trim()
          : null;
        return {
          familyId: m.familyId,
          familyCode: meta?.familyCode ?? null,
          familyName: meta?.familyName ?? 'Family',
          headName,
          role: m.role,
          delegationEnabled: meta?.delegationEnabled ?? m.delegationEnabled,
          canApprove: this.scope.canApproveFamily(ctx, m.familyId),
          canViewInbox: this.scope.canAccessFamilyInbox(ctx, m.familyId),
          isViewOnly:
            m.role === FamilyMemberRole.SECRETARY ||
            (m.role === FamilyMemberRole.ASSISTANT_HEAD &&
              !(meta?.delegationEnabled ?? m.delegationEnabled)),
        };
      }),
      requiresFamilyPicker:
        leadership.length > 1 || this.scope.canViewAll(ctx),
      canViewAllFamilies: this.scope.canViewAll(ctx),
    };
  }
}

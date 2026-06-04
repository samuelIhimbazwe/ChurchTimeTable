import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { FamilyMemberRole } from '@prisma/client';

import { PermissionsResolver } from '../auth/permissions.resolver';

import { PERMISSIONS } from '../common/constants/roles';

import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

import { PrismaService } from '../prisma/prisma.service';

import { ContributionScopeService } from '../finance/contribution-scope.service';



const LEADERSHIP_ROLES: FamilyMemberRole[] = [

  FamilyMemberRole.HEAD,

  FamilyMemberRole.ASSISTANT_HEAD,

  FamilyMemberRole.SECRETARY,

];



@Injectable()

export class MemberProfileAccessService {

  constructor(

    private prisma: PrismaService,

    private permissions: PermissionsResolver,

    private contributionScope: ContributionScopeService,

  ) {}



  async assertCanViewMemberProfile(actorUserId: string, targetMemberId: string) {

    const member = await this.prisma.member.findUnique({

      where: { id: targetMemberId },

      include: {

        user: { select: { id: true, email: true } },

        familyMembership: { include: { family: true } },

      },

    });

    if (!member) throw new NotFoundException('Member not found');



    const resolved = await this.permissions.resolveForUser(actorUserId);

    if (resolved.memberId === targetMemberId) {

      return {

        member,

        permissions: resolved.permissions,

        isSelf: true,

        actorMemberId: resolved.memberId,

      };

    }



    if (

      hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_MANAGE) ||

      hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_READ)

    ) {

      return {

        member,

        permissions: resolved.permissions,

        isSelf: false,

        actorMemberId: resolved.memberId,

      };

    }



    const ctx = await this.contributionScope.resolveActor(actorUserId);

    if (this.contributionScope.canViewAll(ctx)) {

      return {

        member,

        permissions: resolved.permissions,

        isSelf: false,

        actorMemberId: resolved.memberId,

      };

    }



    if (member.familyMembership && resolved.memberId) {

      const actorMembership = await this.prisma.familyMember.findUnique({

        where: { memberId: resolved.memberId },

      });

      if (

        actorMembership?.familyId === member.familyMembership.familyId &&

        LEADERSHIP_ROLES.includes(actorMembership.role)

      ) {

        return {

          member,

          permissions: resolved.permissions,

          isSelf: false,

          actorMemberId: resolved.memberId,

        };

      }

    }



    throw new NotFoundException('Not found');

  }



  async sharesFamily(

    actorMemberId: string | null | undefined,

    targetMemberId: string,

  ): Promise<boolean> {

    if (!actorMemberId) return false;

    const [actorMembership, targetMembership] = await Promise.all([

      this.prisma.familyMember.findUnique({ where: { memberId: actorMemberId } }),

      this.prisma.familyMember.findUnique({ where: { memberId: targetMemberId } }),

    ]);

    return Boolean(

      actorMembership &&

        targetMembership &&

        actorMembership.familyId === targetMembership.familyId,

    );

  }



  async isFamilyLeaderFor(

    actorMemberId: string | null | undefined,

    targetMemberId: string,

  ): Promise<boolean> {

    if (!actorMemberId) return false;

    const [actorMembership, targetMembership] = await Promise.all([

      this.prisma.familyMember.findUnique({ where: { memberId: actorMemberId } }),

      this.prisma.familyMember.findUnique({ where: { memberId: targetMemberId } }),

    ]);

    if (

      !actorMembership ||

      !targetMembership ||

      actorMembership.familyId !== targetMembership.familyId

    ) {

      return false;

    }

    return LEADERSHIP_ROLES.includes(actorMembership.role);

  }



  async canViewMemberContributions(

    actorUserId: string,

    targetMemberId: string,

    permissions: string[],

    isSelf: boolean,

    actorMemberId?: string | null,

  ): Promise<boolean> {

    if (isSelf) return true;

    if (

      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL) ||

      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)

    ) {

      return true;

    }

    if (!hasEffectivePermission(permissions, PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY)) {

      return false;

    }

    return this.isFamilyLeaderFor(actorMemberId, targetMemberId);

  }



  async canViewAttendanceDetail(

    permissions: string[],

    isSelf: boolean,

    actorMemberId: string | null | undefined,

    targetMemberId: string,

  ): Promise<boolean> {

    if (isSelf) return true;

    if (hasEffectivePermission(permissions, PERMISSIONS.EVENT_READ)) return true;

    if (

      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE) ||

      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_READ)

    ) {

      return true;

    }

    return this.isFamilyLeaderFor(actorMemberId, targetMemberId);

  }



  canViewWelfareDetails(permissions: string[], isSelf: boolean) {

    if (isSelf) return true;

    return (

      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_WELFARE_VIEW) ||

      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_WELFARE_MANAGE)

    );

  }



  canViewDisciplineDetails(permissions: string[], isSelf: boolean) {

    if (isSelf) return true;

    return (

      hasEffectivePermission(permissions, PERMISSIONS.DISCIPLINE_READ_ALL) ||

      hasEffectivePermission(permissions, PERMISSIONS.DISCIPLINE_MANAGE) ||

      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)

    );

  }



  canViewContributionDetails(

    permissions: string[],

    isSelf: boolean,

    canViewFamilyContributions: boolean,

  ) {

    if (isSelf || canViewFamilyContributions) return true;

    return (

      hasEffectivePermission(

        permissions,

        PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,

      ) || hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)

    );

  }



  canManageStatus(permissions: string[]) {

    return hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE);

  }



  assertCanManageProfile(permissions: string[], isSelf: boolean) {

    if (isSelf) return;

    if (!hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)) {

      throw new ForbiddenException('Not allowed to edit this profile');

    }

  }

}



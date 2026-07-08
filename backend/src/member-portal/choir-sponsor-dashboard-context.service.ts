import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES } from '../common/constants/roles';

const ADMIN_OVERRIDE_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.CHOIR_ADMIN,
]);

const SPONSOR_BASELINE_PERMISSIONS = [
  'member.portal.view',
  'event:read',
  'choir.music.sponsor.view',
  'choir.contribution.submit',
] as const;

export type ChoirSponsorDashboardContext = {
  choir: {
    id: string;
    name: string;
    code: string;
    choirKind: string;
  };
  sponsorship: {
    active: true;
    startedAt: string;
  } | null;
  permissions: string[];
  landingPath: string;
  canAccess: boolean;
};

@Injectable()
export class ChoirSponsorDashboardContextService {
  constructor(private prisma: PrismaService) {}

  async getContext(
    userId: string,
    choirId: string,
  ): Promise<ChoirSponsorDashboardContext> {
    const choirRow = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { id: true, name: true, code: true, choirKind: true, isActive: true },
    });
    if (!choirRow) {
      throw new NotFoundException('Choir not found');
    }

    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { name: true } } },
    });
    const isAdminOverride = userRoles.some((ur) =>
      ADMIN_OVERRIDE_ROLES.has(ur.role.name),
    );

    const sponsorship = member
      ? await this.prisma.choirSponsorship.findFirst({
          where: { memberId: member.id, choirId, active: true },
        })
      : null;

    const isActiveSponsor = sponsorship?.active === true;

    if (!choirRow.isActive && !isAdminOverride && !isActiveSponsor) {
      throw new NotFoundException('Choir not found');
    }

    if (!isAdminOverride && !isActiveSponsor) {
      throw new ForbiddenException('Not a sponsor of this choir');
    }

    const landingPath = `/choir/${choirId}/sponsor`;

    return {
      choir: {
        id: choirRow.id,
        name: choirRow.name,
        code: choirRow.code,
        choirKind: choirRow.choirKind,
      },
      sponsorship: isActiveSponsor
        ? {
            active: true as const,
            startedAt: sponsorship!.startedAt.toISOString(),
          }
        : null,
      permissions: [...SPONSOR_BASELINE_PERMISSIONS],
      landingPath,
      canAccess: isAdminOverride || isActiveSponsor,
    };
  }
}

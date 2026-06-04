import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hasProtocolView } from './protocol-access.util';
import { PermissionsResolver } from '../auth/permissions.resolver';

@Injectable()
export class ProtocolSearchService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async search(actorUserId: string, query: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const text = { contains: query, mode: 'insensitive' as const };

    const [members, teams, replacements] = await Promise.all([
      this.prisma.protocolMemberProfile.findMany({
        where: {
          active: true,
          member: {
            OR: [{ firstName: text }, { lastName: text }],
          },
        },
        take: 10,
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.protocolOccurrenceTeam.findMany({
        where: {
          occurrence: { title: text },
        },
        take: 10,
        include: {
          occurrence: { select: { id: true, title: true, startAt: true } },
        },
      }),
      this.prisma.protocolReplacementRequest.findMany({
        where: {
          OR: [
            { reason: text },
            { originalMember: { firstName: text } },
            { replacementMember: { firstName: text } },
          ],
        },
        take: 10,
        select: { id: true, status: true, reason: true },
      }),
    ]);

    return {
      members: members.map((m) => ({
        type: 'protocolMember',
        id: m.memberId,
        label: `${m.member.firstName} ${m.member.lastName}`,
      })),
      teams: teams.map((t) => ({
        type: 'protocolTeam',
        id: t.id,
        label: t.occurrence.title,
        startAt: t.occurrence.startAt,
      })),
      replacements: replacements.map((r) => ({
        type: 'protocolReplacement',
        id: r.id,
        label: r.reason ?? r.status,
      })),
    };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChoirKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { YERUSALEMU_CHOIR_CODE } from './member-portal.constants';

type ActiveChoirRef = { choirId: string; code: string; kind: ChoirKind };
type TargetChoirRef = { id: string; code: string; choirKind: ChoirKind };

@Injectable()
export class ChoirMembershipRulesService {
  constructor(private prisma: PrismaService) {}

  private isYerusalemuChoir(choir: { code: string; choirKind: ChoirKind }) {
    return (
      choir.code === YERUSALEMU_CHOIR_CODE || choir.choirKind === ChoirKind.SPECIAL
    );
  }

  private isPrimaryChoirKind(kind: ChoirKind) {
    return kind === ChoirKind.PRIMARY || kind === ChoirKind.CHILDREN;
  }

  /** Mirrors portal list visibility (member portal UI + public profile access). */
  canShowChoirInPortal(
    activeMemberships: ActiveChoirRef[],
    _pendingChoirIds: ReadonlySet<string>,
    target: TargetChoirRef,
  ): boolean {
    if (activeMemberships.length === 0) return true;

    if (activeMemberships.some((m) => m.choirId === target.id)) return true;

    const hasYerusalemu = activeMemberships.some(
      (m) => m.code === YERUSALEMU_CHOIR_CODE,
    );
    const hasPrimary = activeMemberships.some(
      (m) =>
        m.code !== YERUSALEMU_CHOIR_CODE && this.isPrimaryChoirKind(m.kind),
    );
    const yerusalemuOnlyMember = hasYerusalemu && !hasPrimary;

    if (hasPrimary) {
      return this.isYerusalemuChoir(target) && !hasYerusalemu;
    }

    if (yerusalemuOnlyMember) return true;

    return false;
  }

  async canViewChoirInPortal(userId: string, targetChoirId: string): Promise<boolean> {
    const target = await this.prisma.choir.findFirst({
      where: { id: targetChoirId, isActive: true },
      select: { id: true, code: true, choirKind: true },
    });
    if (!target) return false;

    const activeMemberships = await this.loadActiveChoirRefs(userId);
    const pendingChoirIds = await this.loadPendingChoirIds(userId);
    return this.canShowChoirInPortal(activeMemberships, pendingChoirIds, target);
  }

  async assertCanViewChoirInPortal(userId: string, targetChoirId: string): Promise<void> {
    const allowed = await this.canViewChoirInPortal(userId, targetChoirId);
    if (!allowed) {
      throw new NotFoundException('Choir not found');
    }
  }

  private async loadActiveChoirRefs(userId: string): Promise<ActiveChoirRef[]> {
    const active = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: { select: { code: true, choirKind: true } } },
    });
    return active.map((m) => ({
      choirId: m.choirId,
      code: m.choir.code,
      kind: m.choir.choirKind,
    }));
  }

  private async loadPendingChoirIds(userId: string): Promise<Set<string>> {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) return new Set();

    const pending = await this.prisma.choirJoinRequest.findMany({
      where: {
        memberId: member.id,
        status: { in: ['PENDING', 'NEEDS_INFO'] },
      },
      select: { choirId: true },
    });
    return new Set(pending.map((p) => p.choirId));
  }

  async filterPortalVisibleChoirIds(
    userId: string | undefined,
    choirs: TargetChoirRef[],
  ): Promise<TargetChoirRef[]> {
    if (!userId) return choirs;

    const activeMemberships = await this.loadActiveChoirRefs(userId);
    const pendingChoirIds = await this.loadPendingChoirIds(userId);
    return choirs.filter((c) =>
      this.canShowChoirInPortal(activeMemberships, pendingChoirIds, c),
    );
  }

  async validateNewMembership(userId: string, targetChoirId: string): Promise<void> {
    const target = await this.prisma.choir.findUniqueOrThrow({
      where: { id: targetChoirId },
    });

    const active = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: true },
    });

    if (active.some((m) => m.choirId === targetChoirId)) {
      throw new BadRequestException('Already a member of this choir');
    }

    if (target.choirKind === ChoirKind.SPECIAL) {
      return;
    }

    const hasPrimarySlot = active.some(
      (m) =>
        m.choir.choirKind === ChoirKind.PRIMARY ||
        m.choir.choirKind === ChoirKind.CHILDREN,
    );

    if (
      (target.choirKind === ChoirKind.PRIMARY ||
        target.choirKind === ChoirKind.CHILDREN) &&
      hasPrimarySlot
    ) {
      throw new BadRequestException(
        'A member may belong to only one primary choir. Yerusalemu may be added as an additional special choir.',
      );
    }
  }

  async describeMembershipRules(userId: string) {
    const active = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: { select: { name: true, code: true, choirKind: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    const refs = active.map((m) => ({
      choirId: m.choirId,
      code: m.choir.code,
      kind: m.choir.choirKind,
    }));
    const workspaceIds = this.resolveWorkspaceChoirIds(refs);
    const primaryChoirId = this.resolvePrimaryChoirId(refs);
    const scoped = active.filter((m) => workspaceIds.has(m.choirId));

    return {
      primaryChoirId,
      activeChoirs: scoped.map((m) => ({
        id: m.choirId,
        name: m.choir.name,
        code: m.choir.code,
        kind: m.choir.choirKind,
      })),
      rules: {
        onePrimaryChoir: true,
        yerusalemuException: true,
        yerusalemuCode: YERUSALEMU_CHOIR_CODE,
      },
    };
  }

  /** Choir workspaces a regular member may open (primary + optional Yerusalemu). */
  resolveWorkspaceChoirIds(activeMemberships: ActiveChoirRef[]): Set<string> {
    if (activeMemberships.length === 0) return new Set();

    const primary = this.resolvePrimaryChoirIdFromRefs(activeMemberships);
    const allowed = new Set<string>();
    if (primary) allowed.add(primary);

    const yerusalemu = activeMemberships.find((m) =>
      this.isYerusalemuChoir({ code: m.code, choirKind: m.kind }),
    );
    if (yerusalemu) allowed.add(yerusalemu.choirId);

    return allowed;
  }

  resolvePrimaryChoirId(activeMemberships: ActiveChoirRef[]): string | null {
    return this.resolvePrimaryChoirIdFromRefs(activeMemberships);
  }

  private resolvePrimaryChoirIdFromRefs(
    activeMemberships: ActiveChoirRef[],
  ): string | null {
    const primary = activeMemberships.find(
      (m) =>
        m.code !== YERUSALEMU_CHOIR_CODE && this.isPrimaryChoirKind(m.kind),
    );
    return primary?.choirId ?? activeMemberships[0]?.choirId ?? null;
  }

  async assertChoirWorkspaceAccess(userId: string, choirId: string): Promise<void> {
    const activeMemberships = await this.loadActiveChoirRefs(userId);
    const allowed = this.resolveWorkspaceChoirIds(activeMemberships);
    if (!allowed.has(choirId)) {
      throw new ForbiddenException('Choir workspace not available');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ChoirServiceAssignmentRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_SERVICE_SLOT_RULES,
  LAST_SUNDAY_EXTRA_RULE,
  type ServiceSlotSpec,
} from './choir-scheduling.constants';

export type ChoirSlotRecommendation = {
  choirId: string;
  choirName: string;
  role: ChoirServiceAssignmentRole;
  priority: number;
};

export type RecommendForOccurrenceOptions = {
  /** Extra serve counts from other draft entries in the same monthly plan. */
  extraServeCounts?: Map<string, number>;
  /** Choir+role pairs already reserved in the current plan draft. */
  reservedPairs?: Set<string>;
};

@Injectable()
export class ChoirServiceRulesService {
  constructor(private prisma: PrismaService) {}

  isLastSundayOfMonth(date: Date): boolean {
    const next = new Date(date);
    next.setDate(date.getDate() + 7);
    return next.getMonth() !== date.getMonth();
  }

  resolveSlots(templateCode: string | null, occurrenceStart: Date) {
    if (
      templateCode === 'SUNDAY_SERVICE_2' &&
      this.isLastSundayOfMonth(occurrenceStart)
    ) {
      return LAST_SUNDAY_EXTRA_RULE.slots;
    }
    const rule = DEFAULT_SERVICE_SLOT_RULES.find(
      (r) => r.templateCode === templateCode,
    );
    return rule?.slots ?? [];
  }

  async recommendForOccurrence(
    occurrenceId: string,
    options?: RecommendForOccurrenceOptions,
  ): Promise<ChoirSlotRecommendation[]> {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true },
    });

    const templateCode = occurrence.template?.code ?? null;
    const slots = this.resolveSlots(templateCode, occurrence.startAt);

    const choirs = await this.prisma.choir.findMany({
      where: { isActive: true },
      include: { serviceEligibility: true },
    });

    const eligible = choirs.filter((c) => {
      const e = c.serviceEligibility;
      if (!e) return true;
      if (!e.eligibleForMainServices) return false;
      if (templateCode === 'SUNDAY_SERVICE_1' && !e.eligibleForSunday1) return false;
      if (templateCode === 'SUNDAY_SERVICE_2' && !e.eligibleForSunday2) return false;
      if (templateCode === 'TUESDAY_SERVICE' && !e.eligibleForTuesday) return false;
      if (templateCode === 'FRIDAY_SERVICE' && !e.eligibleForFriday) return false;
      if (templateCode === 'IGABURO' && !e.eligibleForIgaburo) return false;
      return true;
    });

    const alreadyAssigned = await this.prisma.choirServiceAssignment.findMany({
      where: { occurrenceId, cancelledAt: null },
      select: { choirId: true, role: true },
    });
    const used = new Set(
      alreadyAssigned.map((a) => `${a.choirId}:${a.role}`),
    );
    if (options?.reservedPairs) {
      for (const pair of options.reservedPairs) used.add(pair);
    }

    const history = await this.prisma.choirServiceAssignment.groupBy({
      by: ['choirId'],
      where: {
        cancelledAt: null,
        occurrence: { startAt: { lt: occurrence.startAt } },
      },
      _count: { id: true },
    });
    const serveCount = new Map(history.map((h) => [h.choirId, h._count.id]));
    if (options?.extraServeCounts) {
      for (const [choirId, count] of options.extraServeCounts) {
        serveCount.set(choirId, (serveCount.get(choirId) ?? 0) + count);
      }
    }

    const recommendations: ChoirSlotRecommendation[] = [];

    for (const slot of slots) {
      const picks = this.pickForSlot(slot, eligible, used, serveCount);
      for (const choir of picks) {
        recommendations.push({
          choirId: choir.id,
          choirName: choir.name,
          role: slot.role,
          priority: choir.serviceEligibility?.priority ?? 0,
        });
        used.add(`${choir.id}:${slot.role}`);
      }
    }

    return recommendations;
  }

  private pickForSlot(
    slot: ServiceSlotSpec,
    eligible: Array<{
      id: string;
      name: string;
      code: string;
      serviceEligibility: {
        isChildrenChoir: boolean;
        isFifthSundayChoir: boolean;
        priority: number;
      } | null;
    }>,
    used: Set<string>,
    serveCount: Map<string, number>,
  ) {
    if (slot.preferChoirCode && slot.rotate === false) {
      const fixed = eligible.find((c) => c.code === slot.preferChoirCode);
      if (fixed && !used.has(`${fixed.id}:${slot.role}`)) {
        return [fixed];
      }
    }

    let pool = eligible.filter((c) => {
      const e = c.serviceEligibility;
      if ('preferChildren' in slot && slot.preferChildren && !e?.isChildrenChoir) {
        return false;
      }
      if (
        'preferChildren' in slot &&
        slot.preferChildren === false &&
        e?.isChildrenChoir
      ) {
        return false;
      }
      if (slot.preferFifthSunday && !e?.isFifthSundayChoir) return false;
      if (slot.preferFifthSunday === false && e?.isFifthSundayChoir) return false;
      if (slot.preferChoirCode && c.code === slot.preferChoirCode && slot.rotate !== false) {
        return false;
      }
      if (slot.role === 'PRIMARY' && c.code === 'WORSHIP_TEAM') return false;
      if (slot.role === 'SUPPORTING' && e?.isChildrenChoir) return false;
      return !used.has(`${c.id}:${slot.role}`);
    });

    if (slot.preferChoirCode && slot.rotate !== false) {
      const preferred = pool.find((c) => c.code === slot.preferChoirCode);
      if (preferred) {
        pool = [preferred, ...pool.filter((c) => c.id !== preferred.id)];
      }
    }

    pool.sort(
      (a, b) =>
        (serveCount.get(a.id) ?? 0) - (serveCount.get(b.id) ?? 0) ||
        (b.serviceEligibility?.priority ?? 0) -
          (a.serviceEligibility?.priority ?? 0),
    );

    const picks = [];
    for (let i = 0; i < slot.count && i < pool.length; i += 1) {
      picks.push(pool[i]);
    }
    return picks;
  }

  /** Soft validation — church admin may bypass with bypassRules. */
  async validateChoirSlot(
    choirId: string,
    occurrenceId: string,
    role: ChoirServiceAssignmentRole,
  ): Promise<{ allowed: boolean; warnings: string[] }> {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true },
    });
    const choir = await this.prisma.choir.findUniqueOrThrow({
      where: { id: choirId },
      include: { serviceEligibility: true },
    });
    const warnings: string[] = [];
    const templateCode = occurrence.template?.code ?? null;
    const e = choir.serviceEligibility;

    if (e) {
      if (!e.eligibleForMainServices) {
        warnings.push(`${choir.name} is not marked eligible for main services.`);
      }
      if (templateCode === 'SUNDAY_SERVICE_1' && !e.eligibleForSunday1) {
        warnings.push(`${choir.name} is not eligible for Sunday Service 1.`);
      }
      if (templateCode === 'SUNDAY_SERVICE_2' && !e.eligibleForSunday2) {
        warnings.push(`${choir.name} is not eligible for Sunday Service 2.`);
      }
      if (templateCode === 'TUESDAY_SERVICE' && !e.eligibleForTuesday) {
        warnings.push(`${choir.name} is not eligible for Tuesday service.`);
      }
      if (templateCode === 'FRIDAY_SERVICE' && !e.eligibleForFriday) {
        warnings.push(`${choir.name} is not eligible for Friday service.`);
      }
      if (templateCode === 'IGABURO' && !e.eligibleForIgaburo) {
        warnings.push(`${choir.name} is not eligible for IGABURO.`);
      }
      if (role === 'CHILDREN' && !e.isChildrenChoir) {
        warnings.push(`${choir.name} is not a children choir but CHILDREN role was selected.`);
      }
      if (role === 'PRIMARY' && e.isChildrenChoir && templateCode === 'SUNDAY_SERVICE_1') {
        warnings.push(
          `Sunday Service 1 primary slots usually exclude children choirs; ${choir.name} is a children choir.`,
        );
      }
    }

    const slots = this.resolveSlots(templateCode, occurrence.startAt);
    const roleSlots = slots.filter((s) => s.role === role);
    if (roleSlots.length === 0 && templateCode) {
      warnings.push(`Role ${role} is not in the default slot plan for ${templateCode}.`);
    }

    return { allowed: warnings.length === 0, warnings };
  }
}

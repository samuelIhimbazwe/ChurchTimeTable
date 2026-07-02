import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChoirSchedulePlanStatus,
  ChoirServiceAssignmentRole,
  ChoirServiceAssignmentStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ChoirServiceRulesService } from '../choir-scheduling/choir-service-rules.service';
import { ChoirSchedulingNotificationsService } from '../choir-scheduling/choir-scheduling-notifications.service';
import {
  CHOIR_SCHEDULING_AUDIT,
  SERVICE_DEFAULT_TIMES,
  SERVICE_TEMPLATE_LABELS,
} from '../choir-scheduling/choir-scheduling.constants';
import {
  hasProtocolManage,
  hasProtocolTeamApprove,
  hasProtocolTeamPublish,
  hasProtocolView,
} from './protocol-access.util';
import {
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';
import { PERMISSIONS } from '../common/constants/roles';

const MONTHLY_TEMPLATE_CODES = [
  'TUESDAY_SERVICE',
  'FRIDAY_SERVICE',
  'SUNDAY_SERVICE_1',
  'SUNDAY_SERVICE_2',
  'IGABURO',
] as const;

@Injectable()
export class ProtocolMonthlyScheduleService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private rules: ChoirServiceRulesService,
    private notify: ChoirSchedulingNotificationsService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return { permissions: resolved.permissions };
  }

  private requireManage(permissions: string[]) {
    if (
      !hasProtocolManage(permissions) &&
      !hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE)
    ) {
      throw new ForbiddenException('Protocol scheduling permission required');
    }
  }

  private requireApprove(permissions: string[]) {
    if (!hasProtocolTeamApprove(permissions)) {
      throw new ForbiddenException('Protocol approve permission required');
    }
  }

  private requirePublish(permissions: string[]) {
    if (!hasProtocolTeamPublish(permissions)) {
      throw new ForbiddenException('Protocol publish permission required');
    }
  }

  async list(actorUserId: string) {
    await this.actor(actorUserId);
    return this.prisma.choirSchedulePlan.findMany({
      where: { ownerScope: 'PROTOCOL' },
      orderBy: { startAt: 'desc' },
      take: 24,
    });
  }

  async get(actorUserId: string, planId: string) {
    await this.actor(actorUserId);
    return this.loadPlan(planId);
  }

  async generate(actorUserId: string, input: { year: number; month: number }) {
    const { permissions } = await this.actor(actorUserId);
    this.requireManage(permissions);

    const { year, month } = input;
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be 1–12');
    }

    const startAt = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endAt = new Date(year, month, 0, 23, 59, 59, 999);

    const existing = await this.prisma.choirSchedulePlan.findFirst({
      where: {
        ownerScope: 'PROTOCOL',
        year,
        month,
        status: { in: ['GENERATED', 'APPROVED', 'DRAFT'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A draft or pending schedule already exists for this month',
      );
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const label = `Choir schedule — ${monthNames[month - 1]} ${year}`;

    const plan = await this.prisma.choirSchedulePlan.create({
      data: {
        label,
        periodType: 'MONTHLY',
        year,
        month,
        startAt,
        endAt,
        status: 'GENERATED',
        ownerScope: 'PROTOCOL',
        generatedAt: new Date(),
        generatedById: actorUserId,
      },
    });

    await this.ensureMonthOccurrences(actorUserId, year, month);
    const occurrences = await this.prisma.operationOccurrence.findMany({
      where: {
        startAt: { gte: startAt, lte: endAt },
        cancelledAt: null,
        type: { in: ['SERVICE', 'SPECIAL_EVENT'] },
        template: { code: { in: [...MONTHLY_TEMPLATE_CODES] } },
      },
      include: { template: true },
      orderBy: { startAt: 'asc' },
    });

    const draftCounts = new Map<string, number>();
    const reservedPairs = new Set<string>();
    let sortOrder = 0;

    for (const occ of occurrences) {
      const recs = await this.rules.recommendForOccurrence(occ.id, {
        extraServeCounts: draftCounts,
        reservedPairs,
      });
      for (const rec of recs) {
        await this.prisma.choirSchedulePlanEntry.create({
          data: {
            planId: plan.id,
            occurrenceId: occ.id,
            choirId: rec.choirId,
            role: rec.role,
            sortOrder: sortOrder++,
          },
        });
        draftCounts.set(rec.choirId, (draftCounts.get(rec.choirId) ?? 0) + 1);
        reservedPairs.add(`${rec.choirId}:${rec.role}`);
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.PLAN_GENERATED,
      entity: 'ChoirSchedulePlan',
      entityId: plan.id,
      newValue: { year, month, occurrenceCount: occurrences.length } as Prisma.InputJsonValue,
    });

    return this.loadPlan(plan.id);
  }

  async updateEntry(
    actorUserId: string,
    planId: string,
    entryId: string,
    data: { choirId: string; role?: ChoirServiceAssignmentRole; reason?: string },
  ) {
    const { permissions } = await this.actor(actorUserId);
    this.requireManage(permissions);
    const plan = await this.assertEditablePlan(planId);

    const entry = await this.prisma.choirSchedulePlanEntry.findFirst({
      where: { id: entryId, planId: plan.id },
    });
    if (!entry) throw new NotFoundException('Plan entry not found');

    return this.prisma.choirSchedulePlanEntry.update({
      where: { id: entryId },
      data: {
        choirId: data.choirId,
        role: data.role ?? entry.role,
        isOverride: true,
        overrideReason: data.reason?.trim() ?? 'Coordinator edit',
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: {
          select: { id: true, title: true, startAt: true, template: { select: { code: true } } },
        },
      },
    });
  }

  async addEntry(
    actorUserId: string,
    planId: string,
    data: {
      occurrenceId: string;
      choirId: string;
      role?: ChoirServiceAssignmentRole;
      reason?: string;
    },
  ) {
    const { permissions } = await this.actor(actorUserId);
    this.requireManage(permissions);
    const plan = await this.assertEditablePlan(planId);

    const role = data.role ?? 'PRIMARY';
    return this.prisma.choirSchedulePlanEntry.create({
      data: {
        planId: plan.id,
        occurrenceId: data.occurrenceId,
        choirId: data.choirId,
        role,
        isOverride: true,
        overrideReason: data.reason?.trim() ?? 'Manual addition',
        sortOrder: 999,
      },
      include: {
        choir: { select: { id: true, name: true, code: true } },
        occurrence: {
          select: { id: true, title: true, startAt: true, template: { select: { code: true } } },
        },
      },
    });
  }

  async removeEntry(actorUserId: string, planId: string, entryId: string) {
    const { permissions } = await this.actor(actorUserId);
    this.requireManage(permissions);
    await this.assertEditablePlan(planId);

    const entry = await this.prisma.choirSchedulePlanEntry.findFirst({
      where: { id: entryId, planId },
    });
    if (!entry) throw new NotFoundException('Plan entry not found');
    await this.prisma.choirSchedulePlanEntry.delete({ where: { id: entryId } });
    return { ok: true };
  }

  async approve(actorUserId: string, planId: string) {
    const { permissions } = await this.actor(actorUserId);
    this.requireApprove(permissions);

    const plan = await this.prisma.choirSchedulePlan.findFirst({
      where: { id: planId, ownerScope: 'PROTOCOL' },
    });
    if (!plan) throw new NotFoundException('Schedule plan not found');
    if (plan.status !== 'GENERATED' && plan.status !== 'DRAFT') {
      throw new BadRequestException('Only generated drafts can be approved');
    }

    const updated = await this.prisma.choirSchedulePlan.update({
      where: { id: planId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.PLAN_APPROVED,
      entity: 'ChoirSchedulePlan',
      entityId: planId,
    });

    return updated;
  }

  async publish(actorUserId: string, planId: string) {
    const { permissions } = await this.actor(actorUserId);
    this.requirePublish(permissions);

    const plan = await this.prisma.choirSchedulePlan.findFirst({
      where: { id: planId, ownerScope: 'PROTOCOL' },
      include: {
        entries: {
          include: {
            occurrence: { select: { id: true, title: true, startAt: true, endAt: true } },
            choir: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Schedule plan not found');
    if (plan.status !== 'APPROVED') {
      throw new BadRequestException('Approve the schedule before publishing');
    }

    const now = new Date();
    for (const entry of plan.entries) {
      const assignment = await this.prisma.choirServiceAssignment.upsert({
        where: {
          choirId_occurrenceId_role: {
            choirId: entry.choirId,
            occurrenceId: entry.occurrenceId,
            role: entry.role,
          },
        },
        create: {
          choirId: entry.choirId,
          occurrenceId: entry.occurrenceId,
          role: entry.role,
          status: ChoirServiceAssignmentStatus.CONFIRMED,
          source: 'CHURCH_DIRECT',
          assignedById: actorUserId,
          proposedById: actorUserId,
          confirmedById: actorUserId,
          confirmedAt: now,
          announcedAt: now,
          bypassRules: entry.isOverride,
          overrideReason: entry.overrideReason,
          planEntryId: entry.id,
        },
        update: {
          cancelledAt: null,
          rejectedAt: null,
          status: ChoirServiceAssignmentStatus.CONFIRMED,
          confirmedById: actorUserId,
          confirmedAt: now,
          announcedAt: now,
          planEntryId: entry.id,
          bypassRules: entry.isOverride,
          overrideReason: entry.overrideReason,
        },
        include: {
          occurrence: { select: { title: true, startAt: true, endAt: true } },
        },
      });

      const existingActivity = await this.prisma.choirActivity.findFirst({
        where: {
          occurrenceId: entry.occurrenceId,
          choirId: entry.choirId,
        },
      });
      if (!existingActivity) {
        await this.prisma.choirActivity.create({
          data: {
            choirId: entry.choirId,
            title: `${entry.occurrence.title} — Service`,
            activityType: 'SERVICE',
            startAt: entry.occurrence.startAt,
            endAt: entry.occurrence.endAt ?? entry.occurrence.startAt,
            occurrenceId: entry.occurrenceId,
            createdById: actorUserId,
          },
        });
      }

      void this.notify.notifyAssignment(
        entry.choirId,
        assignment.occurrence.title,
        entry.occurrenceId,
      );
    }

    const published = await this.prisma.choirSchedulePlan.update({
      where: { id: planId },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
        publishedById: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.PLAN_PUBLISHED,
      entity: 'ChoirSchedulePlan',
      entityId: planId,
      newValue: { entryCount: plan.entries.length } as Prisma.InputJsonValue,
    });

    return published;
  }

  async getPrintGrid(actorUserId: string, planId: string) {
    await this.actor(actorUserId);
    const plan = await this.loadPlan(planId);
    const entries = plan.entries;

    type GridService = {
      occurrenceId: string;
      templateCode: string | null;
      labelRw: string;
      labelEn: string;
      date: string;
      choirs: string[];
    };

    type GridWeek = {
      weekIndex: number;
      startDate: string;
      endDate: string;
      services: GridService[];
    };

    const byOccurrence = new Map<string, GridService>();

    for (const entry of entries) {
      const occ = entry.occurrence;
      const code = occ.template?.code ?? null;
      const labels = code ? SERVICE_TEMPLATE_LABELS[code] : null;
      const key = entry.occurrenceId;
      if (!byOccurrence.has(key)) {
        byOccurrence.set(key, {
          occurrenceId: key,
          templateCode: code,
          labelRw: labels?.rw ?? occ.title,
          labelEn: labels?.en ?? occ.title,
          date: occ.startAt.toISOString(),
          choirs: [],
        });
      }
      byOccurrence.get(key)!.choirs.push(entry.choir.name);
    }

    const services = [...byOccurrence.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const weeks: GridWeek[] = [];
    if (services.length > 0) {
      const planStart = new Date(plan.startAt);
      let weekIndex = 1;
      let cursor = new Date(planStart);
      while (cursor <= plan.endAt) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > plan.endAt) weekEnd.setTime(plan.endAt.getTime());

        const weekServices = services.filter((s) => {
          const d = new Date(s.date);
          return d >= weekStart && d <= weekEnd;
        });

        if (weekServices.length > 0) {
          weeks.push({
            weekIndex,
            startDate: weekStart.toISOString().slice(0, 10),
            endDate: weekEnd.toISOString().slice(0, 10),
            services: weekServices,
          });
          weekIndex += 1;
        }
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    const igaburo = services.filter((s) => s.templateCode === 'IGABURO');

    return {
      plan: {
        id: plan.id,
        label: plan.label,
        year: plan.year,
        month: plan.month,
        status: plan.status,
      },
      weeks,
      igaburo,
      preparedBy: 'Protocol Ministry',
    };
  }

  private async loadPlan(planId: string) {
    const plan = await this.prisma.choirSchedulePlan.findFirst({
      where: { id: planId, ownerScope: 'PROTOCOL' },
      include: {
        entries: {
          include: {
            choir: { select: { id: true, name: true, code: true } },
            occurrence: {
              select: {
                id: true,
                title: true,
                startAt: true,
                endAt: true,
                template: { select: { code: true, name: true } },
              },
            },
          },
          orderBy: [{ occurrence: { startAt: 'asc' } }, { sortOrder: 'asc' }],
        },
      },
    });
    if (!plan) throw new NotFoundException('Schedule plan not found');
    return plan;
  }

  private async assertEditablePlan(planId: string) {
    const plan = await this.prisma.choirSchedulePlan.findFirst({
      where: { id: planId, ownerScope: 'PROTOCOL' },
    });
    if (!plan) throw new NotFoundException('Schedule plan not found');
    if (plan.status !== 'GENERATED' && plan.status !== 'DRAFT') {
      throw new BadRequestException('Published or approved schedules cannot be edited');
    }
    return plan;
  }

  private async ensureMonthOccurrences(actorUserId: string, year: number, month: number) {
    const templates = await this.prisma.operationTemplate.findMany({
      where: { code: { in: [...MONTHLY_TEMPLATE_CODES] }, isActive: true },
    });
    const byCode = new Map(templates.map((t) => [t.code, t]));

    const daysInMonth = new Date(year, month, 0).getDate();
    const slots: Array<{ code: string; date: Date }> = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day);
      const dow = date.getDay();
      if (dow === 2) slots.push({ code: 'TUESDAY_SERVICE', date });
      if (dow === 5) slots.push({ code: 'FRIDAY_SERVICE', date });
      if (dow === 0) {
        slots.push({ code: 'SUNDAY_SERVICE_1', date });
        slots.push({ code: 'SUNDAY_SERVICE_2', date });
      }
    }

    const lastSaturday = this.lastSaturdayOfMonth(year, month);
    if (lastSaturday) {
      slots.push({ code: 'IGABURO', date: lastSaturday });
    }

    for (const slot of slots) {
      const template = byCode.get(slot.code);
      if (!template) continue;

      const times = SERVICE_DEFAULT_TIMES[slot.code];
      if (!times) continue;

      const startAt = new Date(slot.date);
      startAt.setHours(times.startHour, times.startMinute, 0, 0);
      const endAt = new Date(slot.date);
      endAt.setHours(times.endHour, times.endMinute, 0, 0);

      const labels = SERVICE_TEMPLATE_LABELS[slot.code];
      const title = labels?.en ?? template.name;

      const existing = await this.prisma.operationOccurrence.findFirst({
        where: {
          templateId: template.id,
          startAt,
          endAt,
          cancelledAt: null,
          status: { not: 'CANCELLED' },
        },
      });
      if (existing) continue;

      await this.prisma.operationOccurrence.create({
        data: {
          templateId: template.id,
          type: 'SERVICE',
          title,
          startAt,
          endAt,
          status: 'DRAFT',
          createdById: actorUserId,
        },
      });
    }
  }

  private lastSaturdayOfMonth(year: number, month: number): Date | null {
    for (let day = new Date(year, month, 0).getDate(); day >= 1; day -= 1) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 6) return date;
    }
    return null;
  }
}

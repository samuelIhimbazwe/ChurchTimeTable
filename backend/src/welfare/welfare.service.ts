import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WelfareCaseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { CreateWelfareCaseDto } from './dto/create-welfare-case.dto';
import { UpdateWelfareCaseDto } from './dto/update-welfare-case.dto';
import { RecordWelfareContributionDto } from './dto/record-welfare-contribution.dto';
import { RecordWelfareAssistanceDto } from './dto/record-welfare-assistance.dto';
import { UpsertWelfareCategoryDto } from './dto/upsert-welfare-category.dto';
import { SubmitMemberWelfareContributionDto } from './dto/submit-member-welfare-contribution.dto';
import {
  ReviewWelfareCaseDto,
  WelfareReviewAction,
} from './dto/review-welfare-case.dto';
import {
  TransitionWelfareCaseDto,
  WelfareTransitionAction,
} from './dto/transition-welfare-case.dto';
import {
  ACTIVE_WELFARE_STATUSES,
  enrichWelfareCaseFinancials,
  sumWelfareContributions,
} from './welfare-case.util';
import { ChoirNotificationsService } from '../choir-mvp/choir-notifications.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class WelfareService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private choirNotifications: ChoirNotificationsService,
    private reports: ReportsService,
  ) {}

  private async assertWelfareAccess(userId: string, manage = false) {
    const resolved = await this.permissions.resolveForUser(userId);
    const view = hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
    );
    const mgr = hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
    );
    if (manage && !mgr) throw new ForbiddenException('Not allowed');
    if (!view && !mgr) throw new NotFoundException('Not found');
    return resolved;
  }

  private async memberIdForUser(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Member profile required');
    return member.id;
  }

  private serializeCaseForActor(row: {
    requestedAmount: unknown;
    approvedAmount: unknown;
    contributions: { amount: unknown; isAnonymous?: boolean; contributor?: unknown }[];
    assistance: { amount: unknown }[];
    [key: string]: unknown;
  }, canManage: boolean) {
    const enriched = enrichWelfareCaseFinancials(row);
    if (canManage) return enriched;
    return {
      ...enriched,
      contributions: row.contributions.map((c) => ({
        ...c,
        contributor: c.isAnonymous ? undefined : c.contributor,
      })),
    };
  }

  private choirCaseFilter(): Prisma.WelfareCaseWhereInput {
    const choirId = getActiveChoirId();
    return { OR: [{ choirId }, { choirId: null }] };
  }

  async listCategories() {
    return this.prisma.welfareCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listCases(
    userId: string,
    page = 1,
    limit = 20,
    filters?: { status?: WelfareCaseStatus; familyId?: string },
  ) {
    await this.assertWelfareAccess(userId);
    const { skip, take } = paginate(page, limit);
    const where: Prisma.WelfareCaseWhereInput = {
      ...this.choirCaseFilter(),
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.familyId) where.familyId = filters.familyId;

    const [items, total] = await Promise.all([
      this.prisma.welfareCase.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberNumber: true,
            },
          },
          category: true,
          coordinator: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.welfareCase.count({ where }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async getCase(userId: string, id: string) {
    const resolved = await this.assertWelfareAccess(userId);
    const canManage = hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
    );
    const row = await this.prisma.welfareCase.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
            ministry: true,
            status: true,
          },
        },
        category: true,
        coordinator: {
          select: { id: true, firstName: true, lastName: true },
        },
        contributions: {
          orderBy: { paymentAt: 'desc' },
          take: 50,
          include: {
            contributor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true,
              },
            },
          },
        },
        assistance: { orderBy: { deliveredAt: 'desc' }, take: 50 },
      },
    });
    if (!row) throw new NotFoundException('Not found');
    return this.serializeCaseForActor(row, canManage);
  }

  async getCaseTimeline(userId: string, id: string) {
    await this.assertWelfareAccess(userId);
    const row = await this.prisma.welfareCase.findUnique({
      where: { id },
      include: {
        contributions: { orderBy: { paymentAt: 'asc' } },
        assistance: { orderBy: { deliveredAt: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Not found');

    const audits = await this.prisma.auditLog.findMany({
      where: { entity: 'WelfareCase', entityId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const events: Array<{
      type: string;
      at: Date;
      label: string;
      meta?: Record<string, unknown>;
    }> = [
      {
        type: 'case_created',
        at: row.openedAt,
        label: 'WELFARE_TIMELINE_CREATED',
      },
    ];

    for (const entry of audits) {
      events.push({
        type: 'case_update',
        at: entry.createdAt,
        label: entry.action,
        meta: { action: entry.action },
      });
    }

    for (const contribution of row.contributions) {
      events.push({
        type: 'contribution',
        at: contribution.paymentAt,
        label: 'WELFARE_TIMELINE_CONTRIBUTION',
        meta: { amount: Number(contribution.amount) },
      });
    }

    for (const item of row.assistance) {
      events.push({
        type: 'assistance',
        at: item.deliveredAt,
        label: 'WELFARE_TIMELINE_ASSISTANCE',
        meta: { assistanceType: item.assistanceType },
      });
    }

    return events.sort((a, b) => a.at.getTime() - b.at.getTime());
  }

  async createCase(userId: string, dto: CreateWelfareCaseDto) {
    await this.assertWelfareAccess(userId, true);
    const row = await this.prisma.welfareCase.create({
      data: {
        choirId: getActiveChoirId(),
        memberId: dto.memberId,
        familyId: dto.familyId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        urgency: dto.urgency,
        coordinatorId: dto.coordinatorId,
        supportPlan: dto.supportPlan,
        status: dto.status,
        requestedAmount: dto.requestedAmount,
        approvedAmount: dto.approvedAmount,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        documentUrls: dto.documentUrls ?? undefined,
      },
    });
    await this.audit.log({
      userId,
      action: 'WELFARE_CASE_CREATED',
      entity: 'WelfareCase',
      entityId: row.id,
      newValue: row,
    });
    const beneficiary = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      select: { userId: true },
    });
    void this.choirNotifications.notifyWelfareCaseOpened(
      row.id,
      row.title,
      beneficiary?.userId,
    );
    return row;
  }

  async reviewCase(userId: string, id: string, dto: ReviewWelfareCaseDto) {
    await this.assertWelfareAccess(userId, true);
    const existing = await this.prisma.welfareCase.findUnique({
      where: { id },
      include: { member: { select: { userId: true } } },
    });
    if (!existing) throw new NotFoundException('Not found');

    let status = existing.status;
    switch (dto.action) {
      case WelfareReviewAction.APPROVE:
        status = WelfareCaseStatus.APPROVED;
        break;
      case WelfareReviewAction.REJECT:
        status = WelfareCaseStatus.CANCELLED;
        break;
      case WelfareReviewAction.REQUEST_CLARIFICATION:
      case WelfareReviewAction.REVIEW:
        status = WelfareCaseStatus.UNDER_REVIEW;
        break;
      default:
        break;
    }

    const supportPlan = dto.notes
      ? [existing.supportPlan, dto.notes].filter(Boolean).join('\n\n')
      : existing.supportPlan;

    const row = await this.prisma.welfareCase.update({
      where: { id },
      data: {
        status,
        supportPlan,
        approvedAmount:
          dto.approvedAmount ?? (dto.action === WelfareReviewAction.APPROVE
            ? existing.approvedAmount ?? existing.requestedAmount
            : undefined),
        closedAt:
          status === WelfareCaseStatus.CANCELLED
            ? new Date()
            : undefined,
      },
    });

    await this.audit.log({
      userId,
      action: 'WELFARE_CASE_REVIEW',
      entity: 'WelfareCase',
      entityId: id,
      oldValue: { status: existing.status, action: dto.action },
      newValue: { status: row.status, notes: dto.notes },
    });

    void this.choirNotifications.notifyWelfareStatusChange(
      id,
      row.title,
      row.status,
      existing.member.userId,
    );

    return this.getCase(userId, id);
  }

  async transitionCase(userId: string, id: string, dto: TransitionWelfareCaseDto) {
    await this.assertWelfareAccess(userId, true);
    const existing = await this.prisma.welfareCase.findUnique({
      where: { id },
      include: { member: { select: { userId: true } } },
    });
    if (!existing) throw new NotFoundException('Not found');

    let status = existing.status;
    switch (dto.action) {
      case WelfareTransitionAction.SUBMIT:
        status = WelfareCaseStatus.OPEN;
        break;
      case WelfareTransitionAction.START_FUNDRAISING:
        status = WelfareCaseStatus.PARTIALLY_FUNDED;
        break;
      case WelfareTransitionAction.COMPLETE:
        status = WelfareCaseStatus.FUNDED;
        break;
      case WelfareTransitionAction.CLOSE:
        status = WelfareCaseStatus.CLOSED;
        break;
      default:
        throw new BadRequestException('Invalid transition');
    }

    const supportPlan = dto.notes
      ? [existing.supportPlan, dto.notes].filter(Boolean).join('\n\n')
      : existing.supportPlan;

    const row = await this.prisma.welfareCase.update({
      where: { id },
      data: {
        status,
        supportPlan,
        closedAt:
          status === WelfareCaseStatus.CLOSED ||
          status === WelfareCaseStatus.FUNDED
            ? new Date()
            : undefined,
      },
    });

    await this.audit.log({
      userId,
      action: 'WELFARE_CASE_TRANSITION',
      entity: 'WelfareCase',
      entityId: id,
      oldValue: { status: existing.status, action: dto.action },
      newValue: { status: row.status, notes: dto.notes },
    });

    void this.choirNotifications.notifyWelfareStatusChange(
      id,
      row.title,
      row.status,
      existing.member.userId,
    );

    return this.getCase(userId, id);
  }

  async getCaseAudit(userId: string, id: string) {
    await this.assertWelfareAccess(userId);
    const row = await this.prisma.welfareCase.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Not found');

    const audits = await this.prisma.auditLog.findMany({
      where: { entity: 'WelfareCase', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, email: true, member: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return audits.map((entry) => ({
      id: entry.id,
      action: entry.action,
      createdAt: entry.createdAt,
      actor: entry.user?.member
        ? `${entry.user.member.firstName} ${entry.user.member.lastName}`
        : entry.user?.email ?? 'System',
      oldValue: entry.oldValue,
      newValue: entry.newValue,
    }));
  }

  async getReports(userId: string) {
    await this.assertWelfareAccess(userId);
    const cases = await this.prisma.welfareCase.findMany({
      include: {
        category: true,
        member: { select: { id: true, firstName: true, lastName: true } },
        contributions: { select: { amount: true } },
        assistance: { select: { amount: true } },
      },
    });

    const categories = new Map<
      string,
      { categoryId: string; name: string; caseCount: number; raised: number; distributed: number }
    >();
    const families = new Map<
      string,
      { familyId: string; received: number; contributed: number; caseCount: number }
    >();
    const members = new Map<
      string,
      { memberId: string; name: string; received: number; contributed: number }
    >();
    const monthly = new Map<
      string,
      { month: string; activeCases: number; completedCases: number; raised: number }
    >();

    const monthKey = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    for (const row of cases) {
      const raised = sumWelfareContributions(row.contributions);
      const distributed = row.assistance.reduce(
        (sum, a) => sum + Number(a.amount ?? 0),
        0,
      );

      const cat = categories.get(row.categoryId) ?? {
        categoryId: row.categoryId,
        name: row.category.name,
        caseCount: 0,
        raised: 0,
        distributed: 0,
      };
      cat.caseCount += 1;
      cat.raised += raised;
      cat.distributed += distributed;
      categories.set(row.categoryId, cat);

      if (row.familyId) {
        const fam = families.get(row.familyId) ?? {
          familyId: row.familyId,
          received: 0,
          contributed: 0,
          caseCount: 0,
        };
        fam.received += distributed;
        fam.contributed += raised;
        fam.caseCount += 1;
        families.set(row.familyId, fam);
      }

      const mem = members.get(row.memberId) ?? {
        memberId: row.memberId,
        name: `${row.member.firstName} ${row.member.lastName}`,
        received: 0,
        contributed: 0,
      };
      mem.received += distributed;
      mem.contributed += raised;
      members.set(row.memberId, mem);

      const mk = monthKey(row.openedAt);
      const bucket = monthly.get(mk) ?? {
        month: mk,
        activeCases: 0,
        completedCases: 0,
        raised: 0,
      };
      if (ACTIVE_WELFARE_STATUSES.includes(row.status)) {
        bucket.activeCases += 1;
      }
      if (
        row.status === WelfareCaseStatus.CLOSED ||
        row.status === WelfareCaseStatus.FUNDED
      ) {
        bucket.completedCases += 1;
      }
      bucket.raised += raised;
      monthly.set(mk, bucket);
    }

    const dashboard = await this.dashboard(userId);
    const completionRate =
      cases.length > 0
        ? Math.round(
            (cases.filter(
              (c) =>
                c.status === WelfareCaseStatus.CLOSED ||
                c.status === WelfareCaseStatus.FUNDED,
            ).length /
              cases.length) *
              100,
          )
        : 0;

    return {
      summary: {
        activeCases: dashboard.activeCases,
        urgentCases: dashboard.urgentCases,
        totalAssistance: dashboard.assistance.total,
        totalContributions: dashboard.contributions.total,
        completionRate,
        byStatus: dashboard.byStatus,
      },
      byCategory: [...categories.values()],
      byFamily: [...families.values()],
      byMember: [...members.values()],
      monthly: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async exportReportsPdf(userId: string) {
    const reports = await this.getReports(userId);
    const lines = [
      `Active cases: ${reports.summary.activeCases}`,
      `Urgent: ${reports.summary.urgentCases}`,
      `Contributions: ${reports.summary.totalContributions}`,
      `Assistance: ${reports.summary.totalAssistance}`,
      `Completion rate: ${reports.summary.completionRate}%`,
      '',
      'By category:',
      ...reports.byCategory.map(
        (r) => `${r.name}: ${r.caseCount} cases, raised ${r.raised}, distributed ${r.distributed}`,
      ),
    ];
    const buffer = await this.reports.exportPdf('Welfare Reports', lines);
    return {
      filename: `welfare-reports-${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async updateCase(userId: string, id: string, dto: UpdateWelfareCaseDto) {
    await this.assertWelfareAccess(userId, true);
    const existing = await this.prisma.welfareCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Not found');

    const row = await this.prisma.welfareCase.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        urgency: dto.urgency,
        coordinatorId: dto.coordinatorId,
        supportPlan: dto.supportPlan,
        requestedAmount: dto.requestedAmount,
        approvedAmount: dto.approvedAmount,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        documentUrls: dto.documentUrls,
        closedAt:
          dto.status === WelfareCaseStatus.CLOSED ||
          dto.status === WelfareCaseStatus.CANCELLED
            ? new Date()
            : dto.status
              ? null
              : undefined,
      },
    });
    await this.audit.log({
      userId,
      action: 'WELFARE_CASE_UPDATE',
      entity: 'WelfareCase',
      entityId: id,
      oldValue: existing,
      newValue: row,
    });
    if (dto.status && dto.status !== existing.status) {
      const member = await this.prisma.member.findUnique({
        where: { id: existing.memberId },
        select: { userId: true },
      });
      void this.choirNotifications.notifyWelfareStatusChange(
        id,
        row.title,
        row.status,
        member?.userId,
      );
    }
    return row;
  }

  async recordContribution(
    userId: string,
    dto: RecordWelfareContributionDto,
    options?: { leadershipRecorded?: boolean },
  ) {
    if (options?.leadershipRecorded !== false) {
      await this.assertWelfareAccess(userId, true);
    } else {
      await this.assertWelfareAccess(userId);
    }
    const row = await this.prisma.welfareContribution.create({
      data: {
        caseId: dto.caseId,
        contributorId: dto.contributorId,
        amount: dto.amount,
        currency: dto.currency ?? 'RWF',
        paymentChannel: dto.paymentChannel,
        paymentAt: dto.paymentAt ? new Date(dto.paymentAt) : undefined,
        notes: dto.notes,
        isAnonymous: dto.isAnonymous ?? false,
        receiptUrl: dto.receiptUrl,
        recordedByUserId: userId,
      },
    });
    await this.audit.log({
      userId,
      action: 'WELFARE_CONTRIBUTION',
      entity: 'WelfareContribution',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async submitMemberContribution(
    userId: string,
    dto: SubmitMemberWelfareContributionDto,
  ) {
    await this.assertWelfareAccess(userId);
    const contributorId = await this.memberIdForUser(userId);
    const welfareCase = await this.prisma.welfareCase.findUnique({
      where: { id: dto.caseId },
    });
    if (!welfareCase) throw new NotFoundException('Not found');
    if (
      welfareCase.status === WelfareCaseStatus.CLOSED ||
      welfareCase.status === WelfareCaseStatus.CANCELLED
    ) {
      throw new BadRequestException('Case is closed');
    }

    return this.recordContribution(
      userId,
      {
        caseId: dto.caseId,
        contributorId,
        amount: dto.amount,
        currency: dto.currency,
        paymentChannel: dto.paymentChannel,
        notes: dto.notes,
        isAnonymous: dto.isAnonymous,
      },
      { leadershipRecorded: false },
    );
  }

  async recordAssistance(userId: string, dto: RecordWelfareAssistanceDto) {
    await this.assertWelfareAccess(userId, true);
    const row = await this.prisma.welfareAssistance.create({
      data: {
        caseId: dto.caseId,
        assistanceType: dto.assistanceType,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
        recordedByUserId: userId,
      },
    });
    await this.audit.log({
      userId,
      action: 'WELFARE_ASSISTANCE',
      entity: 'WelfareAssistance',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async upsertCategory(userId: string, dto: UpsertWelfareCategoryDto) {
    await this.assertWelfareAccess(userId, true);
    const existing = await this.prisma.welfareCategory.findUnique({
      where: { code: dto.code },
      include: { _count: { select: { cases: true } } },
    });

    if (existing && dto.active === false && existing._count.cases > 0) {
      const row = await this.prisma.welfareCategory.update({
        where: { code: dto.code },
        data: { active: false, name: dto.name, description: dto.description },
      });
      return row;
    }

    const row = await this.prisma.welfareCategory.upsert({
      where: { code: dto.code },
      create: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
      update: {
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder,
        active: dto.active,
      },
    });

    await this.audit.log({
      userId,
      action: existing ? 'WELFARE_CATEGORY_UPDATE' : 'WELFARE_CATEGORY_CREATE',
      entity: 'WelfareCategory',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async exportCasesCsv(userId: string, filters?: { status?: WelfareCaseStatus }) {
    await this.assertWelfareAccess(userId);
    const rows = await this.prisma.welfareCase.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { member: true, category: true, contributions: true },
    });

    const header =
      'id,title,status,member,category,requested,approved,raised,urgency,openedAt';
    const lines = rows.map((row) => {
      const raised = sumWelfareContributions(row.contributions);
      return [
        row.id,
        `"${row.title.replace(/"/g, '""')}"`,
        row.status,
        `"${row.member.firstName} ${row.member.lastName}"`,
        row.category.name,
        row.requestedAmount ?? '',
        row.approvedAmount ?? '',
        raised,
        row.urgency,
        row.openedAt.toISOString(),
      ].join(',');
    });
    return {
      filename: `welfare-cases-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: 'text/csv',
      content: [header, ...lines].join('\n'),
    };
  }

  async exportCasesPdf(userId: string, filters?: { status?: WelfareCaseStatus }) {
    await this.assertWelfareAccess(userId);
    const rows = await this.prisma.welfareCase.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { member: true, category: true, contributions: true },
    });
    const lines = rows.map((row) => {
      const raised = sumWelfareContributions(row.contributions);
      return `${row.title} | ${row.status} | ${row.member.firstName} ${row.member.lastName} | raised ${raised}`;
    });
    const buffer = await this.reports.exportPdf('Welfare Cases Report', [
      `Generated: ${new Date().toISOString()}`,
      `Total cases: ${rows.length}`,
      ...lines,
    ]);
    return {
      filename: `welfare-cases-${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async dashboard(userId: string) {
    await this.assertWelfareAccess(userId);
    const now = new Date();
    const deadlineHorizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeCases,
      urgentCases,
      nearDeadline,
      byStatus,
      contributions,
      assistance,
      recentContributions,
      recentAssistance,
    ] = await Promise.all([
      this.prisma.welfareCase.count({
        where: {
          status: { in: ACTIVE_WELFARE_STATUSES },
        },
      }),
      this.prisma.welfareCase.count({
        where: {
          status: { in: ACTIVE_WELFARE_STATUSES },
          urgency: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
      this.prisma.welfareCase.count({
        where: {
          status: { in: ACTIVE_WELFARE_STATUSES },
          targetDate: { lte: deadlineHorizon, gte: now },
        },
      }),
      this.prisma.welfareCase.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.welfareContribution.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.welfareAssistance.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.welfareContribution.findMany({
        orderBy: { paymentAt: 'desc' },
        take: 5,
        include: {
          contributor: {
            select: { id: true, firstName: true, lastName: true },
          },
          case: { select: { id: true, title: true } },
        },
      }),
      this.prisma.welfareAssistance.findMany({
        orderBy: { deliveredAt: 'desc' },
        take: 5,
        include: { case: { select: { id: true, title: true } } },
      }),
    ]);

    const byCategory = await this.prisma.welfareCase.groupBy({
      by: ['categoryId'],
      _count: true,
    });

    const fundsRaised = Number(contributions._sum.amount ?? 0);
    const fundsSpent = Number(assistance._sum.amount ?? 0);

    const openWithTargets = await this.prisma.welfareCase.findMany({
      where: {
        status: { in: ACTIVE_WELFARE_STATUSES },
        OR: [{ approvedAmount: { not: null } }, { requestedAmount: { not: null } }],
      },
      select: {
        id: true,
        approvedAmount: true,
        requestedAmount: true,
        contributions: { select: { amount: true } },
      },
    });

    let fundsNeeded = 0;
    for (const row of openWithTargets) {
      const target =
        Number(row.approvedAmount ?? row.requestedAmount ?? 0) -
        sumWelfareContributions(row.contributions);
      if (target > 0) fundsNeeded += target;
    }

    return {
      openCases: activeCases,
      activeCases,
      urgentCases,
      casesNearDeadline: nearDeadline,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count,
      })),
      byCategory,
      contributions: {
        count: contributions._count,
        total: fundsRaised,
      },
      assistance: {
        count: assistance._count,
        total: fundsSpent,
      },
      fundsRaised,
      fundsNeeded,
      fundBalance: fundsRaised - fundsSpent,
      recentContributions,
      recentAssistance,
    };
  }
}

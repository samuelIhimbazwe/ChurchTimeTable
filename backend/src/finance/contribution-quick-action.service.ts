import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContributionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionActionTokenService } from './contribution-action-token.service';
import { ContributionGovernanceService } from './contribution-governance.service';
import { QuickActionApproveDto } from './dto/quick-action-approve.dto';

@Injectable()
export class ContributionQuickActionService {
  constructor(
    private prisma: PrismaService,
    private tokens: ContributionActionTokenService,
    private governance: ContributionGovernanceService,
  ) {}

  async preview(actorUserId: string, token: string) {
    const payload = this.tokens.verifyApproveToken(token);
    this.tokens.assertTokenMatchesUser(payload.userId, actorUserId);

    const record = await this.loadSubmittedRecord(payload.contributionId);
    const member = record.member;
    const claimedAmount = Number(record.claimedAmount ?? record.amount);
    const family = record.familyId
      ? await this.prisma.family.findUnique({
          where: { id: record.familyId },
          select: { familyName: true, choirId: true },
        })
      : null;

    return {
      contributionId: record.id,
      referenceNumber: record.referenceNumber,
      memberName: member
        ? `${member.firstName} ${member.lastName}`.trim()
        : 'Member',
      claimedAmount,
      currency: record.currency ?? 'RWF',
      familyName: family?.familyName ?? null,
      status: record.status,
      canExecute: record.status === ContributionStatus.SUBMITTED,
      choirId: payload.choirId ?? family?.choirId ?? record.choirId ?? null,
      paymentAt: record.paymentAt,
      paymentChannel: record.paymentChannel,
    };
  }

  async approve(actorUserId: string, dto: QuickActionApproveDto) {
    const payload = this.tokens.verifyApproveToken(dto.token);
    this.tokens.assertTokenMatchesUser(payload.userId, actorUserId);

    const record = await this.loadSubmittedRecord(payload.contributionId);
    const claimedAmount = Number(record.claimedAmount ?? record.amount);

    return this.governance.approveFamily(actorUserId, payload.contributionId, {
      confirmedAmount: dto.confirmedAmount ?? claimedAmount,
      discrepancyReason: dto.discrepancyReason,
    });
  }

  private async loadSubmittedRecord(contributionId: string) {
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    if (record.status !== ContributionStatus.SUBMITTED) {
      throw new ForbiddenException('This claim is no longer pending approval');
    }

    return record;
  }
}

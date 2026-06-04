import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { assertMinistryServicesAccess } from '../ministry-services/ministry-services.util';
import {
  canCreateMinistryExpense,
  canApproveMinistryExpense,
  canReportMinistryFinance,
  hasGlobalMinistryFinanceManage,
  hasGlobalMinistryFinanceView,
} from './ministry-finance-access.util';

export async function assertMinistryFinanceAccess(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  await assertMinistryServicesAccess(access, actorUserId, ministryId);
  const actor = await access.resolveActor(actorUserId);
  if (!hasGlobalMinistryFinanceView(actor.permissions)) {
    throw new ForbiddenException('Ministry finance access denied');
  }
}

export async function assertMinistryFinanceManage(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  await assertMinistryServicesAccess(access, actorUserId, ministryId);
  const actor = await access.resolveActor(actorUserId);
  if (!hasGlobalMinistryFinanceManage(actor.permissions)) {
    throw new ForbiddenException('Ministry finance management denied');
  }
}

export async function assertAllowFinance(
  prisma: PrismaService,
  ministryId: string,
) {
  const settings = await prisma.ministrySettings.findUnique({
    where: { ministryId },
  });
  if (settings && settings.allowFinance === false) {
    throw new ForbiddenException('Ministry finance is disabled');
  }
}

export async function assertExpenseCreate(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  await assertMinistryServicesAccess(access, actorUserId, ministryId);
  const actor = await access.resolveActor(actorUserId);
  if (!canCreateMinistryExpense(actor.permissions)) {
    throw new ForbiddenException('Expense creation denied');
  }
}

export async function assertExpenseApprove(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  await assertMinistryServicesAccess(access, actorUserId, ministryId);
  const actor = await access.resolveActor(actorUserId);
  if (!canApproveMinistryExpense(actor.permissions)) {
    throw new ForbiddenException('Expense approval denied');
  }
}

export async function assertFinanceReport(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  await assertMinistryServicesAccess(access, actorUserId, ministryId);
  const actor = await access.resolveActor(actorUserId);
  if (!canReportMinistryFinance(actor.permissions)) {
    throw new ForbiddenException('Ministry finance reporting denied');
  }
}

export async function computeFundBalance(
  prisma: PrismaService,
  fundId: string,
): Promise<number> {
  const rows = await prisma.ministryFundTransaction.findMany({
    where: { fundId },
    select: { amount: true },
  });
  return rows.reduce((sum, r) => sum + Number(r.amount), 0);
}

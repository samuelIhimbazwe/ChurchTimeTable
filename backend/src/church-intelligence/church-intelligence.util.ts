import { ForbiddenException } from '@nestjs/common';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import {
  hasChurchIntelligenceManage,
  hasChurchIntelligenceView,
  hasChurchGovernanceView,
  hasChurchReportsExport,
  hasChurchReportsView,
} from './church-intelligence-access.util';

export async function assertChurchIntelligenceView(
  access: MinistryAccessService,
  actorUserId: string,
) {
  const actor = await access.resolveActor(actorUserId);
  if (!hasChurchIntelligenceView(actor.permissions)) {
    throw new ForbiddenException('Church intelligence access denied');
  }
}

export async function assertChurchIntelligenceManage(
  access: MinistryAccessService,
  actorUserId: string,
) {
  const actor = await access.resolveActor(actorUserId);
  if (!hasChurchIntelligenceManage(actor.permissions)) {
    throw new ForbiddenException('Church intelligence management denied');
  }
}

export async function assertChurchReportsView(
  access: MinistryAccessService,
  actorUserId: string,
) {
  const actor = await access.resolveActor(actorUserId);
  if (!hasChurchReportsView(actor.permissions)) {
    throw new ForbiddenException('Church reports access denied');
  }
}

export async function assertChurchReportsExport(
  access: MinistryAccessService,
  actorUserId: string,
) {
  const actor = await access.resolveActor(actorUserId);
  if (!hasChurchReportsExport(actor.permissions)) {
    throw new ForbiddenException('Church report export denied');
  }
}

export async function assertChurchGovernanceView(
  access: MinistryAccessService,
  actorUserId: string,
) {
  const actor = await access.resolveActor(actorUserId);
  if (!hasChurchGovernanceView(actor.permissions)) {
    throw new ForbiddenException('Church governance access denied');
  }
}

export async function assertMinistryVisible(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  const visible = await access.ministryIdsVisibleTo(actorUserId);
  if (visible !== null && !visible.includes(ministryId)) {
    throw new ForbiddenException('Ministry not visible');
  }
}

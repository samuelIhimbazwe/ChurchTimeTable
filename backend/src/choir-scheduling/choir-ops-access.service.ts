import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { OpsCapabilityResolverService } from '../common/choir/ops-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import type { ResolvedAuth } from '../common/choir/capability.types';
import {
  hasChoirOpsAttendance,
  hasChoirOpsAttendanceFromAuth,
  hasChoirOpsManage,
  hasChoirOpsManageFromAuth,
  hasChoirOpsRankingView,
  hasChoirOpsRankingViewFromAuth,
  hasChoirOpsReport,
  hasChoirOpsReportFromAuth,
  hasChoirOpsSchedule,
  hasChoirOpsScheduleFromAuth,
  hasChoirOpsView,
  hasChoirOpsViewFromAuth,
} from './choir-scheduling-access.util';

@Injectable()
export class ChoirOpsAccessService {
  constructor(
    private opsResolver: OpsCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  async resolveAuth(
    userId: string,
    choirId?: string,
  ): Promise<ResolvedAuth | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;
    return this.opsResolver.resolveGrantsToCapabilities(userId, id);
  }

  async canView(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsViewFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsView(resolved.permissions);
  }

  async canManage(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsManageFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsManage(resolved.permissions);
  }

  async canSchedule(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsScheduleFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsSchedule(resolved.permissions);
  }

  async canAttendance(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsAttendanceFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsAttendance(resolved.permissions);
  }

  async canRankingView(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsRankingViewFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsRankingView(resolved.permissions);
  }

  async canReport(userId: string, choirId?: string): Promise<boolean> {
    const auth = await this.resolveAuth(userId, choirId);
    if (auth) return hasChoirOpsReportFromAuth(auth);
    const resolved = await this.permissions.resolveForUser(userId);
    return hasChoirOpsReport(resolved.permissions);
  }

  async requireView(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canView(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }

  async requireManage(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManage(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }

  async requireSchedule(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canSchedule(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }

  async requireAttendance(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canAttendance(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }

  async requireRankingView(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canRankingView(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }

  async requireReport(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canReport(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }
}

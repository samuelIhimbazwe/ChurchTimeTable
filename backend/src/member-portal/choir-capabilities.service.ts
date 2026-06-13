import { Injectable, NotFoundException } from '@nestjs/common';
import { CHOIR_CAPABILITY_REGISTRY } from '../common/choir/choir-capability-registry';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { ChoirDashboardContextService } from './choir-dashboard-context.service';

@Injectable()
export class ChoirCapabilitiesService {
  constructor(private dashboardContext: ChoirDashboardContextService) {}

  async resolveForUser(userId: string, choirId: string) {
    const ctx = await this.dashboardContext.getContext(userId, choirId);
    if (!ctx.canAccess) {
      throw new NotFoundException('Not found');
    }

    const permissions = ctx.permissions;
    const capabilities = CHOIR_CAPABILITY_REGISTRY.filter((cap) =>
      cap.anyOf.some((code) => hasEffectivePermission(permissions, code)),
    ).map((cap) => ({
      id: cap.id,
      label: cap.label,
      desc: cap.desc,
      routeSegments: cap.routeSegments,
      group: cap.group,
      matchedPermission: cap.anyOf.find((code) =>
        hasEffectivePermission(permissions, code),
      ),
    }));

    return {
      choirId,
      totalRegistryCount: CHOIR_CAPABILITY_REGISTRY.length,
      visibleCount: capabilities.length,
      customRoleLabels: ctx.customRoles.map((r) => r.name),
      capabilities,
    };
  }
}

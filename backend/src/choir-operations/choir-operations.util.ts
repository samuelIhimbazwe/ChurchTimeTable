import { ForbiddenException } from '@nestjs/common';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';
import { PERMISSIONS } from '../common/constants/roles';

export function assertChoirOpsView(
  permissions: string[],
  managePermission: string,
) {
  const allowed =
    hasEffectivePermission(permissions, managePermission) ||
    hasChoirOperations(permissions) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_WELFARE_VIEW);
  if (!allowed) throw new ForbiddenException('Not allowed');
}

export function assertChoirOpsManage(
  permissions: string[],
  managePermission: string,
) {
  const allowed =
    hasEffectivePermission(permissions, managePermission) ||
    hasChoirOperations(permissions);
  if (!allowed) throw new ForbiddenException('Not allowed');
}

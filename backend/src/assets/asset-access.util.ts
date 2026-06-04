import { PERMISSIONS } from '../common/constants/roles';

export function hasGlobalAssetView(permissions: string[]): boolean {
  return (
    permissions.includes(PERMISSIONS.ASSET_MANAGE) ||
    permissions.includes(PERMISSIONS.ASSET_REPORT) ||
    permissions.includes(PERMISSIONS.ASSET_VIEW)
  );
}

export function hasGlobalAssetManage(permissions: string[]): boolean {
  return permissions.includes(PERMISSIONS.ASSET_MANAGE);
}

export function canManageAssetOwnership(permissions: string[]): boolean {
  return (
    hasGlobalAssetManage(permissions) ||
    permissions.includes(PERMISSIONS.ASSET_OWNERSHIP_MANAGE)
  );
}

export function canAssignAssets(permissions: string[]): boolean {
  return (
    hasGlobalAssetManage(permissions) ||
    permissions.includes(PERMISSIONS.ASSET_ASSIGN)
  );
}

export function canMaintainAssets(permissions: string[]): boolean {
  return (
    hasGlobalAssetManage(permissions) ||
    permissions.includes(PERMISSIONS.ASSET_MAINTAIN)
  );
}

export function canCreateAssets(permissions: string[]): boolean {
  return (
    hasGlobalAssetManage(permissions) ||
    permissions.includes(PERMISSIONS.ASSET_CREATE)
  );
}

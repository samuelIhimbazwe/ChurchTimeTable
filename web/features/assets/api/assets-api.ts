import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
}

export interface AssetListItem {
  id: string;
  code: string;
  name: string;
  status: string;
  condition: string;
  category: AssetCategory;
}

export interface AssetDetail extends AssetListItem {
  description?: string | null;
  serialNumber?: string | null;
  purchaseValue?: string | null;
  ownerships: Array<{
    id: string;
    ownerType: string;
    ownerId: string;
    ownershipPercentage?: string | null;
  }>;
  custodians: Array<{
    id: string;
    member: { id: string; firstName: string; lastName: string };
  }>;
  assignments: Array<{
    id: string;
    assignedToType: string;
    assignedToId: string;
    purpose?: string | null;
  }>;
}

export async function fetchAssetCategories() {
  const res = await http.get<ApiEnvelope<AssetCategory[]>>("/assets/categories");
  return res.data.data;
}

export async function fetchAssets(params?: {
  search?: string;
  categoryId?: string;
  status?: string;
}) {
  const res = await http.get<ApiEnvelope<AssetListItem[]>>("/assets", { params });
  return res.data.data;
}

export async function fetchAsset(id: string) {
  const res = await http.get<ApiEnvelope<AssetDetail>>(`/assets/${id}`);
  return res.data.data;
}

export async function fetchAssetActivity(id: string) {
  const res = await http.get<ApiEnvelope<unknown[]>>(`/assets/${id}/activity`);
  return res.data.data;
}

export async function fetchAssetReportInventory() {
  const res = await http.get<ApiEnvelope<unknown>>("/assets/reports/inventory");
  return res.data.data;
}

export async function fetchOverdueAssignments() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/assets/assignments/overdue");
  return res.data.data;
}

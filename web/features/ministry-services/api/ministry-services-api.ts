import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export interface MinistryAnnouncement {
  id: string;
  ministryId: string;
  title: string;
  content: string;
  priority: string;
  audienceType: string;
  publishedAt: string | null;
  isPinned: boolean;
  isActive: boolean;
}

export interface MinistryDocumentRow {
  id: string;
  ministryId: string;
  title: string;
  description: string | null;
  category: string;
  isArchived: boolean;
  currentVersion?: { fileUrl: string; fileName: string };
}

export interface MinistryMeetingRow {
  id: string;
  ministryId: string;
  title: string;
  scheduledAt: string;
  location: string | null;
  status: string;
}

export interface MinistryDashboardPayload {
  ministryId: string;
  members: number;
  operationalUnits: number;
  leaders: number;
  announcements: number;
  documents: number;
  meetings: number;
  recentActivity: Array<{ id: string; type: string; summary: string | null; createdAt: string }>;
  growthMetrics: { newMembersLast30Days: number };
}

export interface MinistryActivityItem {
  id: string;
  type: string;
  summary: string | null;
  createdAt: string;
  actorUserId: string | null;
}

export async function fetchMinistryAnnouncements(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryAnnouncement[]>>(
    `/ministries/${ministryId}/announcements`,
  );
  return res.data.data;
}

export async function fetchMinistryDocuments(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryDocumentRow[]>>(
    `/ministries/${ministryId}/documents`,
  );
  return res.data.data;
}

export async function fetchMinistryMeetings(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryMeetingRow[]>>(
    `/ministries/${ministryId}/meetings`,
  );
  return res.data.data;
}

export async function fetchMinistryDashboard(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryDashboardPayload>>(
    `/ministries/${ministryId}/dashboard`,
  );
  return res.data.data;
}

export async function fetchMinistryActivityFeed(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryActivityItem[]>>(
    `/ministries/${ministryId}/activity`,
  );
  return res.data.data;
}

export interface MinistryReportSummary {
  ministry: { id: string; code: string; name: string };
  generatedAt: string;
  metrics: MinistryDashboardPayload;
}

export async function fetchMinistryReportSummary(ministryId: string) {
  const res = await http.get<ApiEnvelope<MinistryReportSummary>>(
    `/ministries/${ministryId}/reports/summary`,
  );
  return res.data.data;
}

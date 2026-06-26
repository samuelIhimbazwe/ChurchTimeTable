import { Injectable } from '@nestjs/common';

@Injectable()
export class AppLinkService {
  baseUrl(): string {
    return (
      process.env.WEB_APP_URL ??
      process.env.FRONTEND_URL ??
      process.env.WEB_ORIGIN?.split(',')?.[0]?.trim() ??
      'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  portalContributions(): string {
    return `${this.baseUrl()}/portal/contributions`;
  }

  resetPassword(token: string): string {
    return `${this.baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  }

  portalDevotion(): string {
    return `${this.baseUrl()}/portal/devotion`;
  }

  choirAnnouncement(choirId: string, announcementId?: string): string {
    const base = `${this.baseUrl()}/choir/${choirId}/membership/announcements`;
    return announcementId ? `${base}?id=${announcementId}` : base;
  }

  choirJoinRequests(choirId: string, requestId?: string): string {
    const base = `${this.baseUrl()}/choir/${choirId}/president/decisions`;
    return requestId ? `${base}?requestId=${requestId}` : base;
  }
}

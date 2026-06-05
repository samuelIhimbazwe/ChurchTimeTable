import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChurchBrandingSettings = {
  churchName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  welcomeMessage: string | null;
};

const DEFAULT_BRANDING: ChurchBrandingSettings = {
  churchName: 'Church Management & Coordination System',
  logoUrl: null,
  coverImageUrl: null,
  primaryColor: '#2563eb',
  welcomeMessage:
    'Welcome to our church community. Join us for worship, fellowship, and service.',
};

@Injectable()
export class ChurchBrandingService {
  constructor(private prisma: PrismaService) {}

  async getPublicBranding(): Promise<ChurchBrandingSettings> {
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (config?.churchInfo ?? {}) as Record<string, unknown>;
    const branding = (info.branding ?? {}) as Record<string, unknown>;

    return {
      churchName:
        (typeof info.churchName === 'string' && info.churchName) ||
        DEFAULT_BRANDING.churchName,
      logoUrl: typeof branding.logoUrl === 'string' ? branding.logoUrl : null,
      coverImageUrl:
        typeof branding.coverImageUrl === 'string' ? branding.coverImageUrl : null,
      primaryColor:
        typeof branding.primaryColor === 'string'
          ? branding.primaryColor
          : DEFAULT_BRANDING.primaryColor,
      welcomeMessage:
        typeof branding.welcomeMessage === 'string'
          ? branding.welcomeMessage
          : DEFAULT_BRANDING.welcomeMessage,
    };
  }

  async updateBranding(
    actorUserId: string,
    data: Partial<ChurchBrandingSettings>,
  ) {
    const existing = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (existing?.churchInfo ?? {}) as Record<string, unknown>;
    const branding = (info.branding ?? {}) as Record<string, unknown>;

    const nextBranding = {
      ...branding,
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.coverImageUrl !== undefined
        ? { coverImageUrl: data.coverImageUrl }
        : {}),
      ...(data.primaryColor !== undefined ? { primaryColor: data.primaryColor } : {}),
      ...(data.welcomeMessage !== undefined
        ? { welcomeMessage: data.welcomeMessage }
        : {}),
    };

    const nextInfo = {
      ...info,
      ...(data.churchName ? { churchName: data.churchName } : {}),
      branding: nextBranding,
    };

    await this.prisma.churchConfiguration.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        churchInfo: nextInfo,
      },
      update: {
        churchInfo: nextInfo,
      },
    });

    return this.getPublicBranding();
  }
}

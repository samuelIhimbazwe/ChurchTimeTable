import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChurchLocationSettings = {
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  mapEmbedUrl: string | null;
  directionsUrl: string | null;
};

export type ChurchStreamingSettings = {
  /** When false (default), Igaburo service never shows a live stream link. Admin may enable. */
  igaburoLiveStreamEnabled: boolean;
  defaultLiveStreamUrl: string | null;
};

export type ChurchBrandingSettings = {
  churchName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  welcomeMessage: string | null;
  location: ChurchLocationSettings;
  streaming: ChurchStreamingSettings;
};

const DEFAULT_LOCATION: ChurchLocationSettings = {
  address: null,
  city: null,
  latitude: null,
  longitude: null,
  mapEmbedUrl: null,
  directionsUrl: null,
};

const DEFAULT_STREAMING: ChurchStreamingSettings = {
  igaburoLiveStreamEnabled: false,
  defaultLiveStreamUrl: null,
};

const DEFAULT_BRANDING: ChurchBrandingSettings = {
  churchName: 'Church Management & Coordination System',
  logoUrl: null,
  coverImageUrl: null,
  primaryColor: '#2563eb',
  welcomeMessage:
    'Welcome to our church community. Join us for worship, fellowship, and service.',
  location: DEFAULT_LOCATION,
  streaming: DEFAULT_STREAMING,
};

function parseLocation(raw: Record<string, unknown>): ChurchLocationSettings {
  const lat = raw.latitude;
  const lng = raw.longitude;
  return {
    address:
      typeof raw.address === 'string' && raw.address.trim()
        ? raw.address.trim()
        : null,
    city:
      typeof raw.city === 'string' && raw.city.trim() ? raw.city.trim() : null,
    latitude: typeof lat === 'number' ? lat : null,
    longitude: typeof lng === 'number' ? lng : null,
    mapEmbedUrl:
      typeof raw.mapEmbedUrl === 'string' && raw.mapEmbedUrl.trim()
        ? raw.mapEmbedUrl.trim()
        : null,
    directionsUrl:
      typeof raw.directionsUrl === 'string' && raw.directionsUrl.trim()
        ? raw.directionsUrl.trim()
        : null,
  };
}

function parseStreaming(raw: Record<string, unknown>): ChurchStreamingSettings {
  return {
    igaburoLiveStreamEnabled: raw.igaburoLiveStreamEnabled === true,
    defaultLiveStreamUrl:
      typeof raw.defaultLiveStreamUrl === 'string' &&
      raw.defaultLiveStreamUrl.trim()
        ? raw.defaultLiveStreamUrl.trim()
        : null,
  };
}

@Injectable()
export class ChurchBrandingService {
  constructor(private prisma: PrismaService) {}

  async getPublicBranding(): Promise<ChurchBrandingSettings> {
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (config?.churchInfo ?? {}) as Record<string, unknown>;
    const branding = (info.branding ?? {}) as Record<string, unknown>;
    const locationRaw = (info.location ?? branding.location ?? {}) as Record<
      string,
      unknown
    >;
    const streamingRaw = (info.streaming ??
      branding.streaming ??
      {}) as Record<string, unknown>;

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
      location: {
        ...DEFAULT_LOCATION,
        ...parseLocation(locationRaw),
      },
      streaming: {
        ...DEFAULT_STREAMING,
        ...parseStreaming(streamingRaw),
      },
    };
  }

  async updateBranding(
    actorUserId: string,
    data: Partial<
      Omit<ChurchBrandingSettings, 'location' | 'streaming'> & {
        location?: Partial<ChurchLocationSettings>;
        streaming?: Partial<ChurchStreamingSettings>;
      }
    >,
  ) {
    void actorUserId;
    const existing = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (existing?.churchInfo ?? {}) as Record<string, unknown>;
    const branding = (info.branding ?? {}) as Record<string, unknown>;
    const location = (info.location ?? {}) as Record<string, unknown>;
    const streaming = (info.streaming ?? {}) as Record<string, unknown>;

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

    const nextLocation = {
      ...location,
      ...(data.location?.address !== undefined
        ? { address: data.location.address }
        : {}),
      ...(data.location?.city !== undefined ? { city: data.location.city } : {}),
      ...(data.location?.latitude !== undefined
        ? { latitude: data.location.latitude }
        : {}),
      ...(data.location?.longitude !== undefined
        ? { longitude: data.location.longitude }
        : {}),
      ...(data.location?.mapEmbedUrl !== undefined
        ? { mapEmbedUrl: data.location.mapEmbedUrl }
        : {}),
      ...(data.location?.directionsUrl !== undefined
        ? { directionsUrl: data.location.directionsUrl }
        : {}),
    };

    const nextStreaming = {
      ...streaming,
      ...(data.streaming?.igaburoLiveStreamEnabled !== undefined
        ? { igaburoLiveStreamEnabled: data.streaming.igaburoLiveStreamEnabled }
        : {}),
      ...(data.streaming?.defaultLiveStreamUrl !== undefined
        ? { defaultLiveStreamUrl: data.streaming.defaultLiveStreamUrl }
        : {}),
    };

    const nextInfo = {
      ...info,
      ...(data.churchName ? { churchName: data.churchName } : {}),
      branding: nextBranding,
      location: nextLocation,
      streaming: nextStreaming,
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

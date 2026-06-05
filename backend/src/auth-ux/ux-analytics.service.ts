import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UxAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(
    eventType: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.uxAnalyticsEvent.create({
      data: {
        eventType,
        userId: userId ?? null,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

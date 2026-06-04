import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_ASSET_CATEGORIES } from './assets.constants';

@Injectable()
export class AssetSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const c of SYSTEM_ASSET_CATEGORIES) {
      await this.prisma.assetCategory.upsert({
        where: { code: c.code },
        create: {
          code: c.code,
          name: c.name,
          description: c.description,
          isSystem: true,
        },
        update: {
          name: c.name,
          description: c.description,
          isSystem: true,
        },
      });
    }
  }
}

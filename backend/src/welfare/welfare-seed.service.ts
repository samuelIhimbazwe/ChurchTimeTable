import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CATEGORIES = [
  { code: 'sickness', name: 'Sickness', sortOrder: 10 },
  { code: 'hospitalization', name: 'Hospitalization', sortOrder: 20 },
  { code: 'bereavement', name: 'Bereavement', sortOrder: 30 },
  { code: 'wedding', name: 'Wedding', sortOrder: 40 },
  { code: 'childbirth', name: 'Childbirth', sortOrder: 50 },
  { code: 'emergency', name: 'Emergency Support', sortOrder: 60 },
  { code: 'hardship', name: 'Financial Hardship', sortOrder: 70 },
  { code: 'disaster', name: 'House Disaster', sortOrder: 80 },
  { code: 'school', name: 'School Support', sortOrder: 90 },
  { code: 'prayer', name: 'Prayer Request', sortOrder: 100 },
];

@Injectable()
export class WelfareSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.prisma.welfareCategory.upsert({
        where: { code: cat.code },
        create: cat,
        update: { name: cat.name, sortOrder: cat.sortOrder, active: true },
      });
    }
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';

const CATEGORIES = [
  { code: 'worship', name: 'Worship', sortOrder: 10 },
  { code: 'praise', name: 'Praise', sortOrder: 20 },
  { code: 'thanksgiving', name: 'Thanksgiving', sortOrder: 30 },
  { code: 'offering', name: 'Offering', sortOrder: 40 },
  { code: 'communion', name: 'Communion', sortOrder: 50 },
  { code: 'easter', name: 'Easter', sortOrder: 60 },
  { code: 'christmas', name: 'Christmas', sortOrder: 70 },
  { code: 'funeral', name: 'Funeral', sortOrder: 80 },
  { code: 'wedding', name: 'Wedding', sortOrder: 90 },
];

const SECTIONS = [
  { code: 'soprano', name: 'Soprano', sortOrder: 10 },
  { code: 'alto', name: 'Alto', sortOrder: 20 },
  { code: 'tenor', name: 'Tenor', sortOrder: 30 },
  { code: 'bass', name: 'Bass', sortOrder: 40 },
];

@Injectable()
export class MusicSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const c of CATEGORIES) {
      await this.prisma.songCategory.upsert({
        where: { choirId_code: { choirId: MAIN_CHOIR_ID, code: c.code } },
        create: { ...c, choirId: MAIN_CHOIR_ID },
        update: { name: c.name, sortOrder: c.sortOrder, active: true },
      });
    }
    for (const s of SECTIONS) {
      await this.prisma.voiceSection.upsert({
        where: { code: s.code },
        create: s,
        update: { name: s.name, sortOrder: s.sortOrder, active: true },
      });
    }
  }
}

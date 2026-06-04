import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { PrismaService } from '../prisma/prisma.service';

export async function generateContributionReferenceNumber(
  prisma: PrismaService,
): Promise<string> {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    const referenceNumber = `CNT-${stamp}-${suffix}`;
    const existing = await prisma.contributionRecord.findUnique({
      where: { referenceNumber },
      select: { id: true },
    });
    if (!existing) {
      return referenceNumber;
    }
  }
  throw new BadRequestException('Could not allocate contribution reference');
}

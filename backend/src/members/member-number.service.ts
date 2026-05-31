import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const MEMBER_NUMBER_SEQUENCE_ID = 'primary';

@Injectable()
export class MemberNumberService {
  constructor(private prisma: PrismaService) {}

  formatMemberNumber(value: number): string {
    return `M${String(value).padStart(6, '0')}`;
  }

  async ensureSequenceRow(tx: Prisma.TransactionClient): Promise<void> {
    await tx.memberNumberSequence.upsert({
      where: { id: MEMBER_NUMBER_SEQUENCE_ID },
      create: { id: MEMBER_NUMBER_SEQUENCE_ID, nextValue: 1 },
      update: {},
    });
  }

  async generateMemberNumber(
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const allocate = async (client: Prisma.TransactionClient) => {
      await this.ensureSequenceRow(client);
      const updated = await client.memberNumberSequence.update({
        where: { id: MEMBER_NUMBER_SEQUENCE_ID },
        data: { nextValue: { increment: 1 } },
      });
      return this.formatMemberNumber(updated.nextValue - 1);
    };

    if (tx) {
      return allocate(tx);
    }

    return this.prisma.$transaction(allocate);
  }
}

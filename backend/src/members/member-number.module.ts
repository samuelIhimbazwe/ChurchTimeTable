import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberNumberService } from './member-number.service';

@Module({
  imports: [PrismaModule],
  providers: [MemberNumberService],
  exports: [MemberNumberService],
})
export class MemberNumberModule {}

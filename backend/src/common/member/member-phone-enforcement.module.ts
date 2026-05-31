import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PhoneOperationalGuard } from '../guards/phone-operational.guard';
import { MemberPhoneEnforcementService } from './member-phone-enforcement.service';

@Module({
  imports: [PrismaModule],
  providers: [MemberPhoneEnforcementService, PhoneOperationalGuard],
  exports: [MemberPhoneEnforcementService, PhoneOperationalGuard],
})
export class MemberPhoneEnforcementModule {}

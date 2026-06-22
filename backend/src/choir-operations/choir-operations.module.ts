import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirOperationsController } from './choir-operations.controller';
import { ChoirDocumentsService } from './choir-documents.service';
import { ChoirMeetingsService } from './choir-meetings.service';
import { ChoirUniformsService } from './choir-uniforms.service';
import { ChoirEquipmentService } from './choir-equipment.service';
import { ChoirAnnouncementsService } from './choir-announcements.service';
import { CommsCapabilityModule } from '../common/choir/comms-capability.module';
import { ChoirCommsAccessService } from './choir-comms-access.service';

@Module({
  imports: [AuthModule, AuditModule, NotificationsModule, MemberPhoneEnforcementModule, CommsCapabilityModule],
  controllers: [ChoirOperationsController],
  providers: [
    ChoirDocumentsService,
    ChoirMeetingsService,
    ChoirUniformsService,
    ChoirEquipmentService,
    ChoirAnnouncementsService,
    ChoirCommsAccessService,
  ],
  exports: [
    ChoirDocumentsService,
    ChoirMeetingsService,
    ChoirUniformsService,
    ChoirEquipmentService,
    ChoirAnnouncementsService,
    ChoirCommsAccessService,
  ],
})
export class ChoirOperationsModule {}

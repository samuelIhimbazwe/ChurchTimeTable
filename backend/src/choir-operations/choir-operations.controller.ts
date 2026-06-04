import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { ChoirDocumentsService } from './choir-documents.service';
import { ChoirMeetingsService } from './choir-meetings.service';
import { ChoirUniformsService } from './choir-uniforms.service';
import { ChoirEquipmentService } from './choir-equipment.service';

@Controller('choir')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirOperationsController {
  constructor(
    private documents: ChoirDocumentsService,
    private meetings: ChoirMeetingsService,
    private uniforms: ChoirUniformsService,
    private equipment: ChoirEquipmentService,
  ) {}

  @Get('documents')
  @SkipPhoneEnforcement()
  listDocuments(@CurrentUser() user: JwtPayload) {
    return this.documents.list(user.sub);
  }

  @Get('documents/:id')
  @SkipPhoneEnforcement()
  getDocument(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.documents.get(user.sub, id);
  }

  @Post('documents')
  createDocument(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      title: string;
      category?: string;
      description?: string;
      fileName: string;
      fileUrl: string;
      mimeType?: string;
    },
  ) {
    return this.documents.create(user.sub, dto);
  }

  @Get('meetings')
  @SkipPhoneEnforcement()
  listMeetings(@CurrentUser() user: JwtPayload) {
    return this.meetings.list(user.sub);
  }

  @Get('meetings/reports/actions')
  meetingActionReports(@CurrentUser() user: JwtPayload) {
    return this.meetings.reports(user.sub);
  }

  @Get('meetings/:id')
  @SkipPhoneEnforcement()
  getMeeting(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.meetings.get(user.sub, id);
  }

  @Post('meetings')
  createMeeting(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: { title: string; scheduledAt: string; location?: string; agenda?: string },
  ) {
    return this.meetings.create(user.sub, dto);
  }

  @Get('uniforms/dashboard')
  @SkipPhoneEnforcement()
  uniformsDashboard(@CurrentUser() user: JwtPayload) {
    return this.uniforms.dashboard(user.sub);
  }

  @Get('uniforms/types')
  @SkipPhoneEnforcement()
  uniformTypes(@CurrentUser() user: JwtPayload) {
    return this.uniforms.listTypes(user.sub);
  }

  @Get('equipment/dashboard')
  @SkipPhoneEnforcement()
  equipmentDashboard(@CurrentUser() user: JwtPayload) {
    return this.equipment.dashboard(user.sub);
  }
}

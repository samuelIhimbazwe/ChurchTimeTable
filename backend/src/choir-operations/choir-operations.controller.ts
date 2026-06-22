import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AnnouncementAudience, EquipmentCondition } from '@prisma/client';
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
import { ChoirAnnouncementsService } from './choir-announcements.service';

@Controller('choir')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirOperationsController {
  constructor(
    private documents: ChoirDocumentsService,
    private meetings: ChoirMeetingsService,
    private uniforms: ChoirUniformsService,
    private equipment: ChoirEquipmentService,
    private announcements: ChoirAnnouncementsService,
  ) {}

  @Get('documents')
  @SkipPhoneEnforcement()
  listDocuments(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.documents.list(user.sub, choirId);
  }

  @Get('documents/:id')
  @SkipPhoneEnforcement()
  getDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.documents.get(user.sub, id, choirId);
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
    @Query('choirId') choirId?: string,
  ) {
    return this.documents.create(user.sub, dto, choirId);
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
  uniformsDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.dashboard(user.sub, choirId);
  }

  @Get('uniforms/types')
  @SkipPhoneEnforcement()
  uniformTypes(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.listTypes(user.sub, choirId);
  }

  @Get('equipment/dashboard')
  @SkipPhoneEnforcement()
  equipmentDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.equipment.dashboard(user.sub, choirId);
  }

  @Post('uniforms/types')
  createUniformType(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: { choirId?: string; code: string; name: string; description?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.createType(user.sub, dto, choirId);
  }

  @Post('uniforms/items')
  createUniformItem(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: { uniformTypeId: string; label: string; size?: string; condition?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.createItem(user.sub, dto, choirId);
  }

  @Post('uniforms/assignments')
  issueUniform(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { uniformItemId: string; memberId: string; notes?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.issueUniform(user.sub, dto, choirId);
  }

  @Post('uniforms/assignments/:id/return')
  returnUniform(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: { notes?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.uniforms.returnUniform(user.sub, id, dto?.notes, choirId);
  }

  @Post('equipment')
  createEquipment(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      choirId?: string;
      name: string;
      category?: string;
      serialNumber?: string;
      condition?: EquipmentCondition;
      notes?: string;
    },
    @Query('choirId') choirId?: string,
  ) {
    return this.equipment.create(user.sub, dto, choirId);
  }

  @Post('equipment/:id/assign')
  assignEquipment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { memberId: string; notes?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.equipment.assign(user.sub, id, dto, choirId);
  }

  @Post('equipment/assignments/:id/return')
  returnEquipment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: { notes?: string },
    @Query('choirId') choirId?: string,
  ) {
    return this.equipment.returnAssignment(user.sub, id, dto?.notes, choirId);
  }

  @Get('announcements/music-notify')
  @SkipPhoneEnforcement()
  listMusicNotifyDelivery(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.announcements.listMusicNotifyDelivery(user.sub, choirId);
  }

  @Get('announcements/delivery')
  @SkipPhoneEnforcement()
  listAnnouncementDelivery(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.announcements.listAnnouncementDelivery(user.sub, choirId);
  }

  @Get('announcements')
  @SkipPhoneEnforcement()
  listAnnouncements(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.announcements.list(user.sub, choirId);
  }

  @Post('announcements')
  createAnnouncement(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      choirId: string;
      title: string;
      body: string;
      audience?: AnnouncementAudience;
      audienceRef?: string;
      expiresAt?: string;
      publish?: boolean;
    },
  ) {
    return this.announcements.create(user.sub, dto);
  }

  @Post('announcements/:id/publish')
  publishAnnouncement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.announcements.publish(user.sub, id);
  }
}

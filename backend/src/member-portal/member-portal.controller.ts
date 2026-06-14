import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MemberPortalDashboardService } from './member-portal-dashboard.service';
import { MemberPortalDevotionService } from './member-portal-devotion.service';
import { MemberPortalPrayerService } from './member-portal-prayer.service';
import { MemberPortalWeeklyActivitiesService } from './member-portal-weekly-activities.service';
import { MemberPortalParticipationScheduleService } from './member-portal-participation-schedule.service';
import { ChoirDashboardContextService } from './choir-dashboard-context.service';
import { ChoirSponsorDashboardContextService } from './choir-sponsor-dashboard-context.service';
import { ChoirSponsorCatalogService } from './choir-sponsor-catalog.service';
import { ChoirMyFamilyService } from './choir-my-family.service';
import { ProtocolDashboardContextService } from './protocol-dashboard-context.service';
import { ChoirCapabilitiesService } from './choir-capabilities.service';
import {
  MemberPortalChoirProfileService,
  type UpdateChoirPublicProfileBody,
} from './member-portal-choir-profile.service';

@Controller('member-portal')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MemberPortalController {
  constructor(
    private dashboard: MemberPortalDashboardService,
    private devotion: MemberPortalDevotionService,
    private prayer: MemberPortalPrayerService,
    private weeklyActivities: MemberPortalWeeklyActivitiesService,
    private participationScheduleService: MemberPortalParticipationScheduleService,
    private choirProfile: MemberPortalChoirProfileService,
    private choirDashboardCtx: ChoirDashboardContextService,
    private choirSponsorDashboardCtx: ChoirSponsorDashboardContextService,
    private choirSponsorCatalog: ChoirSponsorCatalogService,
    private choirMyFamilyService: ChoirMyFamilyService,
    private protocolDashboardCtx: ProtocolDashboardContextService,
    private choirCapabilities: ChoirCapabilitiesService,
  ) {}

  @Get('dashboard')
  @SkipPhoneEnforcement()
  portalDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.churchMemberDashboard(userId);
  }

  @Get('home')
  @SkipPhoneEnforcement()
  portalHome(@CurrentUser('sub') userId: string) {
    return this.dashboard.churchMemberDashboard(userId);
  }

  @Get('membership')
  @SkipPhoneEnforcement()
  membershipCenter(@CurrentUser('sub') userId: string) {
    return this.dashboard.membershipCenter(userId);
  }

  @Get('dashboard-context')
  dashboardContext(@CurrentUser('sub') userId: string) {
    return this.dashboard.dashboardContext(userId);
  }

  @Get('devotion-center')
  @SkipPhoneEnforcement()
  devotionCenter() {
    return this.devotion.devotionCenter();
  }

  @Post('prayer-requests')
  @SkipPhoneEnforcement()
  submitPrayerRequest(
    @CurrentUser('sub') userId: string,
    @Body()
    body: { content: string; shareIdentity?: boolean; displayName?: string },
  ) {
    return this.prayer.submitRequest(userId, body);
  }

  @Get('intercessors/prayer-requests')
  intercessorPrayerInbox(@CurrentUser('sub') userId: string) {
    return this.prayer.listForIntercessors(userId);
  }

  @Patch('intercessors/prayer-requests/:id')
  updatePrayerRequestStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: 'IN_PRAYER' | 'COMPLETED' },
  ) {
    return this.prayer.updateRequestStatus(userId, id, body.status);
  }

  @Get('weekly-activities')
  @SkipPhoneEnforcement()
  listWeeklyActivities() {
    return this.weeklyActivities.listAll();
  }

  @Get('participation-schedule')
  @SkipPhoneEnforcement()
  participationSchedule(@CurrentUser('sub') userId: string) {
    return this.participationScheduleService.buildForUser(userId);
  }

  @Get('weekly-activities/preview')
  @SkipPhoneEnforcement()
  weeklyActivitiesPreview() {
    return this.weeklyActivities.nearestDayPreview();
  }

  @Get('protocol/dashboard-context')
  @SkipPhoneEnforcement()
  protocolDashboardContext(@CurrentUser('sub') userId: string) {
    return this.protocolDashboardCtx.getContext(userId);
  }

  @Get('choirs/:id/my-family')
  @SkipPhoneEnforcement()
  choirMyFamily(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.choirMyFamilyService.getMyFamily(userId, id);
  }

  @Get('choirs/:id/dashboard-context')
  @SkipPhoneEnforcement()
  choirDashboardContext(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.choirDashboardCtx.getContext(userId, id);
  }

  @Get('choirs/:id/capabilities')
  @SkipPhoneEnforcement()
  getChoirCapabilities(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.choirCapabilities.resolveForUser(userId, id);
  }

  @Get('choirs/:id/sponsor/dashboard-context')
  @SkipPhoneEnforcement()
  choirSponsorDashboardContext(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.choirSponsorDashboardCtx.getContext(userId, id);
  }

  @Get('choirs/:id/sponsor/songs')
  @SkipPhoneEnforcement()
  choirSponsorSongs(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') search?: string,
  ) {
    return this.choirSponsorCatalog.listSongs(
      userId,
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
    );
  }

  @Get('choirs/:id/sponsor/songs/:songId')
  @SkipPhoneEnforcement()
  choirSponsorSong(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('songId') songId: string,
  ) {
    return this.choirSponsorCatalog.getSong(userId, id, songId);
  }

  @Get('choirs/:id/public')
  @SkipPhoneEnforcement()
  choirPublic(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.choirProfile.getPublicProfile(id, userId);
  }

  @Patch('choirs/:id/public')
  updateChoirPublic(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateChoirPublicProfileBody,
  ) {
    return this.choirProfile.updatePublicProfile(userId, id, body);
  }
}

import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ChurchWelcomeService } from './church-welcome.service';
import { ChurchBrandingService } from './church-branding.service';
import { ChurchGivingService } from './church-giving.service';
import { UxAnalyticsService } from './ux-analytics.service';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';

/** Public endpoints — no authentication required */
@Controller('church/public')
export class ChurchPublicController {
  constructor(
    private welcomeService: ChurchWelcomeService,
    private branding: ChurchBrandingService,
    private giving: ChurchGivingService,
    private discovery: ChoirDiscoveryService,
    private analytics: UxAnalyticsService,
  ) {}

  @Get('welcome')
  welcomePage() {
    return this.welcomeService.welcomePage();
  }

  @Get('branding')
  brandingSettings() {
    return this.branding.getPublicBranding();
  }

  @Get('giving')
  givingSettings() {
    return this.giving.getPublicGiving();
  }

  @Get('choirs')
  choirs() {
    return this.discovery.listPublic();
  }

  @Post('analytics')
  trackPublic(
    @Body() body: { eventType: string; metadata?: Record<string, unknown> },
  ) {
    return this.analytics.track(body.eventType, undefined, body.metadata);
  }
}

@Controller('analytics/ux')
export class UxAnalyticsController {
  constructor(private analytics: UxAnalyticsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
  track(
    @CurrentUser('sub') userId: string,
    @Body() body: { eventType: string; metadata?: Record<string, unknown> },
  ) {
    return this.analytics.track(body.eventType, userId, body.metadata);
  }
}

@Controller('church/branding')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChurchBrandingController {
  constructor(private branding: ChurchBrandingService) {}

  @Get()
  get() {
    return this.branding.getPublicBranding();
  }

  @Patch()
  @RequireUiCapability('admin-settings-manage')
  update(
    @CurrentUser('sub') _userId: string,
    @Body()
    body: {
      churchName?: string;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
      primaryColor?: string | null;
      welcomeMessage?: string | null;
      location?: {
        address?: string | null;
        city?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        mapEmbedUrl?: string | null;
        directionsUrl?: string | null;
      };
      streaming?: {
        igaburoLiveStreamEnabled?: boolean;
        defaultLiveStreamUrl?: string | null;
      };
    },
  ) {
    return this.branding.updateBranding(_userId, body);
  }
}

@Controller('church/giving')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchGivingController {
  constructor(private giving: ChurchGivingService) {}

  @Get()
  get() {
    return this.giving.getPublicGiving();
  }

  @Patch()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_FINANCE_MANAGE,
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  )
  update(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      tithesOfferings?: {
        momoNumber?: string | null;
        momoAccountName?: string | null;
        bankAccount?: string | null;
        bankName?: string | null;
        instructions?: string | null;
      };
      inyubako?: {
        momoNumber?: string | null;
        momoAccountName?: string | null;
        bankAccount?: string | null;
        bankName?: string | null;
        instructions?: string | null;
      };
    },
  ) {
    return this.giving.updateGiving(userId, body);
  }
}

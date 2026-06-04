import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ChurchSetupService, type SetupStepPayload } from './church-setup.service';
import { DeploymentReadinessService } from './deployment-readiness.service';
import { DemoModeService } from './demo-mode.service';

@Controller('setup')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class SetupController {
  constructor(
    private churchSetup: ChurchSetupService,
    private deploymentReadiness: DeploymentReadinessService,
    private demoMode: DemoModeService,
  ) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
    PERMISSIONS.PILOT_READINESS_VIEW,
  )
  getSetup(@CurrentUser('sub') userId: string) {
    return this.churchSetup.getSetup(userId);
  }

  @Post()
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
    PERMISSIONS.PILOT_READINESS_VIEW,
  )
  saveStep(@CurrentUser('sub') userId: string, @Body() body: SetupStepPayload) {
    return this.churchSetup.saveStep(userId, body);
  }

  @Get('status')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    PERMISSIONS.ADMIN_USERS_VIEW,
  )
  status(@CurrentUser('sub') userId: string) {
    return this.churchSetup.getStatus(userId);
  }

  @Get('readiness')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
  )
  getDeploymentReadiness(@CurrentUser('sub') userId: string) {
    return this.deploymentReadiness.score(userId);
  }

  @Patch('configuration')
  @RequireAnyPermissions(PERMISSIONS.ADMIN_SETTINGS_MANAGE)
  updateConfiguration(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirRules?: Record<string, unknown>;
      protocolRules?: Record<string, unknown>;
      schedulingRules?: Record<string, unknown>;
      notificationRules?: Record<string, unknown>;
      attendanceRules?: Record<string, unknown>;
      serviceTimes?: Record<string, unknown>;
    },
  ) {
    return this.churchSetup.updateLocalRules(userId, body);
  }

  @Post('demo/generate')
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
    PERMISSIONS.PILOT_READINESS_VIEW,
  )
  generateDemo(@CurrentUser('sub') userId: string) {
    return this.demoMode.generate(userId);
  }

  @Get('demo/status')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.ADMIN_SETTINGS_MANAGE,
  )
  demoStatus(@CurrentUser('sub') userId: string) {
    return this.demoMode.status(userId);
  }
}

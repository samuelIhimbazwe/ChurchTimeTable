import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { ChurchSetupService, type SetupStepPayload } from './church-setup.service';
import { DeploymentReadinessService } from './deployment-readiness.service';
import { DemoModeService } from './demo-mode.service';

@Controller('setup')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class SetupController {
  constructor(
    private churchSetup: ChurchSetupService,
    private deploymentReadiness: DeploymentReadinessService,
    private demoMode: DemoModeService,
  ) {}

  @Get()
  @RequireUiCapability('pilot-readiness-view')
  getSetup(@CurrentUser('sub') userId: string) {
    return this.churchSetup.getSetup(userId);
  }

  @Post()
  @RequireUiCapability('pilot-readiness-view')
  saveStep(@CurrentUser('sub') userId: string, @Body() body: SetupStepPayload) {
    return this.churchSetup.saveStep(userId, body);
  }

  @Get('status')
  @RequireUiCapability('pilot-readiness-view')
  status(@CurrentUser('sub') userId: string) {
    return this.churchSetup.getStatus(userId);
  }

  @Get('readiness')
  @RequireUiCapability('pilot-readiness-view')
  getDeploymentReadiness(@CurrentUser('sub') userId: string) {
    return this.deploymentReadiness.score(userId);
  }

  @Patch('configuration')
  @RequireUiCapability('admin-settings-manage')
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
  @RequireUiCapability('pilot-readiness-view')
  generateDemo(@CurrentUser('sub') userId: string) {
    return this.demoMode.generate(userId);
  }

  @Get('demo/status')
  @RequireUiCapability('pilot-readiness-view')
  demoStatus(@CurrentUser('sub') userId: string) {
    return this.demoMode.status(userId);
  }

  @Post('demo/clear')
  @RequireUiCapability('admin-settings-manage')
  clearDemo(@CurrentUser('sub') userId: string) {
    return this.demoMode.clear(userId);
  }
}


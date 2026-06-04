import { Injectable } from '@nestjs/common';
import { NotificationRuleTrigger } from '@prisma/client';
import { NotificationRulesService } from './notification-rules.service';

@Injectable()
export class NotificationRuleGateService {
  constructor(private rules: NotificationRulesService) {}

  async allows(trigger: NotificationRuleTrigger): Promise<boolean> {
    return this.rules.isEnabled(trigger);
  }
}

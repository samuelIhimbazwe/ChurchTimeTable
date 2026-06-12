import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { AuditModule } from '../audit/audit.module';

import { NotificationsModule } from '../notifications/notifications.module';

import { MinistriesModule } from '../ministries/ministries.module';

import { OperationalUnitsModule } from '../operational-units/operational-units.module';

import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

import { ChurchFacilitiesController } from './church-facilities.controller';

import { ChurchFacilitiesService } from './church-facilities.service';

import { ChurchScheduleSubmissionsController } from './church-schedule-submissions.controller';

import { ChurchScheduleTimetableController } from './church-schedule-timetable.controller';

import { ChurchScheduleSubmissionsService } from './church-schedule-submissions.service';

import { ChurchScheduleEntriesService } from './church-schedule-entries.service';

import { ChurchScheduleConflictService } from './church-schedule-conflict.service';

import { ChurchScheduleScopeService } from './church-schedule-scope.service';

import { ChurchScheduleNotificationsService } from './church-schedule-notifications.service';
import { ChurchScheduleDigestTask } from './church-schedule-digest.task';



@Module({

  imports: [

    AuthModule,

    AuditModule,

    NotificationsModule,

    MinistriesModule,

    OperationalUnitsModule,

    MemberPhoneEnforcementModule,

  ],

  controllers: [

    ChurchFacilitiesController,

    ChurchScheduleSubmissionsController,

    ChurchScheduleTimetableController,

  ],

  providers: [

    ChurchFacilitiesService,

    ChurchScheduleSubmissionsService,

    ChurchScheduleEntriesService,

    ChurchScheduleConflictService,

    ChurchScheduleScopeService,

    ChurchScheduleNotificationsService,

    ChurchScheduleDigestTask,

  ],

  exports: [

    ChurchFacilitiesService,

    ChurchScheduleSubmissionsService,

    ChurchScheduleEntriesService,

    ChurchScheduleScopeService,

  ],

})

export class ChurchScheduleModule {}


import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  ChoirJoinRequestStatus,
  ChoirJoinRequestType,
  ChoirSponsorRequestKind,
  ChoirSponsorRequestStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { ChoirId } from '../common/decorators/choir-id.decorator';
import { ChoirContextService } from './choir-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';
import { ChoirJoinRequestsService } from '../member-portal/choir-join-requests.service';
import { ChoirSponsorRequestsService } from '../member-portal/choir-sponsor-requests.service';
import { ChoirMembershipRulesService } from '../member-portal/choir-membership-rules.service';
import { ChoirMembersService } from './choir-members.service';
import { ChoirGovernanceService } from './choir-governance.service';
import { ChoirExecutiveDashboardService } from './choir-executive-dashboard.service';
import { UpdatePresidentDelegationDto } from './dto/update-president-delegation.dto';

import { IsString } from 'class-validator';

export class SwitchChoirDto {
  @IsString()
  choirId!: string;
}

@Controller('choirs')
@UseGuards(JwtAuthGuard, PhoneOperationalGuard)
export class ChoirsController {
  constructor(
    private choirContext: ChoirContextService,
    private prisma: PrismaService,
    private discovery: ChoirDiscoveryService,
    private joinRequests: ChoirJoinRequestsService,
    private sponsorRequests: ChoirSponsorRequestsService,
    private rules: ChoirMembershipRulesService,
    private choirMembers: ChoirMembersService,
    private choirGovernance: ChoirGovernanceService,
    private executiveDashboard: ChoirExecutiveDashboardService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.choirContext.listUserChoirs(user.sub);
  }

  @Get('active')
  async active(@CurrentUser() user: JwtPayload, @ChoirId() choirId: string) {
    const choir = await this.choirContext.resolveChoir(user.sub, choirId);
    const memberships = await this.choirContext.listUserChoirs(user.sub);
    const membership = memberships.find((m) => m.id === choir.id);
    return {
      ...choir,
      role: membership?.role ?? 'MEMBER',
    };
  }

  @Post('switch')
  async switch(@CurrentUser() user: JwtPayload, @Body() dto: SwitchChoirDto) {
    const choir = await this.choirContext.resolveChoir(user.sub, dto.choirId);
    return {
      choirId: choir.id,
      name: choir.name,
      code: choir.code,
    };
  }

  @Get('catalog')
  async catalog() {
    return this.prisma.choir.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });
  }

  @Get('public')
  listPublic(@CurrentUser() user: JwtPayload) {
    return this.discovery.listPublic(user.sub);
  }

  @Get('membership-rules')
  membershipRules(@CurrentUser() user: JwtPayload) {
    return this.rules.describeMembershipRules(user.sub);
  }

  @Get(':choirId/executive/officer-sla')
  getOfficerSla(
    @CurrentUser() user: JwtPayload,
    @Param('choirId') choirId: string,
  ) {
    return this.executiveDashboard.getOfficerSla(user.sub, choirId);
  }

  @Get(':choirId/executive/export/pdf')
  async exportExecutivePack(
    @CurrentUser() user: JwtPayload,
    @Param('choirId') choirId: string,
    @Res() res: Response,
  ) {
    const exported = await this.executiveDashboard.exportExecutivePackPdf(
      user.sub,
      choirId,
    );
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.buffer);
  }

  @Get(':choirId/governance/president-delegation')
  getPresidentDelegation(@Param('choirId') choirId: string) {
    return this.choirGovernance.getPresidentDelegation(choirId);
  }

  @Patch(':choirId/governance/president-delegation')
  updatePresidentDelegation(
    @CurrentUser() user: JwtPayload,
    @Param('choirId') choirId: string,
    @Body() dto: UpdatePresidentDelegationDto,
  ) {
    return this.choirGovernance.updatePresidentDelegation(user.sub, choirId, dto);
  }

  @Get('position-roles')
  listPositionRoles(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId: string,
  ) {
    return this.joinRequests.listPositionRoles(user.sub, choirId);
  }

  @Post('members/assign-position')
  assignMemberPosition(
    @CurrentUser() user: JwtPayload,
    @Body() body: { choirId: string; memberId: string; roleId: string },
  ) {
    return this.joinRequests.assignMemberPosition(user.sub, body);
  }

  @Post('members/revoke-position')
  revokeMemberPosition(
    @CurrentUser() user: JwtPayload,
    @Body() body: { choirId: string; memberId: string; roleId: string },
  ) {
    return this.joinRequests.revokeMemberPosition(user.sub, body);
  }

  @Post('join-requests')
  submitJoin(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      choirId: string;
      requestType?: ChoirJoinRequestType;
      reason?: string;
    },
  ) {
    return this.joinRequests.submit(user.sub, body);
  }

  @Get('join-requests')
  listJoin(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
    @Query('status') status?: ChoirJoinRequestStatus,
  ) {
    return this.joinRequests.list(user.sub, { choirId, status });
  }

  @Patch('join-requests/:id')
  reviewJoin(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
      reviewNotes?: string;
      assignedRoleId?: string;
      withdraw?: boolean;
    },
  ) {
    if (body.withdraw) {
      return this.joinRequests.withdraw(user.sub, id);
    }
    return this.joinRequests.review(user.sub, id, {
      status: body.status!,
      reviewNotes: body.reviewNotes,
      assignedRoleId: body.assignedRoleId,
    });
  }

  @Post('sponsor-requests')
  submitSponsor(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      choirId: string;
      kind?: ChoirSponsorRequestKind;
      message?: string;
    },
  ) {
    return this.sponsorRequests.submit(user.sub, body);
  }

  @Get('sponsor-requests')
  listSponsor(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
    @Query('status') status?: ChoirSponsorRequestStatus,
  ) {
    return this.sponsorRequests.list(user.sub, { choirId, status });
  }

  @Patch('sponsor-requests/:id')
  reviewSponsor(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'APPROVED' | 'REJECTED';
      reviewNotes?: string;
      withdraw?: boolean;
    },
  ) {
    if (body.withdraw) {
      return this.sponsorRequests.withdraw(user.sub, id);
    }
    return this.sponsorRequests.review(user.sub, id, {
      status: body.status!,
      reviewNotes: body.reviewNotes,
    });
  }

  @Get(':choirId/members')
  listMembers(
    @CurrentUser() user: JwtPayload,
    @Param('choirId') choirId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.choirMembers.listMembers(user.sub, choirId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProtocolInvitationsService } from './protocol-invitations.service';
import { ProtocolClaimsService } from './protocol-claims.service';

@Controller('protocol')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ProtocolPortalController {
  constructor(
    private invitations: ProtocolInvitationsService,
    private claims: ProtocolClaimsService,
  ) {}

  @Post('invitations')
  @RequireUiCapability('protocol-invite')
  sendInvitation(
    @CurrentUser('sub') userId: string,
    @Body()
    body: { memberId: string; message?: string; expiresInDays?: number },
  ) {
    return this.invitations.send(userId, body);
  }

  @Get('invitations/mine')
  myInvitations(@CurrentUser('sub') userId: string) {
    return this.invitations.listMine(userId);
  }

  @Get('invitations')
  @RequireUiCapability('protocol-invite')
  listInvitations(@CurrentUser('sub') userId: string) {
    return this.invitations.listSent(userId);
  }

  @Patch('invitations/:id')
  respondInvitation(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: 'ACCEPTED' | 'DECLINED' },
  ) {
    return this.invitations.respond(userId, id, body.status);
  }

  @Post('claims')
  submitClaim(
    @CurrentUser('sub') userId: string,
    @Body() body: { message?: string },
  ) {
    return this.claims.submit(userId, body.message);
  }

  @Get('claims')
  listClaims(@CurrentUser('sub') userId: string) {
    return this.claims.list(userId);
  }

  @Patch('claims/:id')
  @RequireUiCapability('protocol-claims-review')
  reviewClaim(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string },
  ) {
    return this.claims.review(userId, id, body);
  }
}

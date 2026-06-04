import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MinistryDocumentsService } from './ministry-documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UploadMinistryDocumentDto } from './dto/ministry-document.dto';

@Controller('ministries/:ministryId/documents')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryDocumentsController {
  constructor(private service: MinistryDocumentsService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DOCUMENT_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  list(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.service.list(user.sub, ministryId);
  }

  @Get(':id')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DOCUMENT_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  get(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') _ministryId: string,
    @Param('id') id: string,
  ) {
    return this.service.get(user.sub, id);
  }

  @Post()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DOCUMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  upload(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Body() dto: UploadMinistryDocumentDto,
  ) {
    return this.service.upload(user.sub, { ...dto, ministryId });
  }

  @Post(':id/versions')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DOCUMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  version(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UploadMinistryDocumentDto,
  ) {
    return this.service.addVersion(user.sub, id, dto);
  }

  @Patch(':id/archive')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_DOCUMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.archive(user.sub, id);
  }
}

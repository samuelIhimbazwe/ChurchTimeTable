import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { ADMIN_AUDIT_ACCESS, PERMISSIONS } from '../common/constants/roles';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequireAnyPermissions(
    ...ADMIN_AUDIT_ACCESS,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.CHOIR_RECORDS_VIEW,
  )
  findAll(
    @Query() query: PaginationDto & { entity?: string; entityId?: string },
  ) {
    return this.auditService.findAll(query.page, query.limit, {
      entity: query.entity,
      entityId: query.entityId,
    });
  }
}

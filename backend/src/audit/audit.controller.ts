import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  findAll(
    @Query() query: PaginationDto & { entity?: string; entityId?: string },
  ) {
    return this.auditService.findAll(query.page, query.limit, {
      entity: query.entity,
      entityId: query.entityId,
    });
  }
}

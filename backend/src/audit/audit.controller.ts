import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, UiCapabilityGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequireUiCapability('admin-audit-view')
  findAll(
    @Query() query: PaginationDto & { entity?: string; entityId?: string },
  ) {
    return this.auditService.findAll(query.page, query.limit, {
      entity: query.entity,
      entityId: query.entityId,
    });
  }
}

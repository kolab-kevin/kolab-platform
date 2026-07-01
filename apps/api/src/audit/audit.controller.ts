import type { AccessTokenPayload } from '@kolab/auth';
import type { AuditLogQuery } from '@kolab/types';
import { AuditLogQuerySchema } from '@kolab/types';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuditService } from './audit.service';

@ApiTags('audit-logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List audit logs for the active organization' })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  @ApiResponse({ status: 403, description: 'Organization context or permission required' })
  listAuditLogs(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(AuditLogQuerySchema)) query: AuditLogQuery,
  ) {
    return this.auditService.listAuditLogs(user, query);
  }
}

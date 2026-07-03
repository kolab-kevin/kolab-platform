import type { AccessTokenPayload } from '@kolab/auth';
import type {
  ExpiringContractsQuery,
  ExpiringDocumentsQuery,
  MissingDocumentsQuery,
} from '@kolab/types';
import {
  ExpiringContractsQuerySchema,
  ExpiringDocumentsQuerySchema,
  MissingDocumentsQuerySchema,
} from '@kolab/types';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatorsReportingService } from './creators-reporting.service';

@ApiTags('creators')
@ApiBearerAuth('access-token')
@Controller('creators')
export class CreatorsReportingController {
  constructor(private readonly creatorsReportingService: CreatorsReportingService) {}

  @Get('documents/expiring')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List expiring or expired creator documents for the organization' })
  @ApiResponse({ status: 200, description: 'Expiring creator documents report' })
  listExpiringDocuments(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(ExpiringDocumentsQuerySchema)) query: ExpiringDocumentsQuery,
  ) {
    return this.creatorsReportingService.listExpiringDocuments(user, query);
  }

  @Get('documents/missing')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List active creators missing required documents' })
  @ApiResponse({ status: 200, description: 'Missing creator documents report' })
  listMissingDocuments(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(MissingDocumentsQuerySchema)) query: MissingDocumentsQuery,
  ) {
    return this.creatorsReportingService.listMissingDocuments(user, query);
  }

  @Get('contracts/expiring')
  @RequirePermissions('crm:read')
  @ApiOperation({ summary: 'List expiring or expired creator contracts for the organization' })
  @ApiResponse({ status: 200, description: 'Expiring creator contracts report' })
  listExpiringContracts(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(ExpiringContractsQuerySchema)) query: ExpiringContractsQuery,
  ) {
    return this.creatorsReportingService.listExpiringContracts(user, query);
  }
}
